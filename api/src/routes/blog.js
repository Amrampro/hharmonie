// api/src/routes/blog.js
import { Router } from "express";
import * as BlogController from "../controllers/blogController.js";

import { authenticateToken, requireAdmin  } from "../middleware/auth.js";

const router = Router();

// Public
router.get("/", BlogController.getAllPosts);
router.get("/slug/:slug", BlogController.getPostBySlug);

// Admin CRUD (later you will protect with auth middleware + isAdmin)
router.use(authenticateToken, requireAdmin);
router.get("/admin", BlogController.getAllPostsAdmin);
router.get("/admin/:id", BlogController.getPostByIdAdmin);
router.post("/admin", BlogController.createPost);
router.put("/admin/:id", BlogController.updatePost);
router.delete("/admin/:id", BlogController.deletePost);
router.patch("/admin/:id/publish", BlogController.publishPost);
router.patch("/admin/:id/unpublish", BlogController.unpublishPost);

export default router;
