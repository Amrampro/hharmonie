// client/src/pages/ShopPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { ProductCard } from "../components/ProductCard";
import type { Product, ProductCategory } from "../lib/types";
import { useCart } from "../contexts/CartContext";
import { productService } from "../services/productService";
import { PageBanner } from "../components/PageBanner";

interface ShopPageProps {
  onViewProduct?: (product: Product) => void;
}

export function ShopPage({ onViewProduct }: ShopPageProps) {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(
    searchParams.get("category") || "all"
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    void fetchCategories();
  }, []);

  useEffect(() => {
    void fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategorySlug]);

  useEffect(() => {
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search") || "";
    setSelectedCategorySlug(category);
    setSearchQuery(search);
  }, [searchParams]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { categories: data } = await productService.listCategories();
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const params = {
        category: selectedCategorySlug !== "all" ? selectedCategorySlug : undefined,
        limit: 200,
        offset: 0,
      };
      const { products: data } = await productService.listProducts(params);
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const shortDesc = (p.short_description || "").toLowerCase();
      const ing = (p.ingredients || "").toLowerCase();

      const catMatch =
        (p.categories || []).some((c) => (c.name || "").toLowerCase().includes(q)) ||
        (p.categories || []).some((c) => (c.slug || "").toLowerCase().includes(q));

      return (
        name.includes(q) ||
        desc.includes(q) ||
        shortDesc.includes(q) ||
        ing.includes(q) ||
        catMatch
      );
    });
  }, [products, searchQuery]);

  const categoryButtons = useMemo(() => {
    // sort by display_order then name
    const sorted = [...categories].sort((a, b) => {
      const ao = a.display_order ?? 0;
      const bo = b.display_order ?? 0;
      if (ao !== bo) return ao - bo;
      return (a.name || "").localeCompare(b.name || "");
    });
    return sorted;
  }, [categories]);

  const selectCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    const next = new URLSearchParams(searchParams);
    if (slug === "all") {
      next.delete("category");
    } else {
      next.set("category", slug);
    }
    setSearchParams(next);
  };

  const updateSearch = (value: string) => {
    setSearchQuery(value);
    const next = new URLSearchParams(searchParams);
    const trimmed = value.trim();
    if (trimmed) {
      next.set("search", trimmed);
    } else {
      next.delete("search");
    }
    setSearchParams(next);
  };

  return (
    <div>

      <PageBanner />

      {/* CONTENT */}
      <section
        style={{
          backgroundColor: theme.colors.background.primary,
          padding: `${theme.spacing["2xl"]} ${theme.spacing.lg}`,
        }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          {/* Filters */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing.xl,
              marginBottom: theme.spacing["2xl"],
            }}
          >
            {/* Categories */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: theme.spacing.md,
                justifyContent: "center",
              }}
            >
              <Button
                variant={selectedCategorySlug === "all" ? "primary" : "outline"}
                onClick={() => selectCategory("all")}
              >
                Tous les produits
              </Button>

              {loadingCategories ? (
                <span
                  style={{
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    alignSelf: "center",
                  }}
                >
                  Chargement des catégories...
                </span>
              ) : (
                categoryButtons.map((c) => (
                  <Button
                    key={c.id}
                    variant={selectedCategorySlug === c.slug ? "primary" : "outline"}
                    onClick={() => selectCategory(c.slug)}
                  >
                    {c.name}
                  </Button>
                ))
              )}
            </div>

            {/* Search */}
            <div style={{ maxWidth: "560px", margin: "0 auto", width: "100%", position: "relative" }}>
              <Search
                size={20}
                color={theme.colors.text.light}
                style={{
                  position: "absolute",
                  left: theme.spacing.md,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />

              {searchQuery && (
                <button
                  onClick={() => updateSearch("")}
                  aria-label="Effacer la recherche"
                  style={{
                    position: "absolute",
                    right: theme.spacing.md,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <X size={18} color={theme.colors.text.light} />
                </button>
              )}

              <input
                type="text"
                placeholder="Rechercher (nom, description, ingrédients, catégorie)..."
                value={searchQuery}
                onChange={(e) => updateSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: `${theme.spacing.md} ${theme.spacing["3xl"]} ${theme.spacing.md} 3rem`,
                  borderRadius: theme.borderRadius.lg,
                  border: `2px solid ${theme.colors.border.main}`,
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.base,
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.primary.main;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.main;
                }}
              />
            </div>

            {/* Result meta */}
            <div
              style={{
                textAlign: "center",
                fontFamily: theme.typography.fontFamily.body,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              {loadingProducts ? "Chargement..." : `${filteredProducts.length} produit(s)`}
              {selectedCategorySlug !== "all" && !loadingProducts ? " dans cette catégorie" : ""}
            </div>
          </div>

          {/* Grid */}
          {loadingProducts ? (
            <div
              style={{
                textAlign: "center",
                padding: theme.spacing["4xl"],
                color: theme.colors.text.secondary,
                fontFamily: theme.typography.fontFamily.body,
              }}
            >
              Chargement des produits...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: theme.spacing.xl,
              }}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={onViewProduct}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: theme.spacing["4xl"],
                color: theme.colors.text.secondary,
                fontFamily: theme.typography.fontFamily.body,
              }}
            >
              {searchQuery
                ? "Aucun produit ne correspond à votre recherche."
                : selectedCategorySlug !== "all"
                ? "Aucun produit disponible dans cette catégorie."
                : "Aucun produit à afficher pour le moment."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
