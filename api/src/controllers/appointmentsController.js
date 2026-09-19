import { sendApiError } from "../utils/apiError.js";
import { getConnection, query } from "../config/database.js";
import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { validateConsultation } from "../utils/consultationForm.js";
import { releaseTransaction } from "../utils/transaction.js";

const toBool = (value) => value === true || value === 1 || value === "1";
const toSlug = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const appointmentNumber = () => `RDV-${randomUUID().toUpperCase()}`;

export async function listServices(req, res) {
  try {
    const services = await query(
      `SELECT * FROM appointment_services WHERE is_active = 1 ORDER BY display_order ASC, name ASC`
    );
    res.json({ services: services.map((service) => ({ ...service, is_active: toBool(service.is_active) })) });
  } catch (error) {
    console.error("List appointment services error:", error);
    sendApiError(res, error);
  }
}

export async function listSlots(req, res) {
  try {
    const { serviceId } = req.query;
    const params = [];
    let sql = `
      SELECT s.*, sv.name AS service_name
      FROM appointment_slots s
      INNER JOIN appointment_services sv ON sv.id = s.service_id
      WHERE s.available_date >= CURRENT_DATE()
    `;
    if (serviceId) {
      sql += " AND s.service_id = ?";
      params.push(serviceId);
    }
    sql += " ORDER BY s.available_date ASC, s.start_time ASC";
    const slots = await query(sql, params);
    res.json({ slots });
  } catch (error) {
    console.error("List appointment slots error:", error);
    sendApiError(res, error);
  }
}

