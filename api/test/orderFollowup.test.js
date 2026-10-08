import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { readExpectedSchema } from "../scripts/schemaPlan.js";
import { loadController, response } from "./helpers.js";
import { renderInvoiceEmail } from "../src/templates/invoiceEmailTemplate.js";

test("invoice uses company settings and escapes dynamic content", () => {
  const html = renderInvoiceEmail({ order: { id: "order", created_at: new Date(), currency: "EUR" }, items: [{ product_name: "<script>bad</script>", quantity: 1, unit_price: 1250, line_total: 1250 }], address: { full_name: "Client" }, company: { name: "Entreprise Test", email: "hello@example.com", phone: "12345", enterprise_number: "BE123" }, siteUrl: "https://hharmonie.com", orderUrl: "https://hharmonie.com/follow-order?order=order&token=private" });
  for (const text of ["Entreprise Test", "hello@example.com", "12345", "BE123", "/follow-order?"]) assert.ok(html.includes(text));
  assert.ok(!/noveden/i.test(html)); assert.ok(!html.includes("<script>"));
});

test("production return URL is a single origin and never localhost", async () => {
  for (const [environment, expected] of [
    [{ NODE_ENV: "production", CORS_ORIGIN: "http://localhost:5173" }, "https://hharmonie.com"],
    [{ PUBLIC_SITE_URL: "https://hharmonie.com/", CORS_ORIGIN: "https://old.example" }, "https://hharmonie.com"],
    [{ CORS_ORIGIN: "https://hharmonie.com,https://www.hharmonie.com" }, "https://hharmonie.com"],
    [{}, "http://localhost:5173"],
  ]) {
    const helper = await loadController("../utils/publicSite", {}, {}, environment);
    assert.equal(helper.publicSiteUrl(), expected);
  }
});

test("event link supports valid URLs and rejects executable links", async () => {
  const calls = [];
  const api = await loadController("eventsController", { query: async (sql, params) => { calls.push({ sql, params }); return []; } });
  const invalid = response(); await api.adminUpdateEvent({ params: { id: "event" }, body: { online_url: "javascript:alert(1)" } }, invalid);
  assert.equal(invalid.statusCode, 400); assert.equal(calls.length, 0);
  const valid = response(); await api.adminUpdateEvent({ params: { id: "event" }, body: { online_url: "https://example.com/event" } }, valid);
  assert.equal(valid.statusCode, 200); assert.equal(calls[0].params[0], "https://example.com/event");
});

