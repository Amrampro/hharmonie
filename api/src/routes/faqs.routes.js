// api/src/routes/faqs.routes.js
import { Router } from "express";
import * as FaqsController from "../controllers/faqsController.js";
import { authenticateToken, requireAdmin  } from "../middleware/auth.js";

const router = Router();

// Public
router.get("/", FaqsController.getFaqs);
router.get("/:id", FaqsController.getFaqById);

// Admin (protect if you want)
router.use(authenticateToken, requireAdmin);
router.post("/admin", FaqsController.createFaq);
router.put("/admin/:id", FaqsController.updateFaq);
router.delete("/admin/:id", FaqsController.deleteFaq);

export default router;
