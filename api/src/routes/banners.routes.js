// api/src/routes/banners.routes.js
import { Router } from "express";
import * as BannersController from "../controllers/bannersController.js";
import { getActiveBannerByPageName } from "../controllers/bannersController.js";

import { authenticateToken, requireAdmin  } from "../middleware/auth.js";

const router = Router();

// Public: list banners (optionally by page_name / active)
router.get("/", BannersController.getBanners);
router.get("/:id", BannersController.getBannerById);
// Public: get active banner by page
router.get("/active/:page_name", getActiveBannerByPageName);


// Admin CRUD (add auth if needed)
router.use(authenticateToken, requireAdmin);
router.post("/", BannersController.createBanner);
router.put("/:id", BannersController.updateBanner);
router.delete("/:id", BannersController.deleteBanner);

export default router;
