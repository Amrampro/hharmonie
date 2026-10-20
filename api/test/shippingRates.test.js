import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { loadController } from "./helpers.js";
import { renderInvoicePdf } from "../src/services/invoicePdf.service.js";

test("shipping rejects missing fields, duplicate countries and negative prices", async () => {
  const api = await loadController("../services/shipping.service", { query() {}, getConnection() {} });
  const valid = { method: "home_delivery", address: { full_name: "Client", email: "client@example.com", phone: "+32470123456", country: "BE", city: "Charleroi", postal_code: "6000", address1: "Rue test" } };
  for (const key of Object.keys(valid.address)) {
    const input = structuredClone(valid); input.address[key] = " ";
    assert.throws(() => api.validateShippingAddress(input), key);
  }
  api.validateShippingAddress(structuredClone(valid));
  assert.throws(() => api.validateShippingAddress({ ...structuredClone(valid), method: "mondial_relay" }));
  const config = [{ method: "home_delivery", free_shipping_threshold_cents: null, rates: [{ country_code: "BE", country_name: "Belgique", amount_cents: 787 }] }, { method: "mondial_relay", free_shipping_threshold_cents: 28000, rates: [] }];
  api.validateShippingConfig(config);
  const negative = structuredClone(config); negative[0].rates[0].amount_cents = -1;
  assert.throws(() => api.validateShippingConfig(negative));
  const duplicate = structuredClone(config); duplicate[0].rates.push(duplicate[0].rates[0]);
  assert.throws(() => api.validateShippingConfig(duplicate));
});

test("shipping migration, configured rates and independent free thresholds", { skip: process.env.RUN_DB_TESTS !== "1" }, async () => {
  const { default: pool } = await import("../src/config/database.js");
  const connection = await pool.getConnection();
  const schema = `hh_shipping_${randomUUID().replaceAll("-", "")}`;
  const [[{ original }]] = await connection.query("SELECT DATABASE() AS original");
  try {
    await connection.query("CREATE DATABASE ??", [schema]);
    await connection.query("USE ??", [schema]);
    const migration = await readFile(new URL("../migrations/20261020_shipping_rates.sql", import.meta.url), "utf8");
    for (let pass = 0; pass < 2; pass++) for (const sql of migration.split(";").map(s => s.trim()).filter(Boolean)) await connection.query(sql);
    const database = { query: async (sql, params) => (await connection.execute(sql, params))[0], getConnection: async () => ({ execute: connection.execute.bind(connection), beginTransaction: connection.beginTransaction.bind(connection), commit: connection.commit.bind(connection), rollback: connection.rollback.bind(connection), release() {} }) };
    const api = await loadController("../services/shipping.service", database);
    const methods = await api.getShippingConfig();
    assert.equal(methods.find(m => m.method === "mondial_relay").rates.length, 8);
    assert.equal(methods.find(m => m.method === "home_delivery").rates.length, 6);
    assert.equal(await api.calculateShipping(connection, "mondial_relay", "BE", 100), 430);
    assert.equal(await api.calculateShipping(connection, "home_delivery", "BE", 30000), 787);
    await assert.rejects(api.calculateShipping(connection, "mondial_relay", "AT", 30000));
    await assert.rejects(api.calculateShipping(connection, "home_delivery", "DE", 30000));
    methods.find(m => m.method === "mondial_relay").free_shipping_threshold_cents = 28000;
    await api.saveShippingConfig(methods);
    assert.equal(await api.calculateShipping(connection, "mondial_relay", "BE", 27999), 430);
    assert.equal(await api.calculateShipping(connection, "mondial_relay", "BE", 28000), 0);
    assert.equal(await api.calculateShipping(connection, "home_delivery", "BE", 28000), 787);
    methods.find(m => m.method === "mondial_relay").free_shipping_threshold_cents = null;
    await api.saveShippingConfig(methods);
    assert.equal(await api.calculateShipping(connection, "mondial_relay", "BE", 99999), 430);
  } finally {
    await connection.query("USE ??", [original]);
    await connection.query("DROP DATABASE ??", [schema]);
    connection.release(); await pool.end();
  }
});

test("PDF invoice is generated for long multi-page orders", async () => {
  const pdf = await renderInvoicePdf({
    order: { id: "test", currency: "EUR", created_at: "2026-10-20", subtotal_amount: 5000, discount_amount: 0, shipping_amount: 430, total_amount: 5430 },
    address: { full_name: "Client", city: "Charleroi", country: "BE" },
    items: Array.from({ length: 60 }, () => ({ product_name: "Produit de test avec une description assez longue pour occuper plusieurs lignes", quantity: 1, unit_price: 100, line_total: 100 })),
  }, { name: "Entreprise Test" });
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok((pdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length > 1);
});

test("invoice download requires private access and confirmed payment", async () => {
  let status = "pending_payment";
  const api = await loadController("orders.controller", { query: async () => [{ name: "Entreprise" }] }, {
    "orders.service.js": {
      createCheckout() {}, lookupOrder() {},
      async getOrderForUser({ token }) {
        if (token !== "private") throw new Error("Forbidden");
        return { order: { id: "test", status, created_at: "2026-10-20", subtotal_amount: 1000, discount_amount: 0, shipping_amount: 430, total_amount: 1430 }, items: [], address: {} };
      },
    },
  });
  const response = () => ({ statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; }, setHeader(key, value) { this.headers[key] = value; }, json(data) { this.body = data; }, send(data) { this.body = data; } });
  const denied = response(); await api.invoice({ params: { id: "test" }, query: {} }, denied);
  assert.equal(denied.statusCode, 404);
  const unpaid = response(); await api.invoice({ params: { id: "test" }, query: { token: "private" } }, unpaid);
  assert.equal(unpaid.statusCode, 409);
  status = "paid";
  const paid = response(); await api.invoice({ params: { id: "test" }, query: { token: "private" } }, paid);
  assert.equal(paid.headers["Content-Type"], "application/pdf");
  assert.match(paid.headers["Content-Disposition"], /attachment/);
  assert.equal(paid.body.subarray(0, 5).toString(), "%PDF-");
});

