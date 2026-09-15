import { Router } from "express";
import {
  adminCreateEvent,
  adminDeleteEvent,
  adminListEvents,
  adminUpdateEvent,
  getEventBySlug,
  listEvents,
} from "../controllers/eventsController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", listEvents);
router.get("/slug/:slug", getEventBySlug);

router.use("/admin", authenticateToken, requireAdmin);
router.get("/admin", adminListEvents);
router.post("/admin", adminCreateEvent);
router.put("/admin/:id", adminUpdateEvent);
router.delete("/admin/:id", adminDeleteEvent);

export default router;

