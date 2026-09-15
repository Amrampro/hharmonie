// api/src/routes/admin/index.js
import { Router } from "express";
import blogCategoriesRoutes from "../blog-categories.js";
import productCategoriesRoutes from "../product-categories.js";

import adminOrdersRoutes from "./orders.routes.js";

const router = Router();

// Admin namespaces (later you will protect router with auth middleware + isAdmin)
router.use("/blog-categories", blogCategoriesRoutes);
router.use("/product-categories", productCategoriesRoutes);
router.use("/orders", adminOrdersRoutes);

export default router;
