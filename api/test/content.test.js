import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import express from "express";
import { loadController, response } from "./helpers.js";
import { readExpectedSchema } from "../scripts/schemaPlan.js";

test("contact saves a message without a mail dependency and rejects invalid input", async () => {
  const writes = [];
  const controller = await loadController("contact.controller", { query: async (...args) => { writes.push(args); return {}; } });
  const res = response();
  await controller.sendContactMessage({ body: { name: " Alice ", email: "alice@example.com", subject: "Question", message: "Bonjour" } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(writes[0][1][1], "Alice");
  for (const body of [{}, { name: "Alice", email: "bad", subject: "Question", message: "Bonjour" }]) {
    const invalid = response(); await controller.sendContactMessage({ body }, invalid); assert.equal(invalid.statusCode, 400);
  }
  assert.equal(writes.length, 1);
});

test("content migration and public/admin flows in an isolated database", { skip: process.env.RUN_DB_TESTS !== "1" }, async () => {
  const { default: pool } = await import("../src/config/database.js");
  const connection = await pool.getConnection();
  const schema = `hh_content_test_${randomUUID().replaceAll("-", "")}`;
  let created = false, server;
  const [[original]] = await connection.query("SELECT DATABASE() AS name");
  try {
    await connection.query("CREATE DATABASE `" + schema + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"); created = true;
    await connection.query("USE `" + schema + "`");
    await connection.query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    await connection.query("CREATE TABLE products (id VARCHAR(36) PRIMARY KEY, name VARCHAR(190), slug VARCHAR(190), image_url VARCHAR(1000), price DECIMAL(10,2)) ENGINE=InnoDB");
    const parameters = readExpectedSchema().find(table => table.name === "parameters").create.replace(/[^\r\n]*tiktok_link[^\r\n]*\r?\n/, "");
    await connection.query(parameters);
    await connection.query("INSERT INTO products VALUES ('product', 'Produit test', 'produit-test', '/uploads/p.jpg', 29.90)");
    const migration = await readFile(new URL("../migrations/20260921_add_testimonials_collaborators_contact.sql", import.meta.url), "utf8");
    for (const statement of migration.split(";").filter(s => s.trim())) await connection.query(statement);
    const database = { query: async (sql, params = []) => (await connection.execute(sql, params))[0] };
    const paramsApi = await loadController("parametersController", database);
    for (const link of ["https://www.tiktok.com/@first", "https://www.tiktok.com/@updated"]) {
      const res = response(); await paramsApi.upsertParameters({ body: { tiktok_link: link } }, res);
      assert.ok(res.statusCode < 300, JSON.stringify(res.body)); assert.equal(res.body.parameters.tiktok_link, link);
    }
    const routes = await loadController("../routes/content.routes", database, { "auth.js": {
      authenticateToken: (req, res, next) => req.headers.authorization ? next() : res.status(401).json({ error: "Auth" }),
      requireAdmin: (req, res, next) => req.headers.authorization === "admin" ? next() : res.status(403).json({ error: "Forbidden" }),
    } });
    const contact = await loadController("contact.controller", database);
    const app = express(); app.use(express.json()); app.post("/contact", contact.sendContactMessage); app.use(routes.default);
    server = await new Promise(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
    const request = async (path, method = "GET", body, auth = "admin") => {
      const res = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { "Content-Type": "application/json", ...(auth ? { Authorization: auth } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      return { status: res.status, data: await res.json() };
    };
    assert.equal((await request("/admin/messages", "GET", null, "")).status, 401);
    assert.equal((await request("/admin/testimonials", "GET", null, "customer")).status, 403);
    const testimonial = { author_name: "Alice", photo_url: "/uploads/photo.jpg", testimony: "Un long témoignage\navec plusieurs lignes.", product_id: "product", is_active: true, display_order: 0 };
    assert.equal((await request("/admin/testimonials", "POST", testimonial)).status, 200);
    let visible = (await request("/testimonials", "GET", null, "")).data.items;
    assert.equal(visible.length, 1); assert.equal(visible[0].testimony, testimonial.testimony); assert.equal(Number(visible[0].product_price), 29.9);
    const id = visible[0].id;
    await connection.query("UPDATE products SET price = 31 WHERE id = 'product'");
    assert.equal(Number((await request("/testimonials")).data.items[0].product_price), 31);
    assert.equal((await request(`/admin/testimonials/${id}`, "PUT", { ...testimonial, is_active: false })).status, 200);
    assert.equal((await request("/testimonials")).data.items.length, 0);
    assert.equal((await request("/admin/testimonials")).data.items.length, 1);
    assert.equal((await request("/admin/testimonials", "POST", { ...testimonial, product_id: "missing" })).status, 400);
    assert.equal((await request("/admin/collaborators", "POST", { company_name: "Entreprise", is_active: true })).status, 200);
    const collaborator = (await request("/collaborators")).data.items[0]; assert.equal(collaborator.person_name, null);
    assert.equal((await request("/admin/collaborators", "POST", { company_name: "" })).status, 400);
    assert.equal((await request("/contact", "POST", { name: "Client", email: "client@example.com", subject: "Conseil", message: "Bonjour" }, "")).status, 201);
    const message = (await request("/admin/messages")).data.items[0]; assert.equal(message.is_read, 0);
    await request(`/admin/messages/${message.id}`, "PUT", { is_read: true }); assert.equal((await request("/admin/messages")).data.items[0].is_read, 1);
    await request(`/admin/testimonials/${id}`, "DELETE"); assert.equal((await request("/admin/testimonials")).data.items.length, 0);
    assert.equal((await connection.query("SELECT * FROM products"))[0].length, 1);
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await connection.query("USE `" + original.name + "`");
    if (created) await connection.query("DROP DATABASE `" + schema + "`");
    connection.release(); await pool.end();
  }
});