export async function bookAppointment(req, res) {
  let connection;
  let committed = false;
  try {
    const data = validateConsultation(req.body ?? {}, req.files ?? []);
    const { service_id, slot_id, first_name, last_name, email, phone } = data;

    connection = await getConnection();
    await connection.beginTransaction();
    const [slots] = await connection.execute(
      "SELECT * FROM appointment_slots WHERE id = ? AND service_id = ? AND status = 'available' AND TIMESTAMP(available_date, start_time) > NOW() FOR UPDATE",
      [slot_id, service_id]
    );
    if (!slots.length) {
      return res.status(409).json({ error: "Slot unavailable" });
    }

    const number = appointmentNumber();
    await connection.execute("UPDATE appointment_slots SET status = 'booked' WHERE id = ?", [slot_id]);
    const [created] = await connection.execute(
      `INSERT INTO appointments
       (appointment_number, service_id, slot_id, first_name, last_name, email, phone,
        gender, age, baby_project, main_concern, consulted_professional, exams_description,
        has_diagnosis, diagnosis_details, consultation_reasons, consultation_reason_other, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [number, service_id, slot_id, first_name, last_name, email, phone,
        data.gender, data.age, data.baby_project, data.main_concern, data.consulted_professional,
        data.exams_description, data.has_diagnosis, data.diagnosis_details,
        JSON.stringify(data.consultation_reasons), data.consultation_reason_other]
    );
    for (const file of req.files ?? []) {
      const name = file.originalname.replace(/[\\/\x00-\x1f\x7f]/g, "_").slice(0, 180) || "document";
      const documentId = randomUUID();
      await connection.execute(
        "INSERT INTO appointment_documents (id, appointment_id, original_name, content_type, size_bytes) VALUES (?, ?, ?, ?, ?)",
        [documentId, created.insertId, name, file.mimetype, file.buffer.length]
      );
      // Small packets also work on hosts configured with max_allowed_packet=1MB.
      const chunkSize = 512 * 1024;
      for (let offset = 0; offset < file.buffer.length; offset += chunkSize) {
        await connection.execute("INSERT INTO appointment_document_chunks (document_id, chunk_index, content) VALUES (?, ?, ?)", [documentId, offset / chunkSize, file.buffer.subarray(offset, offset + chunkSize)]);
      }
    }
    await connection.commit();
    committed = true;
    res.status(201).json({ appointment_number: number });
  } catch (error) {
    console.error("Book appointment error:", { code: error.code, message: error.statusCode === 400 ? error.message : "Reservation failed" });
    sendApiError(res, error);
  } finally {
    await releaseTransaction(connection, committed);
  }
}

export async function adminListAppointments(req, res) {
  try {
    const appointments = await query(
      `SELECT a.*, sv.name AS service_name, s.available_date, s.start_time, s.end_time
       FROM appointments a
       INNER JOIN appointment_services sv ON sv.id = a.service_id
       INNER JOIN appointment_slots s ON s.id = a.slot_id
       ORDER BY s.available_date DESC, s.start_time DESC`
    );
    const documents = await query("SELECT id, appointment_id, original_name, content_type, size_bytes FROM appointment_documents ORDER BY created_at ASC");
    res.json({ appointments: appointments.map((appointment) => ({
      ...appointment,
      consultation_reasons: typeof appointment.consultation_reasons === "string" ? JSON.parse(appointment.consultation_reasons) : appointment.consultation_reasons ?? [],
      documents: documents.filter((document) => String(document.appointment_id) === String(appointment.id)),
    })) });
  } catch (error) {
    console.error("Admin list appointments error:", error);
    sendApiError(res, error);
  }
}

export async function adminDownloadDocument(req, res) {
  try {
    const [document] = await query("SELECT original_name, content_type FROM appointment_documents WHERE id = ?", [req.params.id]);
    if (!document) return res.status(404).json({ error: "Document introuvable." });
    const chunks = await query("SELECT content FROM appointment_document_chunks WHERE document_id = ? ORDER BY chunk_index ASC", [req.params.id]);
    res.setHeader("Content-Type", document.content_type);
    res.setHeader("Content-Disposition", `attachment; filename="document"; filename*=UTF-8''${encodeURIComponent(document.original_name).replace(/'/g, "%27")}`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");
    res.send(Buffer.concat(chunks.map((chunk) => chunk.content)));
  } catch (error) {
    sendApiError(res, error);
  }
}

export async function adminListServices(req, res) {
  try {
    const services = await query("SELECT * FROM appointment_services ORDER BY display_order ASC, name ASC");
    res.json({ services: services.map((service) => ({ ...service, is_active: toBool(service.is_active) })) });
  } catch (error) {
    console.error("Admin list services error:", error);
    sendApiError(res, error);
  }
}

export async function adminCreateService(req, res) {
  try {
    const {
      name,
      slug,
      short_description = null,
      description = null,
      duration_minutes = 60,
      price = 0,
      meeting_type = "online",
      display_order = 0,
      is_active = true,
    } = req.body ?? {};
    if (!name) return res.status(400).json({ error: "name is required" });
    const finalSlug = toSlug(slug || name);
    await query(
      `INSERT INTO appointment_services
       (id, name, slug, short_description, description, duration_minutes, price, meeting_type, is_active, display_order)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, finalSlug, short_description, description, Number(duration_minutes), Number(price), meeting_type, is_active ? 1 : 0, Number(display_order)]
    );
    const [service] = await query("SELECT * FROM appointment_services WHERE slug = ? LIMIT 1", [finalSlug]);
    res.status(201).json({ service });
  } catch (error) {
    console.error("Admin create service error:", error);
    sendApiError(res, error);
  }
}

export async function adminCreateSlot(req, res) {
  try {
    const { service_id, available_date, start_time, end_time, status = "available" } = req.body ?? {};
    if (!service_id || !available_date || !start_time || !end_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    await query(
      `INSERT INTO appointment_slots (id, service_id, available_date, start_time, end_time, status)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [service_id, available_date, start_time, end_time, status]
    );
    const rows = await query(
      `SELECT s.*, sv.name AS service_name
       FROM appointment_slots s
       INNER JOIN appointment_services sv ON sv.id = s.service_id
       WHERE s.service_id = ? AND s.available_date = ? AND s.start_time = ?
       ORDER BY s.created_at DESC LIMIT 1`,
      [service_id, available_date, start_time]
    );
    res.status(201).json({ slot: rows[0] });
  } catch (error) {
    console.error("Admin create slot error:", error);
    sendApiError(res, error);
  }
}

export async function adminUpdateSlot(req, res) {
  try {
    const { id } = req.params;
    const { service_id, available_date, start_time, end_time, status } = req.body ?? {};
    await query(
      `UPDATE appointment_slots
       SET service_id = COALESCE(?, service_id),
           available_date = COALESCE(?, available_date),
           start_time = COALESCE(?, start_time),
           end_time = COALESCE(?, end_time),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [service_id ?? null, available_date ?? null, start_time ?? null, end_time ?? null, status ?? null, id]
    );
    const rows = await query(
      `SELECT s.*, sv.name AS service_name
       FROM appointment_slots s
       INNER JOIN appointment_services sv ON sv.id = s.service_id
       WHERE s.id = ? LIMIT 1`,
      [id]
    );
    res.json({ slot: rows[0] });
  } catch (error) {
    console.error("Admin update slot error:", error);
    sendApiError(res, error);
  }
}

export async function adminDeleteSlot(req, res) {
  try {
    await query("DELETE FROM appointment_slots WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Admin delete slot error:", error);
    sendApiError(res, error);
  }
}
