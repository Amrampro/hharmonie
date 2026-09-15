// api/src/controllers/stripeWebhook.controller.js
import Stripe from "stripe";
import { query } from "../config/database.js";
import { sendOrderInvoiceEmail } from "../services/email/invoiceEmail.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

function toOrderPaymentStatus(stripeStatus) {
  // Stripe checkout.session.payment_status: 'paid' | 'unpaid' | 'no_payment_required'
  // Stripe payment_intent.status: requires_payment_method, processing, succeeded, canceled...
  // Nous mappons vers ton ENUM:
  if (!stripeStatus) return "processing";
  if (stripeStatus === "paid") return "succeeded";
  if (stripeStatus === "unpaid") return "failed";
  return "processing";
}

export async function stripeWebhook(req, res) {
  // console.log("[stripeWebhook] received", new Date().toISOString());

  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) return res.status(500).send("Missing STRIPE_WEBHOOK_SECRET");

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("Stripe webhook signature verify failed:", err?.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      /**
       * ✅ Le plus important : session payée
       */
      case "checkout.session.completed": {
        const session = event.data.object;

        const sessionId = session.id;
        const orderId = session?.metadata?.order_id || null;

        // payment_intent peut être string id
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null;

        // Mets à jour order_payments
        await query(
          `
          UPDATE order_payments
          SET status = 'succeeded',
              stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, ?),
              updated_at = NOW()
          WHERE stripe_checkout_session_id = ?
          `,
          [paymentIntentId, sessionId]
        );

        // Mets à jour orders -> paid
        if (orderId) {
          await query(
            `UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = ?`,
            [orderId]
          );
          // ✅ envoyer facture (anti-doublon via invoice_sent_at)
          try {
            const r = await sendOrderInvoiceEmail(orderId);
            console.log("[invoice] result:", r);
          } catch (e) {
            // ne pas casser le webhook si email échoue
            console.error("[invoice] failed:", e?.message);
          }
        }

        break;
      }

      /**
       * ✅ Si paiement échoue après tentative
       */
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const sessionId = session.id;
        const orderId = session?.metadata?.order_id || null;

        await query(
          `UPDATE order_payments SET status='failed', updated_at=NOW() WHERE stripe_checkout_session_id = ?`,
          [sessionId]
        );

        if (orderId) {
          await query(
            `UPDATE orders SET status='pending_payment', updated_at=NOW() WHERE id = ?`,
            [orderId]
          );
        }

        break;
      }

      /**
       * ✅ Remboursement (le plus fiable : charge.refunded ou refund.updated)
       * Ici on écoute "charge.refunded" (simple et courant)
       */
      case "charge.refunded": {
        const charge = event.data.object;

        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : null;

        if (paymentIntentId) {
          // Update payment row
          await query(
            `
            UPDATE order_payments
            SET status='refunded',
                stripe_charge_id = COALESCE(stripe_charge_id, ?),
                updated_at = NOW()
            WHERE stripe_payment_intent_id = ?
            `,
            [charge.id, paymentIntentId]
          );

          // Update order row via join
          await query(
            `
            UPDATE orders o
            JOIN order_payments op ON op.order_id = o.id
            SET o.status = 'refunded',
                o.updated_at = NOW()
            WHERE op.stripe_payment_intent_id = ?
            `,
            [paymentIntentId]
          );
        }

        break;
      }

      default:
        // On ignore les autres events pour l’instant
        break;
    }

    return res.json({ received: true });
  } catch (e) {
    console.error("Stripe webhook handler error:", e);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
