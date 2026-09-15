// api/src/routes/stripeWebhook.routes.js
import { Router } from "express";
import { stripeWebhook } from "../controllers/stripeWebhook.controller.js";
import express from "express";

const router = Router();

// ⚠️ Stripe a besoin du RAW body pour vérifier la signature
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);
// router.post("/stripe", stripeWebhook);

export default router;
