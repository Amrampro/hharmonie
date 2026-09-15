// api/src/routes/legalLinks.routes.js
import { Router } from "express";
import * as LegalLinksController from "../controllers/legalLinksController.js";
import { authenticateToken, requireAdmin  } from "../middleware/auth.js";

const router = Router();

// Public
router.get("/", LegalLinksController.getLegalLinks);
router.get("/:id", LegalLinksController.getLegalLinkById);

// Admin CRUD
// router.use(authMiddleware);
router.use(authenticateToken, requireAdmin);
router.post("/", LegalLinksController.createLegalLink);
router.put("/:id", LegalLinksController.updateLegalLink);
router.delete("/:id", LegalLinksController.deleteLegalLink);

export default router;
