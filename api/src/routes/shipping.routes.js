import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import { getShippingConfig, saveShippingConfig } from "../services/shipping.service.js";
const router = Router();
router.get("/", async (_req, res) => {
  try { res.setHeader("Cache-Control", "no-store"); res.json(await getShippingConfig()); }
  catch { res.status(503).json({ error: "Les tarifs de livraison sont momentanément indisponibles." }); }
});
router.put("/", authenticateToken, requireAdmin, async (req, res) => {
  try { await saveShippingConfig(req.body); res.json({ success: true }); }
  catch (error) { res.status(400).json({ error: error.message }); }
});
export default router;
