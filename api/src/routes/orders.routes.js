// src/routes/orders.routes.js
import { Router } from "express";
import { authenticateToken as authMiddleware } from "../middleware/auth.js";
import * as OrdersController from "../controllers/orders.controller.js";

const router = Router();

// router.use(authMiddleware);

router.post("/checkout", OrdersController.checkout);
router.get("/user/:id", OrdersController.getMyOrder);
router.get("/:id", OrdersController.getOrder);

export default router;
