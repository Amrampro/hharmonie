// api/src/routes/uploads.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Will save in: api/public/uploads/products
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const original = file.originalname || "image";
    const ext = path.extname(original).toLowerCase();

    const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
    const safeExt = allowedExt.includes(ext) ? ext : ".jpg";

    const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Matches the banner form's 5 MB limit.
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(Object.assign(new Error("Unsupported image type. Use PNG, JPG, JPEG, or WEBP."), { status: 400 }));
    }
    cb(null, true);
  },
});

/**
 * POST /api/v1/uploads/product-image
 * form-data: file=<image>
 * response: { url: "https://your-domain/uploads/products/xxx.webp" }
 */
router.post("/product-image", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // If behind reverse proxy (nginx), allow https detection
    const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http")
      .toString()
      .split(",")[0]
      .trim();

    const host = req.headers["x-forwarded-host"] || req.get("host");
    const baseUrl = `${proto}://${host}`;

    const url = `${baseUrl}/uploads/products/${req.file.filename}`;

    return res.status(201).json({ url });
  } catch (e) {
    console.error("Upload error:", e);
    return res.status(500).json({ error: "Upload failed" });
  }
});

router.use((error, _req, res, next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Image trop volumineuse. La limite est de 5 Mo." });
  }
  if (error instanceof multer.MulterError || error.status === 400) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

export default router;
