import { Router } from "express";
import {
  adminCreateService,
  adminCreateSlot,
  adminDeleteSlot,
  adminListAppointments,
  adminListServices,
  adminUpdateSlot,
  bookAppointment,
  listServices,
  listSlots,
  adminDownloadDocument,
} from "../controllers/appointmentsController.js";
import { consultationUpload } from "../middleware/consultationUpload.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/services", listServices);
router.get("/slots", listSlots);
router.post("/book", consultationUpload, bookAppointment);

router.use("/admin", authenticateToken, requireAdmin, (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.get("/admin", adminListAppointments);
router.get("/admin/documents/:id", adminDownloadDocument);
router.get("/admin/services", adminListServices);
router.post("/admin/services", adminCreateService);
router.post("/admin/slots", adminCreateSlot);
router.put("/admin/slots/:id", adminUpdateSlot);
router.delete("/admin/slots/:id", adminDeleteSlot);

export default router;
