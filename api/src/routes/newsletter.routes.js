// api/src/routes/newsletter.routes.js
import { Router } from "express";
import {
  subscribeNewsletter,
  adminListNewsletterSubscribers,
  adminDeleteNewsletterSubscriber,
} from "../controllers/newsletterController.js";

import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public
router.post("/", subscribeNewsletter);

// Admin
router.use(authenticateToken, requireAdmin);
router.get("/", adminListNewsletterSubscribers);

router.delete("/:id", adminDeleteNewsletterSubscriber);

export default router;
