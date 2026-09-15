// api/src/middleware/auth.js
import jwt from "jsonwebtoken";
import { query } from "../config/database.js";

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const users = await query(
      "SELECT id, email, first_name, last_name, phone, is_admin FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
