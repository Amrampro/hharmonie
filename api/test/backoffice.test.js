import test from "node:test";
import assert from "node:assert/strict";
import { preparePagination } from "../src/utils/sqlPagination.js";
import { sendApiError } from "../src/utils/apiError.js";
import { toMysqlDateTime } from "../src/utils/dateTime.js";
import { readExpectedSchema, planSchema } from "../scripts/schemaPlan.js";
import { loadController, response } from "./helpers.js";

test("pagination preserves bound filters and converts only trailing integer limits", () => {
  assert.deepEqual(preparePagination("SELECT * FROM products WHERE name = ? LIMIT ? OFFSET ?", ["' OR 1=1 --", 20, 0]), {
    sql: "SELECT * FROM products WHERE name = ? LIMIT 20 OFFSET 0", params: ["' OR 1=1 --"],
  });
  assert.deepEqual(preparePagination("SELECT * FROM events LIMIT ?", [50]), { sql: "SELECT * FROM events LIMIT 50", params: [] });
  assert.deepEqual(preparePagination("SELECT * FROM banners"), { sql: "SELECT * FROM banners", params: [] });
});
test("pagination rejects invalid or injected values", () => {
  for (const value of [-1, NaN, Infinity, 1.5, "10; DROP TABLE users", undefined]) {
    assert.throws(() => preparePagination("SELECT * FROM products LIMIT ?", [value]), { statusCode: 400 });
  }
});
test("database errors produce useful messages without SQL details", () => {
  for (const [code, status] of [["ER_NO_SUCH_TABLE",503],["ER_BAD_FIELD_ERROR",503],["ER_DUP_ENTRY",409],["ER_DATA_TOO_LONG",400],["ER_BAD_NULL_ERROR",400],["ER_NO_REFERENCED_ROW_2",400]]) {
    const res = response();
    sendApiError(res, { code, message: "secret SQL and connection details" });
    assert.equal(res.statusCode, status);
    assert.ok(!res.body.error.includes("secret"));
  }
});
test("dates accept datetime-local, SQL and ISO timezone input", () => {
  assert.equal(toMysqlDateTime("2026-09-16T12:30"), "2026-09-16 12:30:00");
  assert.equal(toMysqlDateTime("2026-09-16 12:30:00"), "2026-09-16 12:30:00");
  assert.equal(toMysqlDateTime("2026-09-16T12:30:00.000Z"), "2026-09-16 12:30:00");
  assert.equal(toMysqlDateTime("2026-09-16T12:30:00+02:00"), "2026-09-16 10:30:00");
  assert.equal(toMysqlDateTime(""), null);
  for (const value of ["not-a-date", "2026-02-30T12:30", "2026-02-30T12:30:00Z", "2026-09-16T25:00", "0000-01-01T12:00"]) assert.throws(() => toMysqlDateTime(value), { statusCode: 400 });
});
test("schema plan adds missing tables but never executes destructive initialization", () => {
  const expected = readExpectedSchema();
  for (const name of ["legal_links", "newsletter_subscribers", "ambassador_payouts"]) assert.ok(expected.some((table) => table.name === name));
  const plan = planSchema(expected, []);
  assert.equal(plan.statements.length, expected.length);
  assert.ok(plan.statements.every((sql) => sql.startsWith("CREATE TABLE IF NOT EXISTS") && !/DROP TABLE|USE hormone/.test(sql)));
  assert.ok(expected.find((table) => table.name === "blog_posts").columns.some((column) => column.name === "views"));
});
test("schema plan preserves existing definitions and is idempotent", () => {
  const expected = readExpectedSchema();
  const actual = expected.flatMap((table) => table.columns.map((column) => ({ TABLE_NAME: table.name, COLUMN_NAME: column.name, DATA_TYPE: "varchar", CHARACTER_MAXIMUM_LENGTH: 36 })));
  assert.deepEqual(planSchema(expected, actual), { statements: [], manual: [] });
  const plan = planSchema(expected, actual.filter((column) => !(column.TABLE_NAME === "blog_posts" && column.COLUMN_NAME === "views")));
  assert.deepEqual(plan.statements, ["ALTER TABLE `blog_posts` ADD COLUMN `views` INT NOT NULL DEFAULT 0;"]);
});
test("schema plan refuses to invent required columns or convert existing identifiers", () => {
  const expected = readExpectedSchema().filter((table) => table.name === "legal_links");
  const plan = planSchema(expected, [{ TABLE_NAME: "legal_links", COLUMN_NAME: "id", DATA_TYPE: "int", COLUMN_TYPE: "int" }]);
  assert.ok(plan.manual.some((message) => message.includes("UUID")));
  assert.ok(plan.manual.some((message) => message.includes("file")));
});
test("legal link reproduces the submitted URL without losing its query string", async () => {
  const url = "https://www.tiktok.com/@marielowe63?_r=1&_t=ZG-99khQKgN1yj";
  let saved;
  const controller = await loadController("legalLinksController", { query: async (sql, params) => {
    if (sql.includes("UUID()")) return [{ id: "uuid" }];
    if (sql.includes("INSERT INTO")) { saved = { id: params[0], name: params[1], file: params[2] }; return {}; }
    return [saved];
  } });
  const res = response();
  await controller.createLegalLink({ body: { name: "Tiktok", file: url } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.link.file, url);
});
test("legal links reject blank names and oversized URLs before writing", async () => {
  const controller = await loadController("legalLinksController", { query: async () => { throw new Error("Unexpected database access"); } });
  for (const body of [{ name: " ", file: "https://example.com" }, { name: "test", file: "x".repeat(501) }]) {
    const res = response();
    await controller.createLegalLink({ body }, res);
    assert.equal(res.statusCode, 400);
  }
});
test("missing legal-links table reports the required database update", async () => {
  const controller = await loadController("legalLinksController", { query: async () => { throw Object.assign(new Error("table missing"), { code: "ER_NO_SUCH_TABLE" }); } });
  const res = response();
  await controller.getLegalLinks({ query: {} }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, "DATABASE_SCHEMA_OUTDATED");
});
test("SMTP failure after a saved payout does not return a payment failure", async () => {
  const payout = { id: "saved-payout" };
  const controller = await loadController("admin/ambassadorsController", { query: async () => [] }, {
    "ambassadors.service.js": { listAmbassadorsAdmin() {}, computeAmbassadorDueCents() {}, createPayoutAdmin: async () => payout },
    "ambassadorPayout.service.js": { sendAmbassadorPayoutEmail: async () => { throw new Error("SMTP unavailable"); } },
  });
  const res = response();
  await controller.payAmbassador({ params: { id: "ambassador" }, body: { amount: 100 }, user: { id: "admin" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.payout.id, payout.id);
  assert.ok(res.body.warning);
});
