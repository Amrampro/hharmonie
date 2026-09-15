// api/src/routes/auth/profile.routes.js
import { Router } from "express";
import { authenticateToken as auth } from "../../middleware/auth.js";
import { getProfile, updateProfile } from "../../controllers/auth/profile.controller.js";

const router = Router();

router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

export default router;