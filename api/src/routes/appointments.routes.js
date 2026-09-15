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
} from "../controllers/appointmentsController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/services", listServices);
router.get("/slots", listSlots);
router.post("/book", bookAppointment);

router.use("/admin", authenticateToken, requireAdmin);
router.get("/admin", adminListAppointments);
router.get("/admin/services", adminListServices);
router.post("/admin/services", adminCreateService);
router.post("/admin/slots", adminCreateSlot);
router.put("/admin/slots/:id", adminUpdateSlot);
router.delete("/admin/slots/:id", adminDeleteSlot);

export default router;

