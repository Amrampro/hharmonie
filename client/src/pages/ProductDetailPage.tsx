// client/src/pages/ProductDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  HelpCircle,
  Leaf,
  PlusCircle,
  ShoppingCart,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";

import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { ProductImageGallery } from "../components/ProductImageGallery";

import { useCart } from "../contexts/CartContext";
import {
  productService,
  type Product,
  type ProductImage,
  type ProductReview,
} from "../services/productService";
import { SITE_NAME, SITE_URL } from "../components/Seo";

type RouteParams = { slug?: string };
type ProductInfoSection = {
  id: string;
  title: string;
  content: string;
  Icon: LucideIcon;
};

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<RouteParams>();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    customer_name: "",
    customer_email: "",
    rating: 5,
    title: "",
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeProductInfo, setActiveProductInfo] =
    useState<ProductInfoSection | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setMessage("");
      try {
        const { product } = await productService.getProductBySlug(slug);

        if (!mounted) return;

        setProduct(product);

        // images + reviews are already attached by backend in getProductBySlug
        setProductImages((product.images || []) as ProductImage[]);
        const { reviews } = await productService.listProductReviews(
          String(product.id),
          { limit: 100, offset: 0 }
        );
        setReviews(reviews);
      } catch (e: any) {
        if (!mounted) return;
        console.error("Error loading product detail:", e);
        setProduct(null);
        setProductImages([]);
        setReviews([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const renderStars = (rating: number, size: number = 20) => {
    const r = Math.max(0, Math.min(5, rating));
    return (
      <div style={{ display: "flex", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= r ? theme.colors.accent.main : "none"}
            color={
              star <= r ? theme.colors.accent.main : theme.colors.text.light
            }
          />
        ))}
      </div>
    );
  };

  const distribution = useMemo(() => {
    const dist: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const r of reviews) {
      const key = (Number(r.rating) as 1 | 2 | 3 | 4 | 5) || 5;
      dist[key] = (dist[key] ?? 0) + 1;
    }
    return dist;
  }, [reviews]);

  const reviewCount = useMemo(() => reviews.length, [reviews]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product?.id) return;

    setSubmitting(true);
    setMessage("");

    try {
      await productService.createProductReview(String(product.id), {
        customer_name: reviewForm.customer_name.trim(),
        customer_email: reviewForm.customer_email.trim(),
        rating: Number(reviewForm.rating),
        title: reviewForm.title.trim() || null,
        comment: reviewForm.comment.trim() || null,
      });

      // reload reviews from API
      const { reviews } = await productService.listProductReviews(
        String(product.id),
        { limit: 100, offset: 0 }
      );
      setReviews(reviews);

      setMessage("Merci ! Votre avis a été publié ✅");
      setReviewForm({
        customer_name: "",
        customer_email: "",
        rating: 5,
        title: "",
        comment: "",
      });
      setShowReviewForm(false);
    } catch (err: any) {
      setMessage(
        err?.message || "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div
          style={{
            padding: theme.spacing["4xl"],
            textAlign: "center",
            fontFamily: theme.typography.fontFamily.body,
            color: theme.colors.text.secondary,
            backgroundColor: theme.colors.background.primary,
          }}
        >
          Chargement...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <div
          style={{
            padding: theme.spacing["4xl"],
            textAlign: "center",
            backgroundColor: theme.colors.background.primary,
          }}
        >
          <h2 style={{ ...theme.heading.h2, marginBottom: theme.spacing.lg }}>
            Produit non trouvé
          </h2>
          <Button variant="primary" onClick={() => navigate("/shop")}>
            Retour à la boutique
          </Button>
        </div>
      </div>
    );
  }

  const mainCategory =
    Array.isArray(product.categories) && product.categories.length
      ? product.categories[0]
      : undefined;

  const galleryImages: ProductImage[] =
    productImages.length > 0
      ? productImages
      : product.image_url
      ? [
          {
            id: "fallback",
            product_id: String(product.id),
            image_url: product.image_url,
            alt_text: product.name,
            display_order: 0,
            is_primary: true,
            created_at: product.created_at,
          },
        ]
      : [];

  const productInfoSections: ProductInfoSection[] = [
    {
      id: "suitability",
      title: "Est-ce fait pour vous ?",
      content: product.suitability || "",
      Icon: Check,
    },
    {
      id: "formula_benefits",
      title: "Ce que cette formule peut vous apporter",
      content:
        product.formula_benefits ||
        (Array.isArray(product.benefits) ? product.benefits.join("\n") : ""),
      Icon: PlusCircle,
    },
    {
      id: "cure_duration",
      title: "Durée de la cure",
      content: product.cure_duration || "",
      Icon: CalendarDays,
    },
    {
      id: "usage_advice",
      title: "Conseils d'utilisation",
      content: product.usage_advice || product.usage || "",
      Icon: HelpCircle,
    },
    {
      id: "composition",
      title: "Composition",
      content: product.composition || product.ingredients || "",
      Icon: Leaf,
    },
    {
      id: "precautions",
      title: "Précautions d'emploi",
      content: product.precautions || "",
      Icon: AlertTriangle,
    },
  ].filter((section) => section.content.trim().length > 0);

  return (
    <div>
      <Helmet>
        <title>{`${product.name} | ${SITE_NAME}`}</title>
        <meta
          name="description"
          content={
            product.short_description ||
            product.description ||
            `Découvrez ${product.name}, un produit H&H pour accompagner naturellement votre équilibre.`
          }
        />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <link rel="canonical" href={`${SITE_URL}/products/${product.slug}`} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${product.name} | ${SITE_NAME}`} />
        <meta
          property="og:description"
          content={
            product.short_description ||
            product.description ||
            `Découvrez ${product.name} sur Hormones & Harmonie.`
          }
        />
        <meta property="og:url" content={`${SITE_URL}/products/${product.slug}`} />
        {product.image_url ? <meta property="og:image" content={product.image_url} /> : null}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.short_description || product.description || product.name,
            image: product.image_url ? [product.image_url] : undefined,
            brand: {
              "@type": "Brand",
              name: SITE_NAME,
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "EUR",
              price: Number(product.price).toFixed(2),
              availability:
                product.stock_status === "out_of_stock"
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock",
              url: `${SITE_URL}/products/${product.slug}`,
            },
            aggregateRating:
              reviewCount > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: averageRating.toFixed(1),
                    reviewCount,
                  }
                : undefined,
          })}
        </script>
      </Helmet>
      <section
        style={{
          backgroundColor: theme.colors.background.primary,
          padding: `${theme.spacing["2xl"]} ${theme.spacing.lg}`,
        }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <button
            onClick={() => navigate("/shop")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing.sm,
              border: "none",
              background: "none",
              cursor: "pointer",
              fontFamily: theme.typography.fontFamily.body,
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.primary.main,
              marginBottom: theme.spacing.xl,
            }}
          >
            <ArrowLeft size={20} />
            Retour à la boutique
          </button>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: theme.spacing["3xl"],
              marginBottom: theme.spacing["4xl"],
            }}
          >
            <div>
              <ProductImageGallery
                images={galleryImages}
                productName={product.name}
                isNew={!!product.is_new}
              />
            </div>

            <div>
              {mainCategory && (
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: theme.colors.primary[100],
                    color: theme.colors.primary[700],
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: theme.typography.fontWeight.medium,
                    fontFamily: theme.typography.fontFamily.body,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  {mainCategory.name}
                </span>
              )}

              <h1
                style={{
                  ...theme.heading.h1,
                  fontSize: theme.typography.fontSize["4xl"],
                  marginBottom: theme.spacing.md,
                }}
              >
                {product.name}
              </h1>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.lg,
                }}
              >
                {renderStars(Math.round(averageRating), 24)}
                <span
                  style={{
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.base,
                    color: theme.colors.text.secondary,
                  }}
                >
                  {averageRating ? averageRating.toFixed(1) : "0.0"} (
                  {reviewCount} avis)
                </span>
              </div>

              <div style={{ marginBottom: theme.spacing.xl }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing.sm,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.typography.fontFamily.body,
                      fontSize: theme.typography.fontSize["3xl"],
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.text.primary,
                    }}
                  >
                    {Number(product.price).toFixed(2)} €
                  </span>

                  {product.compare_at_price != null &&
                    Number(product.compare_at_price) >
                      Number(product.price) && (
                      <span
                        style={{
                          fontFamily: theme.typography.fontFamily.body,
                          fontSize: theme.typography.fontSize.lg,
                          color: theme.colors.text.light,
                          textDecoration: "line-through",
                        }}
                      >
                        {Number(product.compare_at_price).toFixed(2)} €
                      </span>
                    )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: theme.spacing.sm,
                  }}
                >
                  {product.stock_status === "in_stock" && (
                    <>
                      <Check size={16} color={theme.colors.status.success} />
                      <span
                        style={{
                          fontFamily: theme.typography.fontFamily.body,
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.status.success,
                          fontWeight: theme.typography.fontWeight.medium,
                        }}
                      >
                        En stock
                      </span>
                    </>
                  )}
                  {product.stock_status === "limited" && (
                    <span
                      style={{
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.status.warning,
                        fontWeight: theme.typography.fontWeight.medium,
                      }}
                    >
                      Stock limité
                    </span>
                  )}
                  {product.stock_status === "out_of_stock" && (
                    <span
                      style={{
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.status.error,
                        fontWeight: theme.typography.fontWeight.medium,
                      }}
                    >
                      Rupture de stock
                    </span>
                  )}
                </div>
              </div>

              {product.description && (
                <p
                  style={{
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.lg,
                    color: theme.colors.text.secondary,
                    lineHeight: theme.typography.lineHeight.body,
                    marginBottom: theme.spacing.xl,
                    whiteSpace: "pre-line", // ✅ garde les \n
                  }}
                >
                  {product.description}
                </p>
              )}

              <button
                disabled={product.stock_status === "out_of_stock"}
                style={{ ...theme.button.primary, display: "flex" }}
                onClick={() => {
                  addToCart(product as any);
                  setAddedToCart(true);
                  setTimeout(() => setAddedToCart(false), 2000);
                }}
              >
                {addedToCart ? (
                  <>
                    <Check
                      size={20}
                      style={{ marginRight: theme.spacing.sm }}
                    />
                    Ajouté au panier !
                  </>
                ) : (
                  <>
                    <ShoppingCart
                      size={20}
                      style={{ marginRight: theme.spacing.sm }}
                    />
                    Ajouter au panier
                  </>
                )}
              </button>

              {Array.isArray(product.benefits) &&
                product.benefits.length > 0 && (
                  <div style={{ marginTop: theme.spacing.xl }}>
                    <h3
                      style={{
                        ...theme.heading.h4,
                        marginBottom: theme.spacing.md,
                      }}
                    >
                      Bénéfices
                    </h3>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {product.benefits.map((benefit, index) => (
                        <li
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: theme.spacing.sm,
                            marginBottom: theme.spacing.sm,
                            fontFamily: theme.typography.fontFamily.body,
                            fontSize: theme.typography.fontSize.base,
                            color: theme.colors.text.secondary,
                          }}
                        >
                          <Check
                            size={20}
                            color={theme.colors.status.success}
                            style={{ flexShrink: 0, marginTop: 2 }}
                          />
                          {String(benefit)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {productInfoSections.length > 0 && (
                <div
                  style={{
                    marginTop: theme.spacing.xl,
                    borderTop: `1px solid ${theme.colors.border.light}`,
                  }}
                >
                  {productInfoSections.map(({ id, title, Icon, ...section }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setActiveProductInfo({ id, title, Icon, content: section.content })
                      }
                      style={{
                        width: "100%",
                        minHeight: 58,
                        display: "flex",
                        alignItems: "center",
                        gap: theme.spacing.md,
                        border: "none",
                        borderBottom: `1px solid ${theme.colors.border.light}`,
                        background: "transparent",
                        cursor: "pointer",
                        padding: `${theme.spacing.md} 0`,
                        textAlign: "left",
                        color: theme.colors.text.primary,
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.base,
                      }}
                    >
                      <Icon
                        size={24}
                        color={theme.colors.primary.main}
                        style={{ flexShrink: 0 }}
                      />
                      <span style={{ flex: 1 }}>{title}</span>
                      <ChevronRight
                        size={20}
                        color={theme.colors.text.light}
                        style={{ flexShrink: 0 }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* REVIEWS */}
          <div id="reviews">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: theme.spacing.xl,
                flexWrap: "wrap",
                gap: theme.spacing.md,
              }}
            >
              <h2 style={{ ...theme.heading.h2 }}>Avis clients</h2>
              <Button
                variant="primary"
                onClick={() => setShowReviewForm((v) => !v)}
              >
                {showReviewForm ? "Annuler" : "Écrire un avis"}
              </Button>
            </div>

            {showReviewForm && (
              <div
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  padding: theme.spacing.xl,
                  borderRadius: theme.borderRadius.lg,
                  border: `1px solid ${theme.colors.border.light}`,
                  marginBottom: theme.spacing.xl,
                }}
              >
                <h3
                  style={{
                    ...theme.heading.h4,
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  Partagez votre avis
                </h3>

                <form onSubmit={handleSubmitReview}>
                  <div style={{ marginBottom: theme.spacing.lg }}>
                    <label
                      style={{
                        display: "block",
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.sm,
                      }}
                    >
                      Note
                    </label>
                    <div style={{ display: "flex", gap: theme.spacing.xs }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setReviewForm((p) => ({ ...p, rating: s }))
                          }
                          style={{
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <Star
                            size={32}
                            fill={
                              s <= reviewForm.rating
                                ? theme.colors.accent.main
                                : "none"
                            }
                            color={
                              s <= reviewForm.rating
                                ? theme.colors.accent.main
                                : theme.colors.text.light
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {[
                    {
                      id: "review-name",
                      label: "Nom",
                      type: "text",
                      key: "customer_name" as const,
                    },
                    {
                      id: "review-email",
                      label: "Email",
                      type: "email",
                      key: "customer_email" as const,
                    },
                    {
                      id: "review-title",
                      label: "Titre de l'avis",
                      type: "text",
                      key: "title" as const,
                    },
                  ].map((f) => (
                    <div key={f.id} style={{ marginBottom: theme.spacing.lg }}>
                      <label
                        htmlFor={f.id}
                        style={{
                          display: "block",
                          fontFamily: theme.typography.fontFamily.body,
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          color: theme.colors.text.primary,
                          marginBottom: theme.spacing.sm,
                        }}
                      >
                        {f.label}
                      </label>
                      <input
                        id={f.id}
                        type={f.type}
                        required
                        value={reviewForm[f.key] as any}
                        onChange={(e) =>
                          setReviewForm((p) => ({
                            ...p,
                            [f.key]: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          padding: theme.spacing.md,
                          borderRadius: theme.borderRadius.md,
                          border: `2px solid ${theme.colors.border.main}`,
                          fontFamily: theme.typography.fontFamily.body,
                          fontSize: theme.typography.fontSize.base,
                          outline: "none",
                        }}
                      />
                    </div>
                  ))}

                  <div style={{ marginBottom: theme.spacing.lg }}>
                    <label
                      htmlFor="review-comment"
                      style={{
                        display: "block",
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.text.primary,
                        marginBottom: theme.spacing.sm,
                      }}
                    >
                      Votre avis
                    </label>
                    <textarea
                      id="review-comment"
                      required
                      rows={5}
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm((p) => ({
                          ...p,
                          comment: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: theme.spacing.md,
                        borderRadius: theme.borderRadius.md,
                        border: `2px solid ${theme.colors.border.main}`,
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.base,
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? "Envoi en cours..." : "Publier l'avis"}
                  </Button>

                  {message && (
                    <p
                      style={{
                        marginTop: theme.spacing.md,
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.sm,
                        color: message.toLowerCase().includes("erreur")
                          ? theme.colors.status.error
                          : theme.colors.status.success,
                      }}
                    >
                      {message}
                    </p>
                  )}
                </form>
              </div>
            )}

            {reviews.length > 0 ? (
              <>
                <div
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    padding: theme.spacing.xl,
                    borderRadius: theme.borderRadius.lg,
                    border: `1px solid ${theme.colors.border.light}`,
                    marginBottom: theme.spacing.xl,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: theme.spacing.xl,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "3rem",
                          fontWeight: theme.typography.fontWeight.bold,
                          fontFamily: theme.typography.fontFamily.body,
                          color: theme.colors.text.primary,
                          marginBottom: theme.spacing.xs,
                        }}
                      >
                        {averageRating ? averageRating.toFixed(1) : "0.0"}
                      </div>
                      {renderStars(Math.round(averageRating), 24)}
                      <div
                        style={{
                          fontFamily: theme.typography.fontFamily.body,
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.text.secondary,
                          marginTop: theme.spacing.xs,
                        }}
                      >
                        {reviewCount} avis
                      </div>
                    </div>

                    <div>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div
                          key={rating}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "auto 1fr auto",
                            gap: theme.spacing.sm,
                            alignItems: "center",
                            marginBottom: theme.spacing.xs,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: theme.typography.fontFamily.body,
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.text.secondary,
                            }}
                          >
                            {rating} ★
                          </span>

                          <div
                            style={{
                              height: 8,
                              backgroundColor: theme.colors.border.light,
                              borderRadius: theme.borderRadius.full,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${
                                  reviews.length
                                    ? (distribution[
                                        rating as 1 | 2 | 3 | 4 | 5
                                      ] /
                                        reviews.length) *
                                      100
                                    : 0
                                }%`,
                                backgroundColor: theme.colors.accent.main,
                              }}
                            />
                          </div>

                          <span
                            style={{
                              fontFamily: theme.typography.fontFamily.body,
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.text.secondary,
                              minWidth: 30,
                              textAlign: "right",
                            }}
                          >
                            {distribution[rating as 1 | 2 | 3 | 4 | 5]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.spacing.lg,
                  }}
                >
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      style={{
                        backgroundColor: theme.colors.background.secondary,
                        padding: theme.spacing.xl,
                        borderRadius: theme.borderRadius.lg,
                        border: `1px solid ${theme.colors.border.light}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: theme.spacing.md,
                          flexWrap: "wrap",
                          gap: theme.spacing.md,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: theme.spacing.sm,
                              marginBottom: theme.spacing.xs,
                            }}
                          >
                            {renderStars(Number(review.rating), 18)}
                            {!!review.is_verified_purchase && (
                              <span
                                style={{
                                  backgroundColor: theme.colors.status.success,
                                  color: theme.colors.text.inverse,
                                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                                  borderRadius: theme.borderRadius.md,
                                  fontSize: theme.typography.fontSize.xs,
                                  fontWeight:
                                    theme.typography.fontWeight.medium,
                                  fontFamily: theme.typography.fontFamily.body,
                                }}
                              >
                                Achat vérifié
                              </span>
                            )}
                          </div>

                          <h4
                            style={{
                              ...theme.heading.h5,
                              fontSize: theme.typography.fontSize.lg,
                              marginBottom: theme.spacing.xs,
                            }}
                          >
                            {review.title || "Avis client"}
                          </h4>

                          <p
                            style={{
                              fontFamily: theme.typography.fontFamily.body,
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.text.light,
                              margin: 0,
                            }}
                          >
                            Par {review.customer_name} le{" "}
                            {new Date(review.created_at).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      {review.comment && (
                        <p
                          style={{
                            fontFamily: theme.typography.fontFamily.body,
                            fontSize: theme.typography.fontSize.base,
                            color: theme.colors.text.secondary,
                            lineHeight: theme.typography.lineHeight.body,
                            marginBottom: theme.spacing.md,
                          }}
                        >
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  padding: theme.spacing["3xl"],
                  borderRadius: theme.borderRadius.lg,
                  border: `1px solid ${theme.colors.border.light}`,
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.lg,
                    color: theme.colors.text.secondary,
                    margin: 0,
                  }}
                >
                  Aucun avis pour le moment. Soyez le premier à laisser votre
                  avis !
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {activeProductInfo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeProductInfo.title}
          onClick={() => setActiveProductInfo(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(100%, 460px)",
              height: "100%",
              backgroundColor: theme.colors.background.primary,
              boxShadow: "-16px 0 40px rgba(0, 0, 0, 0.18)",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                minHeight: 72,
                display: "flex",
                alignItems: "center",
                borderBottom: `1px solid ${theme.colors.border.light}`,
                padding: `0 ${theme.spacing.xl}`,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveProductInfo(null)}
                aria-label="Fermer"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: `1px solid ${theme.colors.text.primary}`,
                  background: "transparent",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.colors.text.primary,
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: theme.spacing.xl }}>
              <h2
                style={{
                  ...theme.heading.h2,
                  fontSize: theme.typography.fontSize["2xl"],
                  marginBottom: theme.spacing.md,
                }}
              >
                {activeProductInfo.title}
              </h2>
              <div
                style={{
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.base,
                  lineHeight: 1.55,
                  color: theme.colors.text.primary,
                  whiteSpace: "pre-line",
                }}
              >
                {activeProductInfo.content}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
