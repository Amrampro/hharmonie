// api/src/routes/parameters.routes.js
import { Router } from "express";
import {
  getParameters,
  updateAllProductsImage,
  upsertParameters,
} from "../controllers/parametersController.js";
import { authenticateToken, requireAdmin  } from "../middleware/auth.js";

const router = Router();

router.get("/", getParameters);

// Admin
router.use(authenticateToken, requireAdmin);
router.put("/", upsertParameters);
router.put("/all-products-image", updateAllProductsImage);

export default router;
