// client/src/pages/OrderSuccessPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { theme } from "../config/theme";
import { ordersService } from "../services/ordersService";
import { Button } from "../components/Button";
import { useCart } from "../contexts/CartContext";

type Order = {
  id: string;
  status: string;
  currency: string; // "EUR"
  subtotal_amount: number; // cents
  discount_amount: number; // cents
  shipping_amount: number; // cents
  total_amount: number; // cents
  coupon_code?: string | null;
  shipping_method?: "mondial_relay" | "home_delivery" | string;
  created_at?: string;
  invoice_sent_at?: string | null;
};

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  unit_price: number; // cents
  quantity: number;
  line_total: number; // cents
};

type OrderAddress = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  postal_code: string;
  address1: string;
  address2?: string | null;
};

type OrderShipping = {
  provider: string; // "mondial_relay"
  relay_point_id?: string | null;
  relay_point_name?: string | null;
  relay_point_address?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
};

type OrderResponse = {
  order: Order;
  items: OrderItem[];
  address: OrderAddress | null;
  shipping: OrderShipping | null;
  payment?: any;
};

function formatMoney(cents: number | null | undefined, currency = "EUR") {
  const n = typeof cents === "number" ? cents : 0;
  const amount = n / 100;
  try {
    return new Intl.NumberFormat("fr-BE", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} €`;
  }
}

function shippingLabel(method?: string | null, provider?: string | null) {
  const m = (method || "").toLowerCase();
  const p = (provider || "").toLowerCase();

  if (m === "mondial_relay" || p === "mondial_relay") return "Mondial Relay";
  if (m === "home_delivery") return "Livraison à domicile";
  if (method) return method;
  if (provider) return provider;
  return "—";
}

function fmtAddress(a: OrderAddress | null) {
  if (!a) return "—";
  const line2 = (a.address2 || "").trim();
  return [a.address1, line2 ? line2 : null, `${a.postal_code} ${a.city}`, a.country]
    .filter(Boolean)
    .join(", ");
}

/**
 * ✅ Persist modal dismissal per-order so it doesn't reappear after closing.
 */
const COMMUNITY_MODAL_KEY = "noveden.communityModal.dismissed.orders";

function getDismissedOrders(): Record<string, true> {
  try {
    const raw = localStorage.getItem(COMMUNITY_MODAL_KEY);
    return raw ? (JSON.parse(raw) as Record<string, true>) : {};
  } catch {
    return {};
  }
}

function markOrderDismissed(orderId: string) {
  try {
    const all = getDismissedOrders();
    all[orderId] = true;
    localStorage.setItem(COMMUNITY_MODAL_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function isOrderDismissed(orderId: string) {
  const all = getDismissedOrders();
  return !!all[orderId];
}

const WHATSAPP_COMMUNITY_URL = "https://chat.whatsapp.com/IH4gM1jVLyzI8dThr2n4Wi?mode=gi_t"; // ✅ remplace par ton lien WhatsApp

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = (searchParams.get("order") || "").trim();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<OrderResponse | null>(null);

  const { clearCart } = useCart();

  const [showCommunityModal, setShowCommunityModal] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = (await ordersService.getOrder(orderId)) as OrderResponse;
        if (cancelled) return;

        clearCart();
        setData(res);

        // ✅ show modal only if paid-ish and not dismissed for this order
        const st = String(res?.order?.status || "").toLowerCase();
        const isPaid =
          st === "paid" ||
          st === "succeeded" ||
          st === "processing" ||
          st === "delivered" ||
          st === "shipped";

        if (isPaid && orderId && !isOrderDismissed(orderId)) {
          setShowCommunityModal(true);
        }
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message || "Impossible de récupérer les détails de la commande pour le moment.");
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, clearCart]);

  const order = data?.order || null;
  const items = data?.items || [];
  const address = data?.address || null;
  const shipping = data?.shipping || null;

  const customerEmail = useMemo(() => {
    return address?.email || "l’adresse email utilisée lors de la commande";
  }, [address?.email]);

  const badge = useMemo(() => {
    const st = (order?.status || "").toLowerCase();
    if (st === "paid" || st === "succeeded") return { label: "Paiement confirmé", tone: "success" as const };
    if (st === "pending" || st === "pending_payment") return { label: "En attente", tone: "warn" as const };
    return { label: order?.status || "Confirmée", tone: "neutral" as const };
  }, [order?.status]);

  const badgeStyle: React.CSSProperties =
    badge.tone === "success"
      ? {
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          color: "rgb(6, 95, 70)",
        }
      : badge.tone === "warn"
      ? {
          background: "rgba(245, 158, 11, 0.12)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          color: "rgb(146, 64, 14)",
        }
      : {
          background: "rgba(148, 163, 184, 0.18)",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          color: "rgb(51, 65, 85)",
        };

  return (
    <div style={{ minHeight: "100vh", background: theme.colors.background.primary }}>
      {/* ✅ MODAL */}
      {showCommunityModal && (
        <CommunityModal
          whatsappUrl={WHATSAPP_COMMUNITY_URL}
          onClose={() => {
            if (orderId) markOrderDismissed(orderId);
            setShowCommunityModal(false);
          }}
        />
      )}

      {/* TOP / HERO */}
      <section
        style={{
          padding: `${theme.spacing["3xl"]} ${theme.spacing.lg}`,
          borderBottom: `1px solid ${theme.colors.border.light}`,
          background:
            "radial-gradient(1200px 400px at 20% 0%, rgba(34,197,94,0.10), transparent 60%), radial-gradient(900px 400px at 80% 10%, rgba(59,130,246,0.10), transparent 55%), " +
            theme.colors.background.sage,
        }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: theme.spacing.lg,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h1 style={{ ...theme.heading.h1, marginBottom: theme.spacing.sm }}>Merci pour votre commande ✨</h1>
              <p style={{ ...theme.body.large, color: theme.colors.text.secondary }}>
                Votre commande est en cours de traitement. Un reçu a été envoyé à <b>{customerEmail}</b> — si vous ne le
                trouvez pas, vérifiez aussi vos <b>spams</b>.
              </p>

              <p style={{ ...theme.body.base, color: theme.colors.text.secondary, marginTop: theme.spacing.sm }}>
                Besoin d’aide ? Écrivez à <b>contact@noveden.com</b> ou <b>noveden.beauty7@gmail.com</b>.
              </p>
            </div>

            <div style={{ display: "grid", gap: theme.spacing.sm, justifyItems: "end" }}>
              <div
                style={{
                  ...badgeStyle,
                  padding: "8px 12px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                {badge.label}
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: theme.borderRadius.lg,
                  border: `1px solid ${theme.colors.border.light}`,
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(8px)",
                  minWidth: 260,
                }}
              >
                <div style={{ fontSize: 12, color: theme.colors.text.light }}>Référence</div>
                <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>{orderId || "—"}</div>
                {order?.total_amount != null && (
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 12, color: theme.colors.text.light }}>Total</span>
                    <span style={{ fontWeight: 800, color: theme.colors.primary.main }}>
                      {formatMoney(order.total_amount, order.currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ marginTop: theme.spacing.lg, color: theme.colors.text.secondary }}>
              Chargement des détails de la commande...
            </div>
          )}

          {err && (
            <div
              style={{
                marginTop: theme.spacing.lg,
                padding: 12,
                border: `1px solid ${theme.colors.error.main}`,
                backgroundColor: theme.colors.error[50],
                color: theme.colors.error.main,
                borderRadius: theme.borderRadius.md,
              }}
            >
              {err}
            </div>
          )}
        </div>
      </section>

      {/* MAIN */}
      <section style={{ padding: `${theme.spacing["2xl"]} ${theme.spacing.lg}` }}>
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <div className="os-grid" style={{ display: "grid", gap: theme.spacing.xl }}>
            {/* LEFT: Items */}
            <div
              style={{
                background: theme.colors.background.secondary,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.borderRadius.lg,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: theme.spacing.lg,
                  borderBottom: `1px solid ${theme.colors.border.light}`,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ ...theme.heading.h4, marginBottom: 4 }}>Articles</div>
                  <div style={{ ...theme.body.small, color: theme.colors.text.secondary }}>{items.length} article(s)</div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  {order?.coupon_code && (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: `1px solid ${theme.colors.border.light}`,
                        background: theme.colors.background.primary,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      Coupon: <b>{order.coupon_code}</b>
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: theme.spacing.lg }}>
                {!items.length ? (
                  <div style={{ color: theme.colors.text.secondary }}>Aucun article trouvé.</div>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {items.map((it) => (
                      <div
                        key={it.id}
                        style={{
                          border: `1px solid ${theme.colors.border.light}`,
                          borderRadius: theme.borderRadius.lg,
                          padding: 14,
                          background: theme.colors.background.primary,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, lineHeight: 1.25, marginBottom: 6 }}>{it.product_name}</div>
                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                                fontSize: 13,
                                color: theme.colors.text.secondary,
                              }}
                            >
                              <span>
                                Prix unitaire: <b>{formatMoney(it.unit_price, order?.currency || "EUR")}</b>
                              </span>
                              <span>•</span>
                              <span>
                                Quantité: <b>{it.quantity}</b>
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, color: theme.colors.text.light }}>Total</div>
                            <div style={{ fontWeight: 900, fontSize: 16, color: theme.colors.text.primary }}>
                              {formatMoney(it.line_total, order?.currency || "EUR")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Shipping + Totals */}
            <div style={{ display: "grid", gap: theme.spacing.xl }}>
              {/* Shipping card */}
              <div
                style={{
                  background: theme.colors.background.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
                }}
              >
                <div style={{ ...theme.heading.h4, marginBottom: theme.spacing.sm }}>Livraison</div>

                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    padding: 12,
                    borderRadius: theme.borderRadius.lg,
                    border: `1px solid ${theme.colors.border.light}`,
                    background: theme.colors.background.primary,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ color: theme.colors.text.secondary }}>Méthode</span>
                    <b>{shippingLabel(order?.shipping_method, shipping?.provider)}</b>
                  </div>

                  {order?.shipping_method === "mondial_relay" && shipping && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ color: theme.colors.text.secondary }}>Point relais</span>
                        <b>{shipping.relay_point_name || "—"}</b>
                      </div>
                      <div style={{ color: theme.colors.text.secondary, fontSize: 13 }}>
                        {shipping.relay_point_address || "—"}
                      </div>
                      {shipping.relay_point_id && (
                        <div style={{ fontSize: 12, color: theme.colors.text.light }}>
                          ID relais: <b>{shipping.relay_point_id}</b>
                        </div>
                      )}
                    </>
                  )}

                  {order?.shipping_method !== "mondial_relay" && (
                    <div style={{ color: theme.colors.text.secondary, fontSize: 13 }}>
                      Adresse de livraison : <b>{fmtAddress(address)}</b>
                    </div>
                  )}

                  <div style={{ marginTop: 6, fontSize: 13, color: theme.colors.text.secondary }}>
                    <div>
                      <b>{address?.full_name || "—"}</b>
                    </div>
                    <div>{address ? fmtAddress(address) : "—"}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: theme.colors.text.light }}>
                      {address?.email || ""} {address?.phone ? `• ${address.phone}` : ""}
                    </div>
                  </div>
                </div>
              </div>

              {/* Totals card */}
              <div
                style={{
                  background: theme.colors.background.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.lg,
                }}
              >
                <div style={{ ...theme.heading.h4, marginBottom: theme.spacing.sm }}>Récapitulatif</div>

                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    padding: 12,
                    borderRadius: theme.borderRadius.lg,
                    border: `1px solid ${theme.colors.border.light}`,
                    background: theme.colors.background.primary,
                  }}
                >
                  <Row label="Sous-total" value={order ? formatMoney(order.subtotal_amount, order.currency) : "—"} />
                  <Row
                    label="Réduction"
                    value={order ? `- ${formatMoney(order.discount_amount, order.currency)}` : "—"}
                    muted
                  />
                  <Row label="Livraison" value={order ? formatMoney(order.shipping_amount, order.currency) : "—"} />

                  <div
                    style={{
                      borderTop: `1px solid ${theme.colors.border.light}`,
                      paddingTop: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontWeight: 800 }}>Total</span>
                    <span style={{ fontWeight: 900, fontSize: 18, color: theme.colors.primary.main }}>
                      {order ? formatMoney(order.total_amount, order.currency) : "—"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: theme.spacing.md,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <Link to="/shop" style={{ textDecoration: "none" }}>
                    <Button variant="outline">Continuer mes achats</Button>
                  </Link>
                  <Link to="/" style={{ textDecoration: "none" }}>
                    <Button variant="primary">Retour à l’accueil</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            .os-grid { grid-template-columns: 1fr; }
            @media (min-width: 1024px) {
              .os-grid { grid-template-columns: 1.6fr 1fr; align-items: start; }
            }
          `}</style>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: muted ? theme.colors.text.light : theme.colors.text.secondary }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function CommunityModal({
  whatsappUrl,
  onClose,
}: {
  whatsappUrl: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        padding: theme.spacing.lg,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
      }}
      onMouseDown={(e) => {
        // click outside closes
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          background: theme.colors.background.primary,
          borderRadius: 20,
          border: `1px solid ${theme.colors.border.light}`,
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: theme.spacing.lg,
            borderBottom: `1px solid ${theme.colors.border.light}`,
            background:
              "radial-gradient(900px 240px at 30% 0%, rgba(34,197,94,0.12), transparent 60%), radial-gradient(700px 240px at 80% 10%, rgba(59,130,246,0.10), transparent 55%)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: theme.colors.text.light, fontWeight: 700, letterSpacing: 0.4 }}>
                Après l’achat
              </div>
              <div style={{ ...theme.heading.h3, marginTop: 6 }}>🎉 Prolongez votre expérience Novéden</div>
            </div>

            <button
              onClick={onClose}
              aria-label="Fermer"
              style={{
                border: `1px solid ${theme.colors.border.light}`,
                background: "rgba(255,255,255,0.7)",
                borderRadius: 999,
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ marginTop: 10, color: theme.colors.text.secondary }}>
            Rejoignez la <b>Communauté Novéden</b> et bénéficiez d’un espace privé dédié à la peau et aux cheveux
            texturés.
          </p>
        </div>

        <div style={{ padding: theme.spacing.lg }}>
          <div
            style={{
              display: "grid",
              gap: 10,
              padding: 14,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${theme.colors.border.light}`,
              background: theme.colors.background.secondary,
            }}
          >
            <div style={{ fontWeight: 800 }}>✨ En rejoignant la communauté, vous bénéficiez :</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: theme.colors.text.secondary, lineHeight: 1.7 }}>
              <li>d’un <b>live éducatif</b> par mois</li>
              <li>d’interventions d’<b>expert·e·s spécialisés</b> peau & cheveux texturés</li>
              <li>de <b>conseils concrets</b> et adaptés à vos besoins</li>
              <li>d’un espace <b>bienveillant</b> et <b>sécurisé</b>, pensé pour vous accompagner</li>
            </ul>

            <div style={{ marginTop: 8, color: theme.colors.text.secondary }}>
              👉 Ce n’est pas un groupe WhatsApp classique. C’est un espace d’accompagnement, avec des rendez-vous
              éducatifs réguliers et un contenu de qualité.
            </div>

            <div style={{ marginTop: 6, fontSize: 13, color: theme.colors.text.light, fontWeight: 700 }}>
              🔒 Accès réservé aux client·e·s Novéden.
            </div>
          </div>

          <div style={{ marginTop: theme.spacing.lg, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "end" }}>
            <Button variant="outline" onClick={onClose}>
              Plus tard
            </Button>

            <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="primary">Rejoindre la Communauté Novéden sur WhatsApp</Button>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          [role="dialog"] > div {
            animation: popIn 180ms ease-out;
          }
          @keyframes popIn {
            from { transform: translateY(8px) scale(0.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}