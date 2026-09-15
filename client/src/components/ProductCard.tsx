import { useState } from "react";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Product } from "../lib/types";
import { Button } from "./Button";
import { theme } from "../config/theme";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const formattedPrice = Number(product.price).toFixed(2);
  const hasDiscount =
    product.compare_at_price &&
    Number(product.compare_at_price) > Number(product.price);

  const renderStars = (rating: number) => (
    <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          fill={star <= Math.round(rating) ? theme.colors.accent.main : "none"}
          color={
            star <= Math.round(rating)
              ? theme.colors.accent.main
              : theme.colors.text.light
          }
        />
      ))}
    </div>
  );

  return (
    <div
      onClick={() => navigate(`/products/${product.slug}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.borderRadius.lg,
        overflow: "hidden",
        // Utilisation de l'état pour l'animation d'ombre et de levée
        boxShadow: isHovered ? theme.shadow.hover : theme.shadow.card,
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${theme.colors.border?.light || "#e5e7eb"}`, // Ajout d'une bordure subtile
      }}
    >
      {/* --- ZONE IMAGE (RATIO 1:1) --- */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1", // Force le carré parfait
          backgroundColor: theme.colors.background.secondary,
          position: "relative",
          overflow: "hidden", // Important pour l'effet de zoom
        }}
      >
        {/* Badge Nouveau */}
        {product.is_new && (
          <span
            style={{
              position: "absolute",
              top: theme.spacing.md,
              left: theme.spacing.md,
              backgroundColor: theme.colors.primary.main,
              color: theme.colors.text.inverse,
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              borderRadius: theme.borderRadius.full, // Plus rond = plus moderne
              fontSize: theme.typography.fontSize.xs,
              fontWeight: 600,
              zIndex: 10,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            Nouveau
          </span>
        )}

        {/* Image avec Zoom au survol */}
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover", // Coupe l'image proprement
              objectPosition: "center",
              transition: "transform 0.5s ease", // Animation douce
              transform: isHovered ? "scale(1.05)" : "scale(1)", // Effet Zoom
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

      {/* --- CONTENU --- */}
      <div
        style={{
          padding: theme.spacing.lg,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Catégorie */}
        {product.categories?.length > 0 && (
          <span
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.xs,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: theme.spacing.xs,
              fontWeight: 600,
            }}
          >
            {product.categories[0].name}
          </span>
        )}

        {/* Titre */}
        <h3
          style={{
            ...theme.heading.h5,
            fontSize: theme.typography.fontSize.md,
            marginBottom: theme.spacing.xs,
            lineHeight: 1.4,
          }}
        >
          {product.name}
        </h3>

        {/* Notes (Étoiles) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacing.xs,
            marginBottom: theme.spacing.md,
          }}
        >
          {/* {product.review_count > 0 ? (
            <> */}
              {renderStars(product.average_rating)}
              <span
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.light,
                }}
              >
                ({product.review_count})
              </span>
            {/* </>
          ) : ( */}
             {/* // Espace vide pour aligner les cartes même sans avis
             <div style={{ height: 16 }}></div> */}
          {/* )} */}
        </div>

        {/* Description courte (limitée) */}
        {product.short_description && (
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.lg,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.5,
            }}
          >
            {product.short_description}
          </p>
        )}

        {/* Prix et Bouton (poussés vers le bas) */}
        <div style={{ marginTop: "auto" }}>
          <div style={{ marginBottom: theme.spacing.md, display: "flex", alignItems: "baseline", gap: theme.spacing.sm }}>
            <span
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              {formattedPrice} €
            </span>
            {hasDiscount && (
              <span
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  textDecoration: "line-through",
                  color: theme.colors.text.light,
                }}
              >
                {Number(product.compare_at_price).toFixed(2)} €
              </span>
            )}
          </div>

          <Button
            variant="primary"
            fullWidth
            disabled={product.stock_status === "out_of_stock"}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
          >
            {product.stock_status === "out_of_stock" ? "Rupture" : "Ajouter au panier"}
          </Button>
        </div>
      </div>
    </div>
  );
}