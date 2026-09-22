import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { readExpectedSchema } from "../scripts/schemaPlan.js";
import { loadController, response } from "./helpers.js";
import { priceInCents } from "../src/services/appointmentPayments.js";

test("appointment prices accept free or euro cents, never negative or fractional cents", () => {
  assert.equal(priceInCents(0), 0); assert.equal(priceInCents("65.99"), 6599);
  for (const value of [-1, "", null, true, "1.001", "abc", "0.49", Infinity]) assert.throws(() => priceInCents(value), { statusCode: 400 });
});

test("appointment payments: additive migration, free, paid, expiry, retry and payment failure", { skip: process.env.RUN_DB_TESTS !== "1" }, async () => {
  const { default: pool } = await import("../src/config/database.js");
  const connection = await pool.getConnection();
  const schema = `hh_payment_test_${randomUUID().replaceAll("-", "")}`;
  const [[{ original }]] = await connection.query("SELECT DATABASE() AS original");
  let created = false;
  try {
    await connection.query("CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", [schema]); created = true;
    await connection.query("USE ??", [schema]);
    await connection.query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    const expected = readExpectedSchema();
    const paymentFields = ["amount_cents", "payment_status", "stripe_session_id", "payment_expires_at"];
    for (const name of ["appointment_services", "appointment_slots", "appointments", "appointment_documents", "appointment_document_chunks"]) {
      let sql = expected.find(table => table.name === name).create;
      if (name === "appointment_slots") sql = sql.split("\n").filter(line => !line.trimStart().startsWith("price ")).join("\n");
      if (name === "appointments") sql = sql.split("\n").filter(line => !paymentFields.some(field => line.trimStart().startsWith(`${field} `))).join("\n").replace(",'pending_payment','payment_expired'", "");
      await connection.query(sql);
    }
    await connection.query("INSERT INTO appointment_services (id,name,slug,price) VALUES ('service','Consultation','consultation',65)");
    for (const id of ["legacy", "free", "paid", "expired", "failure"]) await connection.query("INSERT INTO appointment_slots (id,service_id,available_date,start_time,end_time) VALUES (?, 'service', '2099-01-01', '10:00', '11:00')", [id]);
    await connection.query("INSERT INTO appointments (appointment_number,service_id,slot_id,first_name,last_name,email) VALUES ('OLD','service','legacy','Old','Client','old@example.com')");
    const migration = await readFile(new URL("../migrations/20260922_add_appointment_payments.sql", import.meta.url), "utf8");
    for (const sql of migration.split(";").filter(s => s.trim())) await connection.query(sql);
    assert.equal(Number((await connection.query("SELECT price FROM appointment_slots WHERE id='paid'"))[0][0].price), 65);
    assert.equal((await connection.query("SELECT payment_status FROM appointments WHERE appointment_number='OLD'"))[0][0].payment_status, null);
    await connection.query("UPDATE appointment_slots SET price=0 WHERE id='free'");
    const database = {
      query: async (sql, params = []) => (await connection.execute(sql, params))[0],
      getConnection: async () => ({ execute: connection.execute.bind(connection), beginTransaction: connection.beginTransaction.bind(connection), commit: connection.commit.bind(connection), rollback: connection.rollback.bind(connection), release() {}, destroy() {} }),
    };
    const sessions = new Map(); const calls = []; let fail = false;
    class FakeStripe {
      checkout = { sessions: {
        create: async payload => {
          calls.push(payload); if (fail) throw new Error("Stripe unavailable");
          const session = { id: `cs_test_${calls.length}`, url: `https://checkout.stripe.com/test${calls.length}`, status: "open", payment_status: "unpaid", amount_total: payload.line_items[0].price_data.unit_amount, currency: "eur", metadata: payload.metadata, expires_at: payload.expires_at };
          sessions.set(session.id, session); return session;
        },
        retrieve: async id => sessions.get(id),
        expire: async id => { sessions.get(id).status = "expired"; return sessions.get(id); },
      } };
    }
    const environment = { STRIPE_SECRET_KEY: "sk_test_fake", CORS_ORIGIN: "https://site.example" };
    const api = await loadController("appointmentsController", database, { stripe: { default: FakeStripe } }, environment);
    const payments = await loadController("../services/appointmentPayments", database, { stripe: { default: FakeStripe } }, environment);
    const body = { service_id: "service", slot_id: "free", first_name: "Camille", last_name: "Test", email: "test@example.com", phone: "", gender: "female", age: 32, baby_project: false, main_concern: "Question", consulted_professional: false, exams_description: "", has_diagnosis: false, diagnosis_details: "", consultation_reasons: ["lifestyle"], consultation_reason_other: "" };
    const book = async (slot, extra = {}) => { const res = response(); await api.bookAppointment({ body: { ...body, slot_id: slot, ...extra }, files: [] }, res); return res; };
    const free = await book("free"); assert.equal(free.statusCode, 201, JSON.stringify(free.body)); assert.equal(free.body.checkout_url, null); assert.equal(free.body.payment_status, "free"); assert.equal(calls.length, 0);
    const paid = await book("paid", { price: 0, amount_cents: 0 }); assert.equal(paid.statusCode, 201, JSON.stringify(paid.body)); assert.equal(paid.body.payment_status, "pending"); assert.equal(calls[0].line_items[0].price_data.unit_amount, 6500);
    assert.equal(calls[0].line_items[0].price_data.currency, "eur"); assert.equal(calls[0].metadata.main_concern, undefined);
    assert.equal((await book("paid")).statusCode, 409);
    const modify = response(); await api.adminUpdateSlot({ params: { id: "paid" }, body: { price: 0, status: "available" } }, modify); assert.equal(modify.statusCode, 409);
    const session = sessions.get("cs_test_1");
    await payments.reconcileAppointmentPayment(session);
    let saved = (await database.query("SELECT * FROM appointments WHERE slot_id='paid'"))[0]; assert.equal(saved.status, "pending_payment");
    await assert.rejects(payments.reconcileAppointmentPayment({ ...session, amount_total: 1, payment_status: "paid" }));
    session.payment_status = "paid"; session.status = "complete";
    await payments.reconcileAppointmentPayment(session); await payments.reconcileAppointmentPayment(session);
    saved = (await database.query("SELECT * FROM appointments WHERE slot_id='paid'"))[0]; assert.equal(saved.status, "confirmed"); assert.equal(saved.payment_status, "paid");
    assert.equal((await payments.getAppointmentPayment(session.id)).payment_status, "paid");
    await book("expired"); const expired = sessions.get("cs_test_2"); expired.status = "expired";
    await payments.reconcileAppointmentPayment(expired); await payments.reconcileAppointmentPayment(expired);
    assert.equal((await database.query("SELECT status FROM appointment_slots WHERE id='expired'"))[0].status, "available");
    assert.equal((await database.query("SELECT payment_status FROM appointments WHERE slot_id='expired'"))[0].payment_status, "expired");
    assert.equal((await book("expired")).statusCode, 201);
    await payments.reconcileAppointmentPayment(expired); // Late duplicate must not release a newer hold.
    assert.equal((await database.query("SELECT status FROM appointment_slots WHERE id='expired'"))[0].status, "booked");
    fail = true; assert.equal((await book("failure")).statusCode, 500);
    assert.equal((await database.query("SELECT status FROM appointment_slots WHERE id='failure'"))[0].status, "available");
    assert.equal((await database.query("SELECT COUNT(*) AS total FROM appointments WHERE slot_id='failure'"))[0].total, 0);
  } finally {
    await connection.query("USE ??", [original]);
    if (created) await connection.query("DROP DATABASE ??", [schema]);
    connection.release(); await pool.end();
  }
});
