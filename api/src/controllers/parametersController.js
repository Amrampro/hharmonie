// api/src/controllers/parametersController.js
import { query } from "../config/database.js";

export const getParameters = async (req, res) => {
  try {
    const rows = await query(
      "SELECT * FROM parameters ORDER BY created_at ASC LIMIT 1"
    );
    res.json({ parameters: rows[0] || null });
  } catch (e) {
    console.error("Get parameters error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const upsertParameters = async (req, res) => {
  try {
    const rows = await query(
      "SELECT id FROM parameters ORDER BY created_at ASC LIMIT 1"
    );

    const payload = {
      promotional_text: req.body?.promotional_text ?? null,
      home_text: req.body?.home_text ?? null,
      story: req.body?.story ?? null,
      mission: req.body?.mission ?? null,
      vision: req.body?.vision ?? null,
      expertise: req.body?.expertise ?? null,
      name: req.body?.name ?? null,
      email: req.body?.email ?? null,
      address: req.body?.address ?? null,
      phone: req.body?.phone ?? null,
      enterprise_number: req.body?.enterprise_number ?? null,
      facebook_link: req.body?.facebook_link ?? null,
      instagram_link: req.body?.instagram_link ?? null,
      twitter_link: req.body?.twitter_link ?? null,
      whatsapp_link: req.body?.whatsapp_link ?? null,

      // ✅ new
      logo_navbar: req.body?.logo_navbar ?? null,
      logo_footer: req.body?.logo_footer ?? null,
    };

    if (rows[0]) {
      const id = rows[0].id;

      await query(
        `
        UPDATE parameters SET
          promotional_text = ?,
          home_text = ?,
          story = ?,
          mission = ?,
          vision = ?,
          expertise = ?,
          name = ?,
          email = ?,
          address = ?,
          phone = ?,
          enterprise_number = ?,
          facebook_link = ?,
          instagram_link = ?,
          twitter_link = ?,
          whatsapp_link = ?,
          logo_navbar = ?,
          logo_footer = ?
        WHERE id = ?
        `,
        [
          payload.promotional_text,
          payload.home_text,
          payload.story,
          payload.mission,
          payload.vision,
          payload.expertise,
          payload.name,
          payload.email,
          payload.address,
          payload.phone,
          payload.enterprise_number,
          payload.facebook_link,
          payload.instagram_link,
          payload.twitter_link,
          payload.whatsapp_link,
          payload.logo_navbar,
          payload.logo_footer,
          id,
        ]
      );

      const [updated] = await query("SELECT * FROM parameters WHERE id = ?", [
        id,
      ]);
      return res.json({ parameters: updated });
    }

    // create first row
    const idRows = await query("SELECT UUID() AS id");
    const id = idRows[0].id;

    await query(
      `
      INSERT INTO parameters
        (id, promotional_text, home_text, story, mission, vision, expertise, name, email, address, phone, enterprise_number,
         facebook_link, instagram_link, twitter_link, whatsapp_link,
         logo_navbar, logo_footer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        payload.promotional_text,
        payload.home_text,
        payload.story,
        payload.mission,
        payload.vision,
        payload.expertise,
        payload.name,
        payload.email,
        payload.address,
        payload.phone,
        payload.enterprise_number,
        payload.facebook_link,
        payload.instagram_link,
        payload.twitter_link,
        payload.whatsapp_link,
        payload.logo_navbar,
        payload.logo_footer,
      ]
    );

    const [created] = await query("SELECT * FROM parameters WHERE id = ?", [
      id,
    ]);
    return res.status(201).json({ parameters: created });
  } catch (e) {
    console.error("Upsert parameters error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
};
