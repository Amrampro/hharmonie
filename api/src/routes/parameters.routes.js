// api/src/routes/parameters.routes.js
import { Router } from "express";
import {
  getParameters,
  upsertParameters,
} from "../controllers/parametersController.js";
import { authenticateToken, requireAdmin  } from "../middleware/auth.js";

const router = Router();

router.get("/", getParameters);

// Admin
router.use(authenticateToken, requireAdmin);
router.put("/", upsertParameters);

export default router;
