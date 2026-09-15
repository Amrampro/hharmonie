// api/src/routes/ambassadors/me.routes.js
import { Router } from "express";
import * as MeAmbassadorController from "../../controllers/ambassadors/meAmbassadorController.js";
import { authenticateToken as authMiddleware } from "../../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.get("/", MeAmbassadorController.getMe);
router.post("/register", MeAmbassadorController.registerMe); // ✅ NEW
router.put("/bank", MeAmbassadorController.updateBank);      // ✅ NEW

router.get("/orders", MeAmbassadorController.getMyOrders);
router.get("/payouts", MeAmbassadorController.getMyPayouts);

export default router;