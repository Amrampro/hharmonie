import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fileSize: 5 * 1024 * 1024, fields: 1, fieldSize: 256 * 1024, parts: 4 },
  fileFilter: (_req, file, done) => {
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype)) {
      return done(Object.assign(new Error("Formats autorisés : PDF, JPG et PNG."), { status: 400 }));
    }
    done(null, true);
  },
}).array("documents", 3);

export function consultationUpload(req, res, next) {
  upload(req, res, (error) => {
    if (error) return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: error.code === "LIMIT_FILE_SIZE" ? "Chaque document doit faire au maximum 5 Mo." : "Pièces jointes invalides : 3 documents maximum, aux formats PDF, JPG ou PNG." });
    if (req.is("multipart/form-data")) {
      try { req.body = JSON.parse(req.body.data); }
      catch { return res.status(400).json({ error: "Le formulaire transmis est invalide." }); }
    }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) return res.status(400).json({ error: "Le formulaire transmis est invalide." });
    next();
  });
}
