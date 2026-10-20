import { shippingService, ShippingMethod } from "../services/shippingService";
// client/src/pages/CheckoutPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { ordersService } from "../services/ordersService";
import { MondialRelayPicker } from "../components/MondialRelayPicker";

// --- INITIALISATION STRIPE ---
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string,
);

const baseUrl = import.meta.env.VITE_BASE_URL;

// Utilitaires de conversion
function eurToCents(eur: number) {
  return Math.round(eur * 100);
}

type AddressForm = {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  postal_code: string;
  address1?: string;
  address2?: string;
};

// --- COMPOSANT INTERNE : FORMULAIRE STRIPE ---
function CheckoutInner({
  orderId,
  onPaid,
}: {
  clientSecret: string;
  orderId: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handlePay = async () => {
    setPayError(null);
    if (!stripe || !elements) return;

    setPayBusy(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${baseUrl}/order-success?order=${encodeURIComponent(orderId)}`,
        },
      });

      if (result.error) {
        setPayError(result.error.message || "Paiement refusé.");
      } else {
        onPaid();
      }
    } finally {
      setPayBusy(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        border: `1px solid ${theme.colors.border.light}`,
      }}
    >
      <h3 style={{ ...theme.heading.h4, marginBottom: theme.spacing.lg }}>
        Paiement sécurisé
      </h3>

      <div style={{ marginBottom: theme.spacing.lg }}>
        <PaymentElement />
      </div>

      {payError && (
        <div
          style={{
            backgroundColor: theme.colors.error[50],
            border: `1px solid ${theme.colors.error.main}`,
            color: theme.colors.error.main,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.md,
          }}
        >
          {payError}
        </div>
      )}

      <Button
        variant="primary"
        size="large"
        fullWidth
        onClick={handlePay}
        disabled={!stripe || payBusy}
      >
        {payBusy ? "Paiement en cours..." : "Payer maintenant"}
      </Button>

      <p
        style={{
          ...theme.body.small,
          textAlign: "center",
          color: theme.colors.text.light,
          marginTop: theme.spacing.sm,
        }}
      >
        Paiement via Stripe • Vos informations sont chiffrées.
      </p>
    </div>
  );
}

// --- PAGE PRINCIPALE : CHECKOUT ---
export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, getCartTotal, clearCart } = useCart();

  const [step] = useState<"form" | "payment">("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientSecret] = useState<string | null>(null);
  const [orderId] = useState<string | null>(null);


  const [shippingMethod, setShippingMethod] = useState<
    "mondial_relay" | "home_delivery"
  >("mondial_relay");

  const [relayPoint, setRelayPoint] = useState<{
    id: string;
    name?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  } | null>(null);

  const [addr, setAddr] = useState<AddressForm>({
    full_name: "",
    email: user?.email || "",
    phone: "",
    country: "BE",
    city: "",
    postal_code: "",
    address1: "",
    address2: "",
  });

  const cartItemsPayload = useMemo(() => {
    return items.map((it) => ({
      product_id: it.product.id,
      quantity: it.quantity,
    }));
  }, [items]);

  const [shippingConfig, setShippingConfig] = useState<ShippingMethod[]>([]);
  const [shippingError, setShippingError] = useState("");
  useEffect(() => { shippingService.get().then(setShippingConfig).catch(e => setShippingError(e.message)); }, []);
  const methodConfig = shippingConfig.find(m => m.method === shippingMethod);
  const countries = methodConfig?.rates || [];
  const threshold = methodConfig?.free_shipping_threshold_cents ?? null;
  const subtotalEur = Number(getCartTotal() || 0);
  const subtotalCents = eurToCents(subtotalEur);
  const isFreeShipping = threshold !== null && subtotalCents >= threshold;
  const selectedRate = countries.find(r => r.country_code === addr.country);
  const shippingEur = selectedRate ? (isFreeShipping ? 0 : selectedRate.amount_cents / 100) : undefined;
  useEffect(() => {
    if (methodConfig && !methodConfig.rates.some(r => r.country_code === addr.country)) {
      setAddr(a => ({ ...a, country: methodConfig.rates[0]?.country_code || "", city: "" }));
    }
    setRelayPoint(null);
  }, [shippingMethod, addr.country, methodConfig]);

  const shippingCents = useMemo(
    () => (shippingEur !== undefined ? eurToCents(shippingEur) : 0),
    [shippingEur],
  );

  const totalCentsEstimate = useMemo(
    () => subtotalCents + shippingCents,
    [subtotalCents, shippingCents],
  );

  const isCountrySupported = shippingEur !== undefined;
  const isRelayMissing = shippingMethod === "mondial_relay" && !relayPoint;
  const isSubmitDisabled = busy || !isCountrySupported || isRelayMissing;

  if (!items.length) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ ...theme.body.large, marginBottom: theme.spacing.md }}>
            Votre panier est vide.
          </p>
          <Button variant="primary" onClick={() => navigate("/shop")}>
            Aller à la boutique
          </Button>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const requiredCommon: (keyof AddressForm)[] = [
      "full_name",
      "email",
      "phone",
      "country",
      "postal_code",
    ];

    for (const k of requiredCommon) {
      const labels: Partial<Record<keyof AddressForm, string>> = { full_name: "nom complet", email: "e-mail", phone: "téléphone", country: "pays", postal_code: "code postal" };
      if (!String(addr[k] || "").trim()) return `Veuillez renseigner le champ ${labels[k] || k}.`;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr.email.trim())) return "Veuillez renseigner un e-mail valide.";
    if (addr.phone.replace(/\D/g, "").length < 6) return "Veuillez renseigner un téléphone valide.";
    if (shippingMethod === "home_delivery" && !addr.city.trim()) return "Veuillez renseigner la ville.";
    if (!isCountrySupported) {
      const modeLabel =
        shippingMethod === "mondial_relay"
          ? "Mondial Relay"
          : "Livraison à domicile";
      return `La livraison ${modeLabel} n'est pas disponible pour ce pays (${addr.country}).`;
    }

    if (shippingMethod === "mondial_relay") {
      if (!relayPoint?.id) return "Veuillez choisir un point Mondial Relay.";
    } else {
      if (!String(addr.address1 || "").trim()) return "Veuillez renseigner l’adresse de livraison.";
    }

    return null;
  };

  const startCheckout = async () => {
    setError(null);
    const v = validateForm();
    if (v) return setError(v);

    setBusy(true);
    try {
      const countryCode = (addr.country || "BE").toUpperCase();

      const shippingAddress =
        shippingMethod === "mondial_relay"
          ? {
              full_name: addr.full_name,
              email: addr.email,
              phone: addr.phone,
              country: (relayPoint?.country || countryCode).toUpperCase(),
              city: relayPoint?.city || addr.city,
              postal_code: relayPoint?.postalCode || addr.postal_code,
              address1: relayPoint?.address || "Point Relais Mondial Relay",
              address2: relayPoint?.name || null,
            }
          : {
              full_name: addr.full_name,
              email: addr.email,
              phone: addr.phone,
              country: countryCode,
              city: addr.city,
              postal_code: addr.postal_code,
              address1: addr.address1 || "",
              address2: addr.address2 || null,
            };

      const payload = {
        cart_items: cartItemsPayload,
        coupon_code: null,
        shipping: {
          method: shippingMethod,
          amount: shippingCents,
          address: shippingAddress,
          relay_point: shippingMethod === "mondial_relay" ? relayPoint : null,
        },
      };

      const { stripe, order } = await ordersService.checkout(payload);
      try { sessionStorage.setItem(`order-token:${order.id}`, order.tracking_token); } catch { /* The return URL also contains the private token. */ }
      window.location.href = stripe.checkout_url;
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'initialisation du paiement");
    } finally {
      setBusy(false);
    }
  };

  const getOptionLabel = (code: string, label: string) => {
    const rate = countries.find(r => r.country_code === code);
    return `${label} — ${isFreeShipping ? "Gratuit" : ((rate?.amount_cents || 0) / 100).toFixed(2) + " €"}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.colors.background.primary,
      }}
    >
      <section
        style={{
          backgroundColor: theme.colors.background.sage,
          padding: `${theme.spacing["3xl"]} ${theme.spacing.lg}`,
          borderBottom: `1px solid ${theme.colors.border.light}`,
        }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <h1 style={{ ...theme.heading.h1 }}>Commande</h1>
          <p
            style={{ ...theme.body.large, color: theme.colors.text.secondary }}
          >
            Finalisez vos informations de livraison puis payez via Stripe.
          </p>
        </div>
      </section>

      <section
        style={{ padding: `${theme.spacing["2xl"]} ${theme.spacing.lg}` }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: theme.spacing["2xl"],
            }}
            className="checkout-grid"
          >
            {/* GAUCHE : FORMULAIRE */}
            <div>
              {error && (
                <div
                  style={{
                    backgroundColor: theme.colors.error[50],
                    border: `1px solid ${theme.colors.error.main}`,
                    color: theme.colors.error.main,
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  {error}
                </div>
              )}

              {step === "form" ? (
                <div
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.xl,
                    border: `1px solid ${theme.colors.border.light}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.spacing.lg,
                  }}
                >
                  <h3 style={{ ...theme.heading.h4 }}>Mode de livraison</h3>

                  <div
                    style={{
                      display: "flex",
                      gap: theme.spacing.md,
                      flexWrap: "wrap",
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    <Button
                      variant={
                        shippingMethod === "mondial_relay"
                          ? "primary"
                          : "outline"
                      }
                      onClick={() => setShippingMethod("mondial_relay")}
                    >
                      Mondial Relay
                    </Button>
                    <Button
                      variant={
                        shippingMethod === "home_delivery"
                          ? "primary"
                          : "outline"
                      }
                      onClick={() => setShippingMethod("home_delivery")}
                    >
                      Livraison à domicile
                    </Button>
                  </div>

                  <h3 style={{ ...theme.heading.h4 }}>Informations</h3>
                  <p>Les champs marqués * sont obligatoires. La ville du point relais est renseignée lors de sa sélection.</p>
                  {shippingError && <p role="alert">{shippingError}</p>}
                  {!methodConfig && !shippingError && <p>Chargement des tarifs…</p>}

                  <div style={{ display: "grid", gap: theme.spacing.md }}>
                    <label>Nom complet *<input required
                      value={addr.full_name}
                      onChange={(e) =>
                        setAddr((s) => ({ ...s, full_name: e.target.value }))
                      }
                      placeholder="Nom complet"
                      style={inputStyle()}
                    /></label>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
                        gap: theme.spacing.md,
                      }}
                    >
                      <label>E-mail *<input required type="email"
                        value={addr.email}
                        onChange={(e) =>
                          setAddr((s) => ({ ...s, email: e.target.value }))
                        }
                        placeholder="Email"
                        style={inputStyle()}
                      /></label>
                      <label>Téléphone *<input required type="tel"
                        value={addr.phone}
                        onChange={(e) =>
                          setAddr((s) => ({ ...s, phone: e.target.value }))
                        }
                        placeholder="Téléphone"
                        style={inputStyle()}
                      /></label>
                    </div>

                    {shippingMethod === "home_delivery" && (
                      <>
                        <label>Adresse *<input required
                          value={addr.address1 || ""}
                          onChange={(e) =>
                            setAddr((s) => ({ ...s, address1: e.target.value }))
                          }
                          placeholder="Adresse"
                          style={inputStyle()}
                        /></label>
                        <input
                          value={addr.address2 || ""}
                          onChange={(e) =>
                            setAddr((s) => ({ ...s, address2: e.target.value }))
                          }
                          placeholder="Complément (optionnel)"
                          style={inputStyle()}
                        />
                      </>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
                        gap: theme.spacing.md,
                      }}
                    >
                      <label>Code postal *<input required
                        value={addr.postal_code}
                        onChange={(e) =>
                          setAddr((s) => ({
                            ...s,
                            postal_code: e.target.value,
                          }))
                        }
                        placeholder="Code postal"
                        style={inputStyle()}
                      /></label>
                      <label>Ville{shippingMethod === "home_delivery" ? " *" : " (point relais)"}<input required={shippingMethod === "home_delivery"} readOnly={shippingMethod === "mondial_relay"}
                        value={addr.city}
                        onChange={(e) =>
                          setAddr((s) => ({ ...s, city: e.target.value }))
                        }
                        placeholder="Ville"
                        style={inputStyle()}
                      /></label>
                      <label>Pays *<select required
                        value={(addr.country || "BE").toUpperCase()}
                        onChange={(e) =>
                          setAddr((s) => ({
                            ...s,
                            country: e.target.value.toUpperCase(),
                          }))
                        }
                        style={inputStyle()}
                      >
                        {countries.map((c) => (
                          <option key={c.country_code} value={c.country_code}>
                            {getOptionLabel(c.country_code, c.country_name)}
                          </option>
                        ))}
                      </select></label>
                    </div>

                    {isFreeShipping && isCountrySupported && (
                      <div
                        style={{
                          padding: theme.spacing.md,
                          borderRadius: theme.borderRadius.md,
                          backgroundColor: theme.colors.success[50],
                          border: `1px solid ${theme.colors.success.main}`,
                          color: theme.colors.success.main,
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                        }}
                      >
                        Livraison offerte pour ce mode dès {((threshold || 0) / 100).toFixed(2)} € d’articles avant remise.
                      </div>
                    )}

                    {shippingMethod === "mondial_relay" && (
                      <div
                        style={{
                          fontSize: 13,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        L’adresse de livraison enregistrée sera celle du Point
                        Relais sélectionné.
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      paddingTop: theme.spacing.lg,
                      borderTop: `1px solid ${theme.colors.border.light}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: theme.spacing.md,
                    }}
                  >
                    {shippingMethod === "mondial_relay" && (
                      <div style={{ display: "grid", gap: theme.spacing.md }}>
                        {isCountrySupported ? (
                          <>
                            <h3 style={{ ...theme.heading.h4 }}>
                              Point Relais
                            </h3>

                            <MondialRelayPicker
                              brandCode={
                                import.meta.env.VITE_MR_BRAND_CODE as string
                              }
                              country={addr.country || "BE"}
                              postCode={addr.postal_code}
                              city={addr.city}
                              onSelect={(relay) => {
                                setAddr(a => ({ ...a, city: relay.city || "" }));
                                setRelayPoint({
                                  id: relay.id,
                                  name: relay.name ?? undefined,
                                  address: relay.address ?? undefined,
                                  city: relay.city ?? undefined,
                                  postalCode: relay.postalCode ?? undefined,
                                  country: relay.country ?? undefined,
                                });
                              }}
                            />

                            {relayPoint?.id && (
                              <div
                                style={{
                                  backgroundColor:
                                    theme.colors.background.secondary,
                                  border: `1px solid ${theme.colors.border.light}`,
                                  borderRadius: theme.borderRadius.md,
                                  padding: theme.spacing.md,
                                }}
                              >
                                <div
                                  style={{
                                    ...theme.body.base,
                                    fontWeight:
                                      theme.typography.fontWeight.medium,
                                  }}
                                >
                                  {relayPoint.name || relayPoint.id}
                                </div>
                                <div
                                  style={{
                                    ...theme.body.small,
                                    color: theme.colors.text.secondary,
                                  }}
                                >
                                  {relayPoint.address}
                                  {relayPoint.postalCode || relayPoint.city
                                    ? `, ${relayPoint.postalCode || ""} ${relayPoint.city || ""}`.trim()
                                    : ""}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ color: theme.colors.error.main }}>
                            Mondial Relay n'est pas disponible pour ce pays (
                            {addr.country}).
                          </div>
                        )}
                      </div>
                    )}

                    {shippingMethod === "home_delivery" &&
                      !isCountrySupported && (
                        <div style={{ color: theme.colors.error.main }}>
                          La livraison à domicile n'est pas disponible pour ce
                          pays ({addr.country}).
                        </div>
                      )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: theme.spacing.md,
                      justifyContent: "flex-end",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Button variant="outline" onClick={() => navigate("/cart")}>
                      Retour au panier
                    </Button>
                    <Button
                      variant="primary"
                      size="large"
                      onClick={startCheckout}
                      disabled={isSubmitDisabled}
                    >
                      {busy ? "Préparation..." : "Continuer vers le paiement"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {clientSecret && orderId && (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: { theme: "stripe" },
                      }}
                    >
                      <CheckoutInner
                        clientSecret={clientSecret}
                        orderId={orderId}
                        onPaid={() => clearCart()}
                      />
                    </Elements>
                  )}
                </>
              )}
            </div>

            {/* DROITE : RÉSUMÉ */}
            <div>
              <div
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.xl,
                  border: `1px solid ${theme.colors.border.light}`,
                  position: "sticky",
                  top: 24,
                }}
              >
                <h3
                  style={{
                    ...theme.heading.h4,
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  Résumé
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.spacing.sm,
                  }}
                >
                  {items.map((it) => (
                    <div
                      key={it.product.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: theme.spacing.md,
                      }}
                    >
                      <div
                        style={{
                          ...theme.body.small,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        {it.product.name} × {it.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: theme.spacing.lg,
                    paddingTop: theme.spacing.lg,
                    borderTop: `1px solid ${theme.colors.border.light}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <span
                      style={{
                        ...theme.body.base,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      Sous-total
                    </span>
                    <span
                      style={{
                        ...theme.body.base,
                        fontWeight: theme.typography.fontWeight.medium,
                      }}
                    >
                      {Number(getCartTotal()).toFixed(2)} €
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <span
                      style={{
                        ...theme.body.base,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      Livraison (
                      {shippingMethod === "mondial_relay"
                        ? "Relay"
                        : "Domicile"}
                      )
                    </span>
                    <span
                      style={{
                        ...theme.body.base,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: !isCountrySupported
                          ? theme.colors.error.main
                          : isFreeShipping
                            ? theme.colors.success.main
                            : "inherit",
                      }}
                    >
                      {isCountrySupported
                        ? shippingEur === 0
                          ? "Gratuite"
                          : `${shippingEur!.toFixed(2)} €`
                        : "--"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: theme.spacing.md,
                    }}
                  >
                    <span style={{ ...theme.heading.h5 }}>Total</span>
                    <span
                      style={{
                        ...theme.heading.h4,
                        color: theme.colors.primary.main,
                      }}
                    >
                      {isCountrySupported
                        ? (totalCentsEstimate / 100).toFixed(2)
                        : "--"}{" "}
                      €
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: theme.spacing.sm,
                      ...theme.body.small,
                      color: theme.colors.text.light,
                    }}
                  >
                    Total estimé (hors coupons). Le total final est confirmé sur
                    Stripe.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @media (min-width: 1024px) {
              .checkout-grid {
                grid-template-columns: 2fr 1fr !important;
              }
            }
          `}</style>
        </div>
      </section>
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: `${theme.spacing.md} ${theme.spacing.md}`,
    border: `1px solid ${theme.colors.border.main}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    backgroundColor: theme.colors.background.primary,
    outline: "none",
  };
}
