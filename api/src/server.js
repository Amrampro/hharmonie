// api/src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import couponsRoutes from './routes/coupons.js';
import blogRoutes from './routes/blog.js';
import themeRoutes from './routes/theme.js';
import adminRoutes from './routes/admin/index.js';
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



import pool from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Stripe webhook needs raw body
// app.use("/api/webhooks", express.raw({ type: "application/json" }), stripeWebhookRoutes);
app.use("/api/stripe", stripeWebhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'E-Commerce API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      coupons: '/api/coupons',
      blog: '/api/blog',
      faq: '/api/faq',
      theme: '/api/theme',
      admin: '/api/admin',
      appointments: '/api/appointments',
      events: '/api/events'
    }
  });
});

import path from "path";

app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
// app.use('/api/coupons', couponsRoutes);
app.use('/api/blog', blogRoutes);
// app.use('/api/faq', faqRoutes);
// app.use('/api/theme', themeRoutes);
app.use('/api/admin', adminRoutes);
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
app.use("/api/admin/newsletter-subscribers", newsletterRoutes);
app.use("/api/mondial-relay", mondialRelayRoutes);
app.use("/api/admin/ambassadors", adminAmbassadorsRoutes);
app.use("/api/ambassadors/me", ambassadorsRoute);


app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

pool.getConnection()
  .then(connection => {
    console.log('✓ Database connection established');
    connection.release();

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('× Database connection failed:', err.message);
    console.error('Please check your database configuration in .env file');
    process.exit(1);
  });
