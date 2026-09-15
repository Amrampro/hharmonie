// api/src/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/auth.js";
import productsRoutes from "./routes/products.js";
import couponsRoutes from "./routes/coupons.js";
import blogRoutes from "./routes/blog.js";
import themeRoutes from "./routes/theme.js";
import adminRoutes from "./routes/admin/index.js";

import uploadsRouter from "./routes/uploads.routes.js";
import faqsRoutes from "./routes/faqs.routes.js";
import bannersRoutes from "./routes/banners.routes.js";
import legalLinksRoutes from "./routes/legalLinks.routes.js";
import parametersRoutes from "./routes/parameters.routes.js";
import productReviewsRoutes from "./routes/productReviews.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import appointmentsRoutes from "./routes/appointments.routes.js";
import eventsRoutes from "./routes/events.routes.js";

import ordersRoutes from "./routes/orders.routes.js";
import adminOrdersRoutes from "./routes/admin/orders.routes.js";
import adminFinanceRoutes from "./routes/admin/financeRoutes.js";

import stripeWebhookRoutes from "./routes/stripeWebhook.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";

import adminAmbassadorsRoutes from "./routes/admin/ambassadors.routes.js";
import ambassadorsRoute from "./routes/ambassadors/me.routes.js";

import mondialRelayRoutes from "./routes/mondialRelay.routes.js";

import pool from "./config/database.js";


// ======================================================
// ENVIRONMENT
// ======================================================

dotenv.config();


// ======================================================
// EXPRESS APP
// ======================================================

const app = express();

const PORT = process.env.PORT || 3001;


// ======================================================
// PATHS
// ======================================================

// En production :
// /httpdocs/dist
const distPath = path.join(process.cwd(), "dist");

// Uploads :
// /httpdocs/public/uploads
const uploadsPath = path.join(
  process.cwd(),
  "public",
  "uploads"
);


// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);


// ======================================================
// STRIPE
// ======================================================

// IMPORTANT :
// Cette route reste avant express.json()
// si ton webhook Stripe utilise le raw body.

app.use("/api/stripe", stripeWebhookRoutes);


// ======================================================
// BODY PARSERS
// ======================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


// ======================================================
// STATIC FILES
// ======================================================

// Build React / Vite
app.use(express.static(distPath));

// Fichiers uploadés
app.use(
  "/uploads",
  express.static(uploadsPath)
);


// ======================================================
// API HOME
// ======================================================

// On utilise maintenant /api au lieu de /
// car / appartient au frontend React.

app.get("/api", (req, res) => {
  res.json({
    message: "E-Commerce API",
    version: "1.0.0",

    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      coupons: "/api/coupons",
      blog: "/api/blog",
      faq: "/api/faqs",
      theme: "/api/theme",
      admin: "/api/admin",
      appointments: "/api/appointments",
      events: "/api/events",
      orders: "/api/orders",
      contact: "/api/contact",
    },
  });
});


// ======================================================
// API ROUTES
// ======================================================

app.use("/api/auth", authRoutes);

app.use("/api/products", productsRoutes);

// Désactivé actuellement
// app.use("/api/coupons", couponsRoutes);

app.use("/api/blog", blogRoutes);

// Désactivé actuellement
// app.use("/api/theme", themeRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/uploads", uploadsRouter);

app.use("/api/faqs", faqsRoutes);

app.use("/api/banners", bannersRoutes);

app.use("/api/legal-links", legalLinksRoutes);

app.use("/api/parameters", parametersRoutes);

app.use("/api/pr", productReviewsRoutes);

app.use("/api/orders", ordersRoutes);

app.use("/api/contact", contactRoutes);

app.use("/api/appointments", appointmentsRoutes);

app.use("/api/events", eventsRoutes);

app.use("/api/admin/orders", adminOrdersRoutes);

app.use("/api/admin/finance", adminFinanceRoutes);

app.use(
  "/api/admin/newsletter-subscribers",
  newsletterRoutes
);

app.use(
  "/api/mondial-relay",
  mondialRelayRoutes
);

app.use(
  "/api/admin/ambassadors",
  adminAmbassadorsRoutes
);

app.use(
  "/api/ambassadors/me",
  ambassadorsRoute
);


// ======================================================
// REACT SPA FALLBACK
// ======================================================
//
// Exemple :
//
// https://hharmonie.com/signup
// https://hharmonie.com/login
// https://hharmonie.com/shop
// https://hharmonie.com/account
//
// Si l'utilisateur entre directement cette URL,
// Express renvoie index.html.
// React Router prend ensuite le contrôle.
//

app.use((req, res, next) => {

  // ------------------------------
  // NE PAS rediriger les API
  // ------------------------------

  if (
    req.path === "/api" ||
    req.path.startsWith("/api/")
  ) {
    return next();
  }


  // ------------------------------
  // NE PAS rediriger les uploads
  // ------------------------------

  if (
    req.path === "/uploads" ||
    req.path.startsWith("/uploads/")
  ) {
    return next();
  }


  // ------------------------------
  // Frontend React
  // ------------------------------

  if (req.method === "GET") {

    return res.sendFile(
      path.join(distPath, "index.html")
    );

  }

  next();
});


// ======================================================
// ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {

  console.error("=================================");
  console.error("SERVER ERROR");
  console.error("=================================");

  console.error("Method:", req.method);
  console.error("URL:", req.originalUrl);

  console.error("Message:", err.message);

  console.error("Stack:", err.stack);

  console.error("=================================");

  res.status(err.status || 500).json({
    error:
      err.message ||
      "Internal server error",
  });

});


// ======================================================
// API 404
// ======================================================
//
// Cette partie est atteinte principalement lorsqu'une
// route /api/... n'existe pas.
//

app.use((req, res) => {

  res.status(404).json({
    error: "Route not found",
  });

});


// ======================================================
// DATABASE + SERVER START
// ======================================================

pool
  .getConnection()

  .then((connection) => {

    console.log(
      "✓ Database connection established"
    );

    connection.release();


    app.listen(PORT, () => {

      console.log(
        `✓ Server running on port ${PORT}`
      );

      console.log(
        `✓ API available at http://localhost:${PORT}/api`
      );

      console.log(
        `✓ Frontend directory: ${distPath}`
      );

    });

  })

  .catch((err) => {

    console.error(
      "× Database connection failed:",
      err.message
    );

    console.error(
      "Please check your database configuration in .env file"
    );

    process.exit(1);

  });