// api/src/routes/product-categories.js
import { Router } from "express";
import * as ProductCategoriesController from "../controllers/productCategoriesController.js";
import { authenticateToken, requireAdmin  } from "../middleware/auth.js";

const router = Router();

// Public list
router.get("/", ProductCategoriesController.getProductCategories);

// Admin CRUD (later you will protect with auth middleware + isAdmin)
router.use(authenticateToken, requireAdmin);
router.post("/", ProductCategoriesController.createProductCategory);
router.put("/:id", ProductCategoriesController.updateProductCategory);
router.delete("/:id", ProductCategoriesController.deleteProductCategory);

export default router;
