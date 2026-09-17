import { sendApiError } from "../utils/apiError.js";
import { query } from "../config/database.js";
import { toMysqlDateTime } from "../utils/dateTime.js";

const toSlug = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function listEvents(req, res) {
  try {
    const limit = Number.parseInt(String(req.query.limit ?? "50"), 10) || 50;
    const events = await query(
      `SELECT * FROM events
       WHERE status = 'published' AND starts_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
       ORDER BY starts_at ASC
       LIMIT ?`,
      [limit]
    );
    res.json({ events });
  } catch (error) {
    console.error("List events error:", error);
    sendApiError(res, error);
  }
}

export async function getEventBySlug(req, res) {
  try {
    const rows = await query("SELECT * FROM events WHERE slug = ? AND status = 'published' LIMIT 1", [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ error: "Event not found" });
    res.json({ event: rows[0] });
  } catch (error) {
    console.error("Get event error:", error);
    sendApiError(res, error);
  }
}

export async function adminListEvents(req, res) {
  try {
    const events = await query("SELECT * FROM events ORDER BY starts_at DESC");
    res.json({ events });
  } catch (error) {
    console.error("Admin list events error:", error);
    sendApiError(res, error);
  }
}

export async function adminCreateEvent(req, res) {
  try {
    const payload = req.body ?? {};
    if (!payload.title || !payload.starts_at) {
      return res.status(400).json({ error: "title and starts_at are required" });
    }
    const slug = toSlug(payload.slug || payload.title);
    await query(
      `INSERT INTO events
       (id, title, slug, short_description, description, cover_image_url, event_type, location_name, city, online_url, starts_at, ends_at, capacity, price, currency, status)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.title,
        slug,
        payload.short_description ?? null,
        payload.description ?? null,
        payload.cover_image_url ?? null,
        payload.event_type ?? "physical",
        payload.location_name ?? null,
        payload.city ?? null,
        payload.online_url ?? null,
        toMysqlDateTime(payload.starts_at),
        toMysqlDateTime(payload.ends_at),
        payload.capacity ?? null,
        Number(payload.price ?? 0),
        payload.currency ?? "EUR",
        payload.status ?? "draft",
      ]
    );
    const [event] = await query("SELECT * FROM events WHERE slug = ? LIMIT 1", [slug]);
    res.status(201).json({ event });
  } catch (error) {
    console.error("Admin create event error:", error);
    sendApiError(res, error);
  }
}

export async function adminUpdateEvent(req, res) {
  try {
    const payload = req.body ?? {};
    const fields = [
      "title",
      "slug",
      "short_description",
      "description",
      "cover_image_url",
      "event_type",
      "location_name",
      "city",
      "online_url",
      "starts_at",
      "ends_at",
      "capacity",
      "price",
      "currency",
      "status",
    ];
    const patch = [];
    const params = [];
    fields.forEach((field) => {
      if (payload[field] === undefined) return;
      patch.push(`${field} = ?`);
      params.push(field === "slug" ? toSlug(payload[field]) : field === "starts_at" || field === "ends_at" ? toMysqlDateTime(payload[field]) : payload[field]);
    });
    if (patch.length) {
      await query(`UPDATE events SET ${patch.join(", ")} WHERE id = ?`, [...params, req.params.id]);
    }
    const rows = await query("SELECT * FROM events WHERE id = ? LIMIT 1", [req.params.id]);
    res.json({ event: rows[0] });
  } catch (error) {
    console.error("Admin update event error:", error);
    sendApiError(res, error);
  }
}

export async function adminDeleteEvent(req, res) {
  try {
    await query("DELETE FROM events WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Admin delete event error:", error);
    sendApiError(res, error);
  }
}
