// api/src/routes/admin/financeRoutes.js
import { Router } from "express";
import { listFinance } from "../../controllers/admin/financeController.js";
import { authenticateToken, requireAdmin  } from "../../middleware/auth.js";

const router = Router();


router.use(authenticateToken, requireAdmin);

// const router = Router();

// GET /api/admin/finance
router.get("/", listFinance);

export default router;
