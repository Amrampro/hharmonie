// api/src/services/orders.service.js
import crypto from "node:crypto";
import Stripe from "stripe";
import { getConnection, query } from "../config/database.js";
import { findActiveAmbassadorByCode, computeCommissionForOrderSnapshot } from "./ambassadors/ambassadors.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const toInt = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : def;
};

const euroToCents = (eur) => {
  const n = Number(eur);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
};

async function computeAutoDiscountPercent(connection, email, phone) {
  const safeEmail = (email || "").trim().toLowerCase();
  const safePhone = (phone || "").trim();
  if (!safeEmail && !safePhone) return 0;

  const [[row]] = await connection.execute(
    `
    SELECT COUNT(*) AS paid_count
    FROM orders o
    JOIN order_addresses a ON a.order_id = o.id
    WHERE o.status IN ('paid','processing','shipped','delivered')
      AND (
        (? <> '' AND LOWER(a.email) = ?)
        OR
        (? <> '' AND a.phone = ?)
      )
    `,
    [safeEmail, safeEmail, safePhone, safePhone],
  );

  const paidCount = Number(row?.paid_count || 0);

  // 1st order (0 previous orders) => 10%
  if (paidCount === 0) return 10;

  // 6th order (5 previous orders) => 15%
  if (paidCount === 5) return 15;

  return 0;
}

async function fetchProductsForCartItems(connection, cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return [];

  const ids = cartItems.map((x) => String(x.product_id));
  const placeholders = ids.map(() => "?").join(",");

  const [rows] = await connection.execute(
    `SELECT id, name, price FROM products WHERE id IN (${placeholders})`,
    ids,
  );

  const products = rows || [];
  const map = new Map(products.map((p) => [String(p.id), p]));

  return cartItems.map((ci) => {
    const p = map.get(String(ci.product_id));
    if (!p) throw new Error(`Product not found: ${ci.product_id}`);

    const quantity = Math.max(1, toInt(ci.quantity, 1));
    const unitPriceCents = euroToCents(p.price);

    return {
      product_id: String(ci.product_id),
      product_name: String(p.name),
      unit_price: unitPriceCents,
      quantity,
      line_total: unitPriceCents * quantity,
    };
  });
}

async function createStripePercentCoupon(percentOff, currency = "EUR") {
  if (!percentOff || percentOff <= 0) return null;

  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: "once",
    name: `AUTO-${percentOff}%`,
    metadata: {
      type: "auto_discount",
      percent_off: String(percentOff),
      currency: String(currency),
    },
  });

  return coupon?.id ?? null;
}

