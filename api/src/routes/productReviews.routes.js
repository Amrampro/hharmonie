// api/src/routes/productReviews.routes.js
import { Router } from "express";
import { authenticateToken, requireAdmin  } from "../middleware/auth.js";

import {
  listProductReviews,
  createProductReview,
  adminListReviews,
  adminDeleteReview,
} from "../controllers/productReviewsController.js";

const router = Router();

/**
 * Public
 * GET  /api/v1/products/:id/reviews
 * POST /api/v1/products/:id/reviews
 */
router.get("/products/:id/reviews", listProductReviews);
router.post("/products/:id/reviews", createProductReview);

/**
 * Admin (protected)
 * GET    /api/v1/admin/product-reviews
 * DELETE /api/v1/admin/product-reviews/:id
 */

router.use(authenticateToken, requireAdmin);

router.get("/admin/product-reviews", adminListReviews);
router.delete("/admin/product-reviews/:id", adminDeleteReview);

export default router;
