import { randomUUID } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { readExpectedSchema } from "../scripts/schemaPlan.js";
import { preparePagination } from "../src/utils/sqlPagination.js";
import { loadController, response } from "./helpers.js";
import { readFile } from "node:fs/promises";

test("backoffice against strict SQL in isolated temporary tables", { skip: process.env.RUN_DB_TESTS !== "1" }, async (t) => {
  const { default: pool } = await import("../src/config/database.js");
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    const expected = readExpectedSchema();
    const recreate = async (name, idDefinition, excludeColumns = []) => {
      // DROP TEMPORARY cannot delete the real application's table.
      await connection.query(`DROP TEMPORARY TABLE IF EXISTS \`${name}\``);
      let sql = expected.find((table) => table.name === name).create.replace("CREATE TABLE IF NOT EXISTS", "CREATE TEMPORARY TABLE");
      // InnoDB TEMPORARY tables do not support foreign keys. Keep all column,
      // enum, unique and NOT NULL constraints for these strict-mode tests.
      sql = sql.split("\n").filter((line) => !/^\s*CONSTRAINT /.test(line)).join("\n").replace(/,\s*\) ENGINE/, "\n) ENGINE");
      sql = sql.split("\n").filter((line) => !excludeColumns.some((column) => line.trimStart().startsWith(`${column} `))).join("\n");
      if (idDefinition) sql = sql.replace(/  id [^\n]+/, `  id ${idDefinition},`);
      await connection.query(sql);
    };
    const database = { getConnection: async () => ({
      execute: connection.execute.bind(connection),
      beginTransaction: connection.beginTransaction.bind(connection),
      commit: connection.commit.bind(connection),
      rollback: connection.rollback.bind(connection),
      release() {}, // Keep this isolated session for the next test.
      destroy: connection.destroy.bind(connection),
    }), query: async (sql, params = []) => {
      const prepared = preparePagination(sql, params);
      return (await connection.execute(prepared.sql, prepared.params))[0];
    } };

    await t.test("legal link with the reported URL: create, read, update and delete", async () => {
      await recreate("legal_links");
      const api = await loadController("legalLinksController", database);
      const res = response();
      const url = "https://www.tiktok.com/@marielowe63?_r=1&_t=ZG-99khQKgN1yj";
      await api.createLegalLink({ body: { name: "Tiktok", file: url, display_order: 0, is_active: true } }, res);
      assert.equal(res.statusCode, 201, JSON.stringify(res.body));
      const id = res.body.link.id;
      assert.equal(res.body.link.file, url);
      const list = response();
      await api.getLegalLinks({ query: {} }, list);
      assert.equal(list.body.links.length, 1);
      const update = response();
      await api.updateLegalLink({ params: { id }, body: { name: "TikTok", is_active: false } }, update);
      assert.equal(update.body.link.is_active, 0);
      const deletion = response();
      await api.deleteLegalLink({ params: { id } }, deletion);
      assert.equal(deletion.body.success, true);
    });
    await t.test("image-only banner: create and clear title on update", async () => {
      await recreate("banners");
      const api = await loadController("bannersController", database);
      for (const title of [null, undefined, "", "Titre"]) {
        const res = response();
        await api.createBanner({ body: { page_name: "shop", title, background_img: "https://hharmonie.com/uploads/products/test.jpeg" } }, res);
        assert.equal(res.statusCode, 201, JSON.stringify(res.body));
        assert.equal(res.body.banner.title, title ?? "");
        const updated = response();
        await api.updateBanner({ params: { id: res.body.banner.id }, body: { title: null } }, updated);
        assert.equal(updated.statusCode, 200);
        assert.equal(updated.body.banner.title, "");
      }
    });
    for (const [label, idDefinition] of [["numeric", "BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY"], ["UUID", "VARCHAR(36) NOT NULL PRIMARY KEY"]]) {
      await t.test(`FAQ creation and pagination with ${label} identifiers`, async () => {
        await recreate("faqs", idDefinition);
        const api = await loadController("faqsController", database);
        const created = response();
        await api.createFaq({ body: { question: "Question ?", answer: "Réponse" } }, created);
        assert.equal(created.statusCode, 201, JSON.stringify(created.body));
        assert.ok(created.body.faq.id);
        const list = response();
        await api.getFaqs({ query: { limit: "10", offset: "0" } }, list);
        assert.equal(list.statusCode, 200, JSON.stringify(list.body));
        assert.equal(list.body.faqs.length, 1);
      });
      await t.test(`newsletter with ${label} identifiers`, async () => {
        await recreate("newsletter_subscribers", idDefinition);
        const api = await loadController("newsletterController", database);
        const created = response();
        await api.subscribeNewsletter({ body: { email: "strict-test@example.invalid" } }, created);
        assert.equal(created.statusCode, 201, JSON.stringify(created.body));
        assert.ok(created.body.subscriber.id);
        const again = response();
        await api.subscribeNewsletter({ body: { email: "strict-test@example.invalid" } }, again);
        assert.equal(again.body.status, "already_subscribed");
      });
    }
    await t.test("product writes are atomic when category validation or gallery insertion fails", async () => {
      for (const name of ["products", "product_categories", "product_category_pivot", "product_images", "product_reviews"]) await recreate(name);
      const api = await loadController("productsController", database);
      const rejected = response();
      await api.createProduct({ body: { name: "Rejected", price: 10, category_ids: ["missing"] } }, rejected);
      assert.equal(rejected.statusCode, 400);
      assert.equal((await database.query("SELECT COUNT(*) AS count FROM products"))[0].count, 0);
      const created = response();
      await api.createProduct({ body: { name: "Original", price: 10, images: [{ image_url: "/uploads/original.jpg" }] } }, created);
      assert.equal(created.statusCode, 201, JSON.stringify(created.body));
      const id = created.body.product.id;
      const failedUpdate = response();
      await api.updateProduct({ params: { id }, body: { name: "Changed", images: [{ image_url: "x".repeat(1001) }] } }, failedUpdate);
      assert.equal(failedUpdate.statusCode, 400, JSON.stringify(failedUpdate.body));
      assert.equal((await database.query("SELECT name FROM products WHERE id = ?", [id]))[0].name, "Original");
      assert.equal((await database.query("SELECT image_url FROM product_images WHERE product_id = ?", [id]))[0].image_url, "/uploads/original.jpg");
      const deleted = response();
      await api.deleteProduct({ params: { id } }, deleted);
      assert.equal(deleted.body.success, true);
      assert.equal((await database.query("SELECT COUNT(*) AS count FROM products"))[0].count, 0);
    });
    await t.test("blog saves normalize dates and roll back invalid category updates", async () => {
      for (const name of ["blog_posts", "blog_categories", "blog_post_category_pivot"]) await recreate(name);
      const api = await loadController("blogController", database);
      const rejected = response();
      await api.createPost({ body: { title: "Rejected", content: "Test", category_ids: ["missing"] } }, rejected);
      assert.equal(rejected.statusCode, 400);
      assert.equal((await database.query("SELECT COUNT(*) AS count FROM blog_posts"))[0].count, 0);
      const created = response();
      await api.createPost({ body: { title: "Original", content: "Test", published_at: "2026-09-16T12:30:00.000Z" } }, created);
      assert.equal(created.statusCode, 201, JSON.stringify(created.body));
      const id = created.body.post.id;
      const updated = response();
      await api.updatePost({ params: { id }, body: { title: "Changed", category_ids: ["missing"] } }, updated);
      assert.equal(updated.statusCode, 400);
      assert.equal((await database.query("SELECT title FROM blog_posts WHERE id = ?", [id]))[0].title, "Original");
    });
    await t.test("payouts cannot exceed the outstanding balance and reject invalid amounts", async () => {
      for (const name of ["ambassadors", "orders", "ambassador_payouts"]) await recreate(name);
      await database.query("INSERT INTO ambassadors (id, code) VALUES ('test-ambassador', 'TEST')");
      await database.query("INSERT INTO orders (id, status, ambassador_id, ambassador_commission_amount) VALUES ('test-order', 'paid', 'test-ambassador', 1000)");
      const service = await loadController("../services/ambassadors/ambassadors.service", database);
      const payout = await service.createPayoutAdmin({ ambassadorId: "test-ambassador", amount: 1000 });
      assert.equal(payout.amount, 1000);
      await assert.rejects(service.createPayoutAdmin({ ambassadorId: "test-ambassador", amount: 1 }), { statusCode: 400 });
      for (const amount of [NaN, -1, 1.5, Infinity]) {
        await assert.rejects(service.createPayoutAdmin({ ambassadorId: "test-ambassador", amount }), { statusCode: 400 });
      }
      assert.equal((await database.query("SELECT COUNT(*) AS count FROM ambassador_payouts"))[0].count, 1);
    });
    await t.test("account creation does not depend on a database UUID default", async () => {
      await recreate("users");
      const api = await loadController("authController", database, {
        bcrypt: { default: { hash: async () => "test-hash" } },
        jsonwebtoken: { default: { sign: () => "test-token" } },
      });
      const res = response();
      await api.signup({ body: { email: "account-test@example.invalid", password: "test-password", firstName: "Test", lastName: "Account" } }, res);
      assert.equal(res.statusCode, 201, JSON.stringify(res.body));
      assert.match(res.body.user.id, /^[a-f0-9-]{36}$/i);
    });
    await t.test("consultation migration and round trip in an isolated schema", async () => {
      const [[{ originalDatabase }]] = await connection.query("SELECT DATABASE() AS originalDatabase");
      const testSchema = `hh_consultation_test_${randomUUID().replaceAll("-", "")}`;
      await connection.query("CREATE DATABASE ??", [testSchema]);
      try {
      await connection.query("USE ??", [testSchema]);
      const createIsolated = async (name, excluded = []) => {
        const sql = expected.find((table) => table.name === name).create.split("\n").filter((line) => !excluded.some((column) => line.trimStart().startsWith(`${column} `))).join("\n");
        await connection.query(sql);
      };
      for (const name of ["appointment_services", "appointment_slots"]) await createIsolated(name);
      const columns = ["gender", "age", "baby_project", "main_concern", "consulted_professional", "exams_description", "has_diagnosis", "diagnosis_details", "consultation_reasons", "consultation_reason_other"];
      await createIsolated("appointments", columns);
      await database.query("INSERT INTO appointment_services (id, name, slug) VALUES ('service-test', 'Test', 'test')");
      await database.query("INSERT INTO appointment_slots (id, service_id, available_date, start_time, end_time) VALUES ('slot-test', 'service-test', '2099-01-01', '10:00', '11:00')");
      await database.query("INSERT INTO appointments (appointment_number, service_id, slot_id, first_name, last_name, email, message) VALUES ('OLD', 'service-test', 'slot-test', 'Old', 'Booking', 'old@example.invalid', 'Ancien message')");
      const migration = await readFile(new URL("../migrations/20260919_add_consultation_questionnaire.sql", import.meta.url), "utf8");
      for (let statement of migration.split(";").filter((sql) => sql.trim())) {
        await connection.query(statement);
      }
      const old = (await database.query("SELECT * FROM appointments WHERE appointment_number = 'OLD'"))[0];
      assert.equal(old.message, "Ancien message");
      assert.equal(old.gender, null);
      const api = await loadController("appointmentsController", database);
      const body = { service_id: "service-test", slot_id: "slot-test", first_name: "Camille", last_name: "Test", email: "test@example.invalid", phone: "123", gender: "female", age: 32, baby_project: false, main_concern: "Ma préoccupation", consulted_professional: true, exams_description: "Un bilan", has_diagnosis: true, diagnosis_details: "Diagnostic", consultation_reasons: ["medical_followup", "other"], consultation_reason_other: "Mon autre motif" };
      const file = { originalname: "bilan.pdf", mimetype: "application/pdf", buffer: Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(2 * 1024 * 1024)]) };
      const booked = response();
      await api.bookAppointment({ body, files: [file] }, booked);
      assert.equal(booked.statusCode, 201, JSON.stringify(booked.body));
      const list = response();
      await api.adminListAppointments({}, list);
      const saved = list.body.appointments.find((item) => item.appointment_number === booked.body.appointment_number);
      for (const field of columns) {
        const expectedValue = typeof body[field] === "boolean" ? Number(body[field]) : body[field];
        assert.equal(JSON.stringify(saved[field]), JSON.stringify(expectedValue), field);
      }
      assert.equal(saved.documents.length, 1);
      assert.equal(saved.documents[0].original_name, "bilan.pdf");
      assert.equal(saved.documents[0].content, undefined);
      const download = { ...response(), headers: {}, setHeader(key, value) { this.headers[key] = value; }, send(buffer) { this.buffer = buffer; } };
      await api.adminDownloadDocument({ params: { id: saved.documents[0].id } }, download);
      assert.deepEqual(download.buffer, file.buffer);
      assert.equal(download.headers["Cache-Control"], "no-store");
      const retry = response();
      await api.bookAppointment({ body, files: [file] }, retry);
      assert.equal(retry.statusCode, 409);
      assert.equal((await database.query("SELECT COUNT(*) AS count FROM appointment_documents"))[0].count, 1);
      await database.query("INSERT INTO appointment_slots (id, service_id, available_date, start_time, end_time) VALUES ('slot-fail', 'service-test', '2099-01-01', '12:00', '13:00')");
      const failing = await loadController("appointmentsController", { ...database, getConnection: async () => {
        const borrowed = await database.getConnection();
        return { ...borrowed, execute: (sql, params) => { if (sql.includes("INSERT INTO appointment_documents")) throw new Error("Simulated document storage failure"); return borrowed.execute(sql, params); } };
      } });
      const failed = response();
      await failing.bookAppointment({ body: { ...body, slot_id: "slot-fail" }, files: [file] }, failed);
      assert.equal(failed.statusCode, 500);
      assert.equal((await database.query("SELECT status FROM appointment_slots WHERE id = 'slot-fail'"))[0].status, "available");
      assert.equal((await database.query("SELECT COUNT(*) AS count FROM appointments WHERE slot_id = 'slot-fail'"))[0].count, 0);
      } finally {
        await connection.query("USE ??", [originalDatabase]);
        await connection.query("DROP DATABASE ??", [testSchema]);
      }
    });;
  } finally {
    // Closing the dedicated session drops all temporary tables automatically.
    connection?.destroy();
    await pool.end();
  }
});