export async function createCheckout({
  userId,
  cart_items,
  coupon_code,
  ambassador_code,
  shipping,
}) {
  if (!Array.isArray(cart_items) || cart_items.length === 0)
    throw new Error("Cart is empty");
  if (!shipping?.method) throw new Error("Shipping method is required");
  if (!shipping?.address) throw new Error("Shipping address is required");

  // ✅ shipping.amount (cents) vient du frontend
  const shipping_amount = Math.max(0, toInt(shipping?.amount, 0));

  const currency = "EUR";
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // 1) items + subtotal
    const normalizedItems = await fetchProductsForCartItems(
      connection,
      cart_items,
    );

    const subtotal_amount = normalizedItems.reduce(
      (sum, it) => sum + toInt(it.line_total, 0),
      0,
    );

    // 2) auto discount sur subtotal (pas sur shipping)
    const a = shipping.address;
    const percentOff = await computeAutoDiscountPercent(
      connection,
      a.email,
      a.phone,
    );

    const discount_amount = percentOff
      ? Math.round(subtotal_amount * (percentOff / 100))
      : 0;

      const shipping_amount = Math.max(0, toInt(shipping?.amount, 0));

    // ✅ ambassador lookup + commission snapshot
    const ambassador = ambassador_code ? await findActiveAmbassadorByCode(ambassador_code) : null;
    const ambassadorCommissionAmount = ambassador
      ? computeCommissionForOrderSnapshot(ambassador, subtotal_amount)
      : 0;

    // 3) total
    const total_amount = Math.max(
      0,
      subtotal_amount - discount_amount + shipping_amount,
    );

    // UPDATED: generate code name based on new logic
    const autoCode =
      percentOff === 10
        ? "AUTO_FIRST_10"
        : percentOff === 15
          ? "AUTO_6TH_15"
          : null;

    const finalCouponCode = autoCode ?? coupon_code ?? null;

    const orderId = crypto.randomUUID();

    // ✅ IMPORTANT: ta table orders a user_id NOT NULL, donc on force un entier >= 0
    const safeUserId = Number.isFinite(Number(userId)) ? Number(userId) : 0;

    // 5) create order
    await connection.execute(
      `
      INSERT INTO orders
        (id, user_id, status, currency,
         subtotal_amount, discount_amount, shipping_amount, total_amount,
         coupon_code,
         ambassador_id, ambassador_code, ambassador_commission_amount, ambassador_commission_currency,
         shipping_method, shipping_status,
         shipping_tracking_number, shipping_tracking_url,
         created_at, updated_at)
      VALUES
        (?, ?, 'pending_payment', ?,
         ?, ?, ?, ?,
         ?,
         ?, ?, ?, 'EUR',
         ?, 'not_set',
         NULL, NULL,
         NOW(), NOW())
      `,
      [
        orderId,
        safeUserId,
        "EUR",
        subtotal_amount,
        discount_amount,
        shipping_amount,
        total_amount,
        finalCouponCode,
        ambassador?.id ?? null,
        ambassador?.code ?? null,
        ambassadorCommissionAmount,
        shipping.method,
      ],
    );
    /*
    await connection.execute(
      `
      INSERT INTO orders
        (id, user_id, status, currency,
         subtotal_amount, discount_amount, shipping_amount, total_amount,
         coupon_code, shipping_method, shipping_status,
         shipping_tracking_number, shipping_tracking_url,
         created_at, updated_at)
      VALUES
        (?, ?, 'pending_payment', ?,
         ?, ?, ?, ?,
         ?, ?, 'not_set',
         NULL, NULL,
         NOW(), NOW())
      `,
      [
        orderId,
        safeUserId,
        currency,
        subtotal_amount,
        discount_amount,
        shipping_amount,
        total_amount,
        finalCouponCode,
        shipping.method,
      ],
    );*/

    // 6) items
    for (const it of normalizedItems) {
      await connection.execute(
        `
        INSERT INTO order_items
          (id, order_id, product_id, product_name, unit_price, quantity, line_total, created_at)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, NOW())
        `,
        [
          crypto.randomUUID(),
          orderId,
          it.product_id,
          it.product_name,
          it.unit_price,
          it.quantity,
          it.line_total,
        ],
      );
    }

    // 7) address
    await connection.execute(
      `
      INSERT INTO order_addresses
        (id, order_id, full_name, email, phone, country, city, postal_code, address1, address2, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        crypto.randomUUID(),
        orderId,
        a.full_name,
        a.email,
        a.phone,
        (a.country || "BE").toUpperCase(),
        a.city,
        a.postal_code,
        a.address1,
        a.address2 ?? null,
      ],
    );

    // 8) shipping details (mondial relay)
    const relay =
      shipping.method === "mondial_relay"
        ? (shipping.relay_point ?? null)
        : null;

    await connection.execute(
      `
      INSERT INTO order_shipping
        (id, order_id, provider, relay_point_id, relay_point_name, relay_point_address,
         label_url, tracking_number, tracking_url, created_at, updated_at)
      VALUES
        (?, ?, 'mondial_relay', ?, ?, ?, NULL, NULL, NULL, NOW(), NOW())
      `,
      [
        crypto.randomUUID(),
        orderId,
        relay?.id ?? null,
        relay?.name ?? null,
        relay?.address ?? null,
      ],
    );

    /*// 9) Stripe hosted checkout
    const successUrl = `${process.env.CORS_ORIGIN}/order-success?session_id={CHECKOUT_SESSION_ID}`;
      // ,"http://localhost:5173/order-success?session_id={CHECKOUT_SESSION_ID}";
    const cancelUrl = `${process.env.CORS_ORIGIN}/checkout?canceled=1`;
      // process.env.CORS_ORIGIN || "http://localhost:5173/checkout?canceled=1";

    const stripeCouponId = percentOff ? await createStripePercentCoupon(percentOff, currency) : null;

    // ✅ Ajouter shipping via shipping_options (Stripe gère ça proprement)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: normalizedItems.map((it) => ({
        quantity: it.quantity,
        price_data: {
          currency: "eur",
          unit_amount: it.unit_price,
          product_data: { name: it.product_name },
        },
      })),
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,

      // Shipping cost
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: shipping.method === "mondial_relay" ? "Mondial Relay" : "Livraison à domicile",
            fixed_amount: { amount: shipping_amount, currency: "eur" },
            type: "fixed_amount",
          },
        },
      ],

      customer_email: a.email || undefined,
      metadata: {
        order_id: orderId,
        user_id: String(safeUserId),
        auto_discount_percent: percentOff ? String(percentOff) : "0",
        shipping_amount: String(shipping_amount),
        shipping_method: String(shipping.method),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });*/

    // 9) Stripe hosted checkout
    const baseUrl = process.env.CORS_ORIGIN || "http://localhost:5173";

    // ✅ Solution A: retour avec orderId (plus de session_id dans l'URL)
    const successUrl = `${baseUrl}/order-success?order=${encodeURIComponent(orderId)}`;
    const cancelUrl = `${baseUrl}/checkout?canceled=1`;

    const stripeCouponId = percentOff
      ? await createStripePercentCoupon(percentOff, currency)
      : null;

    // ✅ Ajouter shipping via shipping_options (Stripe gère ça proprement)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      // ✅ utile: retrouver l'orderId depuis Stripe
      client_reference_id: orderId,

      line_items: normalizedItems.map((it) => ({
        quantity: it.quantity,
        price_data: {
          currency: "eur",
          unit_amount: it.unit_price,
          product_data: { name: it.product_name },
        },
      })),

      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,

      shipping_options: [
        {
          shipping_rate_data: {
            display_name:
              shipping.method === "mondial_relay"
                ? "Mondial Relay"
                : "Livraison à domicile",
            fixed_amount: { amount: shipping_amount, currency: "eur" },
            type: "fixed_amount",
          },
        },
      ],

      customer_email: a.email || undefined,

      metadata: {
        order_id: orderId,
        user_id: String(safeUserId),
        auto_discount_percent: percentOff ? String(percentOff) : "0",
        shipping_amount: String(shipping_amount),
        shipping_method: String(shipping.method),
      },

      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // 10) payment row
    await connection.execute(
      `
      INSERT INTO order_payments
        (id, order_id, provider, status, stripe_payment_intent_id, stripe_charge_id,
         stripe_checkout_session_id, amount, currency, created_at, updated_at)
      VALUES
        (?, ?, 'stripe', 'requires_payment', NULL, NULL,
         ?, ?, ?, NOW(), NOW())
      `,
      [crypto.randomUUID(), orderId, session.id, total_amount, currency],
    );

    await connection.commit();

    return {
      order: {
        id: orderId,
        subtotal_amount,
        discount_amount,
        shipping_amount,
        total_amount,
        currency: "EUR",
        status: "pending_payment",
        coupon_code: finalCouponCode,
        ambassador: ambassador
          ? { id: ambassador.id, code: ambassador.code, commission_amount: ambassadorCommissionAmount }
          : null,
      },
      stripe: {
        session_id: session.id,
        checkout_url: session.url,
      },
    };
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

export async function getOrderForUser({ orderId }) {
  if (!orderId) throw new Error("orderId is required");

  const [order] = await query(`SELECT * FROM orders WHERE id = ? LIMIT 1`, [
    orderId,
  ]);
  if (!order) throw new Error("Order not found");

  const items = await query(
    `SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC`,
    [orderId],
  );
  const [address] = await query(
    `SELECT * FROM order_addresses WHERE order_id = ? LIMIT 1`,
    [orderId],
  );
  const [shipping] = await query(
    `SELECT * FROM order_shipping WHERE order_id = ? LIMIT 1`,
    [orderId],
  );
  const [payment] = await query(
    `SELECT * FROM order_payments WHERE order_id = ? LIMIT 1`,
    [orderId],
  );

  return {
    order,
    items,
    address: address ?? null,
    shipping: shipping ?? null,
    payment: payment ?? null,
  };
}
