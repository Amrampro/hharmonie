import test from "node:test";
import assert from "node:assert/strict";
import { validateConsultation } from "../src/utils/consultationForm.js";
import express from "express";
import { loadController } from "./helpers.js";

export const consultationPayload = () => ({
  service_id: "service-test", slot_id: "slot-test", first_name: "Camille", last_name: "Test",
  email: "consultation@example.invalid", phone: "+32470000000", gender: "female", age: 32,
  baby_project: false, main_concern: "Préoccupation principale", consulted_professional: true,
  exams_description: "Bilan récent", has_diagnosis: true, diagnosis_details: "Diagnostic précisé",
  consultation_reasons: ["medical_followup", "other"], consultation_reason_other: "Autre motif précisé",
});

test("consultation accepts all eight answers and preserves explicit No values", () => {
  const data = validateConsultation(consultationPayload());
  assert.equal(data.baby_project, 0);
  assert.equal(data.consulted_professional, 1);
  assert.equal(data.age, 32);
  assert.deepEqual(data.consultation_reasons, ["medical_followup", "other"]);
});
test("consultation requires age, choices, concern and conditional explanations", () => {
  for (const patch of [{ age: 0 }, { age: 32.5 }, { age: "32" }, { baby_project: "false" }, { gender: "" }, { main_concern: " " }, { diagnosis_details: "" }, { consultation_reason_other: "" }, { consultation_reasons: [] }, { consultation_reasons: ["unexpected"] }]) {
    assert.throws(() => validateConsultation({ ...consultationPayload(), ...patch }), { statusCode: 400 });
  }
});
test("consultation removes stale hidden answers when No and no Other are selected", () => {
  const data = validateConsultation({ ...consultationPayload(), has_diagnosis: false, consultation_reasons: ["lifestyle", "lifestyle"] });
  assert.equal(data.diagnosis_details, null);
  assert.equal(data.consultation_reason_other, null);
  assert.deepEqual(data.consultation_reasons, ["lifestyle"]);
});
test("consultation validates attachment signatures, counts and sizes", () => {
  const pdf = { originalname: "exam.pdf", mimetype: "application/pdf", buffer: Buffer.from("%PDF-1.7\nTest") };
  const jpg = { originalname: "exam.jpg", mimetype: "image/jpeg", buffer: Buffer.from([255, 216, 255, 224]) };
  const png = { originalname: "exam.png", mimetype: "image/png", buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) };
  assert.doesNotThrow(() => validateConsultation(consultationPayload(), [pdf, jpg, png]));
  for (const files of [[pdf, pdf, pdf, pdf], [{ ...pdf, buffer: Buffer.from("<html>not a PDF</html>") }], [{ ...pdf, buffer: Buffer.alloc(0) }], [{ ...pdf, buffer: Buffer.alloc(5 * 1024 * 1024 + 1) }]]) {
    assert.throws(() => validateConsultation(consultationPayload(), files), { statusCode: 400 });
  }
});

test("HTTP submission accepts multipart answers and documents; downloads require admin authentication", async () => {
  const writes = [];
  const connection = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {},
    execute: async (sql, values) => {
      if (sql.startsWith("SELECT * FROM appointment_slots")) return [[{ id: "slot-test", price: 0 }]];
      writes.push({ sql, values });
      return [{ insertId: 123, affectedRows: 1 }];
    },
  };
  const router = await loadController("../routes/appointments.routes", { query: async () => [], getConnection: async () => connection });
  const app = express();
  app.use(express.json());
  app.use("/api/appointments", router.default);
  const server = await new Promise((resolve) => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
  const base = `http://127.0.0.1:${server.address().port}/api/appointments`;
  try {
    assert.equal((await fetch(`${base}/admin/documents/test-id`)).status, 401);
    assert.equal((await fetch(`${base}/documents/test-id`)).status, 404);
    const multipart = new FormData();
    multipart.append("data", JSON.stringify(consultationPayload()));
    multipart.append("documents", new Blob(["%PDF-1.7\nTest"], { type: "application/pdf" }), "exam.pdf");
    const created = await fetch(`${base}/book`, { method: "POST", body: multipart });
    assert.equal(created.status, 201, JSON.stringify(await created.json()));
    assert.ok(writes.some((write) => write.sql.includes("INSERT INTO appointment_document_chunks")));
    const invalid = new FormData();
    invalid.append("data", JSON.stringify(consultationPayload()));
    invalid.append("documents", new Blob(["not a pdf"], { type: "application/pdf" }), "exam.pdf");
    assert.equal((await fetch(`${base}/book`, { method: "POST", body: invalid })).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
