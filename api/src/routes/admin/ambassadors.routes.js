// api/src/routes/admin/ambassadors.routes.js
import { Router } from "express";
import * as AmbassadorsAdminController from "../../controllers/admin/ambassadorsController.js";
import { authenticateToken, requireAdmin } from "../../middleware/auth.js";
// import { requireAdmin } from "../../middleware/requireAdmin.js"; // si tu l'as

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get("/", AmbassadorsAdminController.getAmbassadors);
router.get("/:id", AmbassadorsAdminController.getAmbassadorById);
router.get("/:id/orders", AmbassadorsAdminController.getAmbassadorOrders);
router.get("/:id/payouts", AmbassadorsAdminController.getAmbassadorPayouts);
router.post("/:id/pay", AmbassadorsAdminController.payAmbassador);

export default router;