test("order confirmation, private tracking, SMTP retry and additive migration", { skip: process.env.RUN_DB_TESTS !== "1" }, async () => {
  const { default: pool } = await import("../src/config/database.js");
  const connection = await pool.getConnection();
  const schema = `hh_order_test_${randomUUID().replaceAll("-", "")}`;
  const [[{ original }]] = await connection.query("SELECT DATABASE() AS original");
  let created = false;
  try {
    await connection.query("CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", [schema]); created = true;
    await connection.query("USE ??", [schema]);
    const expected = readExpectedSchema();
    for (const name of ["orders", "order_items", "order_addresses", "order_shipping", "order_payments", "parameters"]) {
      let sql = expected.find(table => table.name === name).create;
      sql = sql.split("\n").filter(line => !line.trimStart().startsWith("CONSTRAINT ") && !(name === "orders" && /^(tracking_token|invoice_send_started_at) /.test(line.trimStart()))).join("\n").replace(/,\s*\) ENGINE/, "\n) ENGINE");
      await connection.query(sql);
    }
    await connection.query("INSERT INTO orders (id, total_amount, subtotal_amount) VALUES ('order', 2500, 2500)");
    const migration = await readFile(new URL("../migrations/20261001_add_order_tracking.sql", import.meta.url), "utf8");
    for (const sql of migration.split(";").filter(s => s.trim())) await connection.query(sql);
    assert.equal((await connection.query("SELECT total_amount FROM orders WHERE id='order'"))[0][0].total_amount, 2500);
    await connection.query("INSERT INTO parameters (id,name,email,phone,enterprise_number) VALUES ('settings','Harmonie Test','support@example.com','12345','BE123')");
    await connection.query("INSERT INTO order_addresses (id,order_id,full_name,email,city,postal_code,address1) VALUES ('address','order','Client','client@example.com','Bruxelles','1000','Adresse test')");
    await connection.query("INSERT INTO order_items (id,order_id,product_id,product_name,quantity,unit_price,line_total) VALUES ('item','order','product','Produit test',1,2500,2500)");
    await connection.query("INSERT INTO order_payments (id,order_id,provider,status,stripe_checkout_session_id,amount,currency) VALUES ('payment','order','stripe','requires_payment','cs_test_order',2500,'EUR')");
    const database = { query: async (sql, params = []) => (await connection.execute(sql, params))[0], getConnection: async () => ({ execute: connection.execute.bind(connection), beginTransaction: connection.beginTransaction.bind(connection), commit: connection.commit.bind(connection), rollback: connection.rollback.bind(connection), release() {}, destroy() {} }) };
    const emails = []; let smtpFail = false;
    const session = { id: "cs_test_order", amount_total: 2500, currency: "eur", payment_status: "unpaid", payment_intent: "pi_test", metadata: { order_id: "order" } };
    class FakeStripe { checkout = { sessions: { retrieve: async () => session } }; }
    const overrides = { "mailer.js": { mailer: { sendMail: async message => { if (smtpFail) throw new Error("SMTP unavailable"); emails.push(message); } } }, stripe: { default: FakeStripe } };
    const environment = { STRIPE_SECRET_KEY: "sk_test_fake", PUBLIC_SITE_URL: "https://hharmonie.com", MAIL_FROM_EMAIL: "sender@example.com" };
    const payments = await loadController("../services/orderPayment.service", database, overrides, environment);
    const orders = await loadController("../services/orders.service", database, overrides, environment);
    await assert.rejects(orders.getOrderForUser({ orderId: "order" }));
    await payments.reconcileOrderPayment(session); assert.equal(emails.length, 0);
    assert.equal((await database.query("SELECT status FROM orders WHERE id='order'"))[0].status, "pending_payment");
    session.payment_status = "paid";
    await assert.rejects(payments.reconcileOrderPayment({ ...session, amount_total: 1 }));
    smtpFail = true; await assert.rejects(payments.reconcileOrderPayment(session));
    assert.equal((await database.query("SELECT status FROM orders WHERE id='order'"))[0].status, "paid");
    smtpFail = false; await payments.reconcileOrderPayment(session); await payments.reconcileOrderPayment(session);
    assert.equal(emails.length, 1); assert.equal(emails[0].from.name, "Harmonie Test"); assert.equal(emails[0].replyTo, "support@example.com");
    const saved = (await database.query("SELECT * FROM orders WHERE id='order'"))[0];
    assert.match(saved.tracking_token, /^[a-f0-9]{64}$/); assert.ok(saved.invoice_sent_at);
    await assert.rejects(orders.getOrderForUser({ orderId: "order", token: "0".repeat(64) }));
    const result = await orders.getOrderForUser({ orderId: "order", token: saved.tracking_token });
    assert.equal(result.items[0].product_name, "Produit test"); assert.equal(result.order.tracking_token, undefined); assert.ok(result.tracking_url.includes("/follow-order?"));
    const fromStripe = await orders.getOrderForUser({ sessionId: "cs_test_order" }); assert.equal(fromStripe.order.status, "paid");
    await connection.query("UPDATE orders SET status='shipped' WHERE id='order'");
    await payments.reconcileOrderPayment(session); assert.equal((await database.query("SELECT status FROM orders WHERE id='order'"))[0].status, "shipped"); assert.equal(emails.length, 1);
    const admin = await loadController("admin/ordersController", database, overrides, environment);
    const changed = response(); await admin.updateOrderStatus({ params: { id: "order" }, body: { status: "delivered" } }, changed);
    assert.equal(changed.statusCode, 200); assert.equal(changed.body.email_sent, true); assert.equal(emails.length, 2);
    const notification = emails[1];
    assert.equal(notification.to, "client@example.com"); assert.equal(notification.from.address, "sender@example.com");
    for (const text of ["Harmonie Test", "Produit test", "Sous-total", "Total", "Adresse test", "Avant : Expédiée", "Livrée", "/follow-order?"]) assert.ok(notification.html.includes(text), text);
    assert.ok(!notification.html.includes("NOVEDEN")); assert.ok(!notification.html.includes("Votre paiement est confirmé"));
    const unchanged = response(); await admin.updateOrderStatus({ params: { id: "order" }, body: { status: "delivered" } }, unchanged); assert.equal(emails.length, 2);
    const shipping = response(); await admin.updateOrderShipping({ params: { id: "order" }, body: { shipping_tracking_number: "TRACK123", shipping_status: "in_transit" } }, shipping);
    assert.equal(shipping.body.email_sent, true); assert.match(emails[2].html, /TRACK123/);
    smtpFail = true;
    const failedMail = response(); await admin.updateOrderStatus({ params: { id: "order" }, body: { status: "refunded" } }, failedMail);
    assert.equal(failedMail.statusCode, 200); assert.ok(failedMail.body.email_warning); assert.equal(failedMail.body.order.status, "refunded");
  } finally {
    await connection.query("USE ??", [original]);
    if (created) await connection.query("DROP DATABASE ??", [schema]);
    connection.release(); await pool.end();
  }
});


test("checkout ignores retired ambassador codes and creates no commissions", async () => {
  const writes = [];
  const connection = {
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {},
    execute: async (sql, params) => {
      if (sql.includes("FROM products")) return [[{ id: "product", name: "Produit", price: 25 }]];
      if (sql.includes("paid_count")) return [[{ paid_count: 1 }]];
      writes.push({ sql, params }); return [{ affectedRows: 1 }];
    },
  };
  class FakeStripe { checkout = { sessions: { create: async () => ({ id: "cs_fake", url: "https://checkout.stripe.com/fake" }) } }; }
  const api = await loadController("../services/orders.service", { getConnection: async () => connection, query: async () => { throw new Error("Unexpected lookup"); } }, { stripe: { default: FakeStripe } }, { STRIPE_SECRET_KEY: "fake" });
  const result = await api.createCheckout({ userId: 1, ambassador_code: "RETIRED", cart_items: [{ product_id: "product", quantity: 1 }], shipping: { method: "home_delivery", amount: 0, address: { full_name: "Client", email: "client@example.invalid", phone: "123", city: "Bruxelles", postal_code: "1000", address1: "Rue test" } } });
  assert.equal(result.order.total_amount, 2500); assert.equal(result.order.ambassador, undefined);
  assert.ok(writes.every(write => !/ambassador|commission/i.test(write.sql)));
  for (const { sql, params } of writes) assert.equal((sql.match(/\?/g) || []).length, params.length);
});
