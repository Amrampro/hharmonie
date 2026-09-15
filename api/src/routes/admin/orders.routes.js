// api/src/routes/admin/orders.routes.js
import { Router } from "express";
import * as OrdersController from "../../controllers/admin/ordersController.js";
import { authenticateToken, requireAdmin  } from "../../middleware/auth.js";

const router = Router();


router.use(authenticateToken, requireAdmin);

// TODO: ajoute ici ton middleware admin si tu en as un (ex: requireAdmin)
// router.use(authenticateToken, requireAdmin);

// GET /api/v1/admin/orders?status=&shipping_status=&shipping_method=&q=&limit=&offset=
router.get("/", OrdersController.getAllOrders);

// GET /api/v1/admin/orders/:id
router.get("/:id", OrdersController.getOrderById);

// PATCH /api/v1/admin/orders/:id/status { status }
router.patch("/:id/status", OrdersController.updateOrderStatus);

// PATCH /api/v1/admin/orders/:id/shipping { shipping_method, shipping_status, shipping_tracking_number, shipping_tracking_url }
router.patch("/:id/shipping", OrdersController.updateOrderShipping);

// DELETE /api/v1/admin/orders/:id
router.delete("/:id", OrdersController.deleteOrder);

export default router;
