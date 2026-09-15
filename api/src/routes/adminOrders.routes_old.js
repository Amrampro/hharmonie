// api/src/routes/adminOrders.routes.js
import { Router } from "express";
import {
  adminListOrders,
  adminGetOrderById,
  adminUpdateOrderShipping,
  adminUpdateOrderStatus,
} from "../controllers/adminOrders.controller_old.js";

const router = Router();

// GET /api/v1/admin/orders
router.get("/", adminListOrders);

// GET /api/v1/admin/orders/:id
router.get("/:id", adminGetOrderById);

// PATCH /api/v1/admin/orders/:id/shipping
router.patch("/:id/shipping", adminUpdateOrderShipping);

// PATCH /api/v1/admin/orders/:id/status
router.patch("/:id/status", adminUpdateOrderStatus);

export default router;
