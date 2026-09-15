import { useState } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  Check,
  X,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, getCartTotal, clearCart } =
    useCart();
  const { user } = useAuth();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const formatPrice = (price: number) => price.toFixed(2);

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.discount_amount || 0;
  };

  const getTotal = () => {
    return getCartTotal() - calculateDiscount();
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Veuillez entrer un code de coupon");
      return;
    }

    if (!user) {
      setCouponError("Vous devez être connecté pour utiliser un coupon");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const { coupon } = await api.validateCoupon(
        couponCode.trim().toUpperCase(),
        getCartTotal()
      );
      setAppliedCoupon(coupon);
      setCouponError("");
    } catch (error: any) {
      console.error("Error applying coupon:", error);
      setCouponError(error.message || "Erreur lors de l'application du coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // ✅ EMPTY CART
  if (items.length === 0) {
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
          }}
        >
          <div
            style={{
              maxWidth: theme.container.maxWidth,
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <h1 style={{ ...theme.heading.h1, marginBottom: theme.spacing.lg }}>
              Panier
            </h1>
          </div>
        </section>

        <section
          style={{
            backgroundColor: theme.colors.background.primary,
            padding: `${theme.spacing["4xl"]} ${theme.spacing.lg}`,
            minHeight: "60vh",
          }}
        >
          <div
            style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                margin: "0 auto",
                marginBottom: theme.spacing.xl,
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.full,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingBag size={48} color={theme.colors.text.light} />
            </div>

            <h2 style={{ ...theme.heading.h3, marginBottom: theme.spacing.md }}>
              Votre panier est vide
            </h2>

            <p
              style={{
                ...theme.body.large,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xl,
              }}
            >
              Découvrez nos produits et commencez votre shopping
            </p>

            <Button
              variant="primary"
              size="large"
              onClick={() => navigate("/shop")}
            >
              Découvrir la boutique
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // ✅ CART WITH ITEMS
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
        }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <Button
            variant="outline"
            onClick={() => navigate("/shop")}
            style={{ marginBottom: theme.spacing.lg }}
          >
            <ArrowLeft size={20} style={{ marginRight: theme.spacing.sm }} />
            Continuer les achats
          </Button>

          <h1 style={{ ...theme.heading.h1 }}>
            Panier ({items.length} {items.length === 1 ? "article" : "articles"}
            )
          </h1>
        </div>
      </section>

      <section
        style={{
          backgroundColor: theme.colors.background.primary,
          padding: `${theme.spacing["2xl"]} ${theme.spacing.lg}`,
          minHeight: "60vh",
        }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: theme.spacing["2xl"],
            }}
            className="cart-container"
          >
            {/* LEFT: ITEMS */}
            <div>
              <div style={{ marginBottom: theme.spacing.xl }}>
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    style={{
                      backgroundColor: theme.colors.background.primary,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.lg,
                      marginBottom: theme.spacing.md,
                      display: "grid",
                      gridTemplateColumns: "120px 1fr auto",
                      gap: theme.spacing.lg,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 120,
                        height: 120,
                        backgroundColor: theme.colors.background.secondary,
                        borderRadius: theme.borderRadius.md,
                        overflow: "hidden",
                      }}
                    >
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: theme.colors.text.light,
                            fontSize: theme.typography.fontSize.sm,
                          }}
                        >
                          Pas d'image
                        </div>
                      )}
                    </div>

                    <div>
                      <h3
                        style={{
                          ...theme.heading.h5,
                          marginBottom: theme.spacing.xs,
                        }}
                      >
                        {item.product.name}
                      </h3>
                      <p
                        style={{
                          ...theme.body.small,
                          color: theme.colors.text.secondary,
                          marginBottom: theme.spacing.sm,
                        }}
                      >
                        {item.product.short_description}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: theme.spacing.md,
                        }}
                      >
                        <span
                          style={{
                            ...theme.body.large,
                            fontWeight: theme.typography.fontWeight.bold,
                            color: theme.colors.text.primary,
                          }}
                        >
                          {formatPrice(Number(item.product.price))} €
                        </span>

                        {item.product.compare_at_price &&
                          Number(item.product.compare_at_price) >
                            Number(item.product.price) && (
                            <span
                              style={{
                                ...theme.body.small,
                                color: theme.colors.text.light,
                                textDecoration: "line-through",
                              }}
                            >
                              {formatPrice(
                                Number(item.product.compare_at_price)
                              )}{" "}
                              €
                            </span>
                          )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: theme.spacing.md,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: theme.spacing.xs,
                          border: `1px solid ${theme.colors.border.light}`,
                          borderRadius: theme.borderRadius.md,
                          padding: theme.spacing.xs,
                        }}
                      >
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          style={{
                            width: 32,
                            height: 32,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: theme.borderRadius.sm,
                            transition: theme.transition.fast,
                          }}
                        >
                          <Minus size={16} color={theme.colors.text.primary} />
                        </button>

                        <span
                          style={{
                            ...theme.body.base,
                            fontWeight: theme.typography.fontWeight.medium,
                            minWidth: "32px",
                            textAlign: "center",
                          }}
                        >
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          style={{
                            width: 32,
                            height: 32,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: theme.borderRadius.sm,
                            transition: theme.transition.fast,
                          }}
                        >
                          <Plus size={16} color={theme.colors.text.primary} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: theme.spacing.xs,
                          color: theme.colors.error.main,
                          fontSize: theme.typography.fontSize.sm,
                          padding: theme.spacing.xs,
                          borderRadius: theme.borderRadius.sm,
                          transition: theme.transition.fast,
                        }}
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={clearCart}
                style={{
                  ...theme.button.primary,
                  background: theme.colors.error.main,
                  borderColor: theme.colors.error.main,
                  display: "flex",
                }}
              >
                <Trash2 size={20} style={{ marginRight: theme.spacing.sm }} />
                Vider le panier
              </button>
            </div>

            {/* RIGHT: SUMMARY */}
            <div className="order-summary">
              <div
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing.xl,
                }}
              >
                <h3
                  style={{
                    ...theme.heading.h4,
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  Résumé de la commande
                </h3>

                {/* COUPON */}
                {/* <div
                  style={{
                    marginBottom: theme.spacing.lg,
                    paddingBottom: theme.spacing.lg,
                    borderBottom: `1px solid ${theme.colors.border.light}`,
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      ...theme.body.base,
                      fontWeight: theme.typography.fontWeight.medium,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Code promo
                  </label>

                  {appliedCoupon ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: theme.colors.success[50],
                        border: `1px solid ${theme.colors.success.main}`,
                        borderRadius: theme.borderRadius.md,
                        padding: theme.spacing.md,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: theme.spacing.sm,
                        }}
                      >
                        <Check size={20} color={theme.colors.success.main} />
                        <span
                          style={{
                            ...theme.body.base,
                            color: theme.colors.success.main,
                            fontWeight: theme.typography.fontWeight.medium,
                          }}
                        >
                          {appliedCoupon.code}
                        </span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: theme.spacing.xs,
                        }}
                      >
                        <X size={20} color={theme.colors.success.main} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", gap: theme.spacing.sm }}>
                        <div style={{ position: "relative", flex: 1 }}>
                          <Tag
                            size={20}
                            style={{
                              position: "absolute",
                              left: theme.spacing.md,
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: theme.colors.text.light,
                            }}
                          />
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) =>
                              setCouponCode(e.target.value.toUpperCase())
                            }
                            placeholder="Entrez votre code"
                            style={{
                              width: "100%",
                              padding: `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 48px`,
                              border: `1px solid ${theme.colors.border.main}`,
                              borderRadius: theme.borderRadius.md,
                              fontSize: theme.typography.fontSize.base,
                              fontFamily: theme.typography.fontFamily.body,
                            }}
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={applyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                        >
                          {couponLoading ? "Vérification..." : "Appliquer"}
                        </Button>
                      </div>
                      {couponError && (
                        <p
                          style={{
                            ...theme.body.small,
                            color: theme.colors.error.main,
                            marginTop: theme.spacing.sm,
                          }}
                        >
                          {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div> */}

                {/* TOTALS */}
                <div
                  style={{
                    borderBottom: `1px solid ${theme.colors.border.light}`,
                    paddingBottom: theme.spacing.lg,
                    marginBottom: theme.spacing.lg,
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
                      {formatPrice(getCartTotal())} €
                    </span>
                  </div>

                  {appliedCoupon && calculateDiscount() > 0 && (
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
                          color: theme.colors.success.main,
                        }}
                      >
                        Réduction ({appliedCoupon.code})
                      </span>
                      <span
                        style={{
                          ...theme.body.base,
                          color: theme.colors.success.main,
                          fontWeight: theme.typography.fontWeight.medium,
                        }}
                      >
                        -{formatPrice(calculateDiscount())} €
                      </span>
                    </div>
                  )}

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
                      Livraison
                    </span>
                    <span
                      style={{
                        ...theme.body.base,
                        color: theme.colors.success.main,
                      }}
                    >
                      Calculé au paiement
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: theme.spacing.xl,
                  }}
                >
                  <span style={{ ...theme.heading.h5 }}>Total</span>
                  <span
                    style={{
                      ...theme.heading.h4,
                      color: theme.colors.primary.main,
                    }}
                  >
                    {formatPrice(getTotal())} €
                  </span>
                </div>
                  <button
                    style={{ ...theme.button.primary,marginBottom: theme.spacing.md }}
                    onClick={() => navigate("/checkout")}
                  >
                    Procéder au paiement
                  </button>

                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => navigate("/shop")}
                >
                  Continuer les achats
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (min-width: 1024px) {
          .cart-container {
            grid-template-columns: 2fr 1fr !important;
          }
          .order-summary > div {
            position: sticky;
            top: 24px;
          }
        }
      `}</style>
    </div>
  );
}
