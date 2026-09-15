// client/src/pages/BlogPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Clock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { blogService, type BlogPost, type BlogCategory } from "../services/blogService";
import { PageBanner } from "../components/PageBanner";

export function BlogPage() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    void fetchCategories();
  }, []);

  useEffect(() => {
    void fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategorySlug]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { categories } = await blogService.listCategories();
      setCategories(categories || []);
    } catch (e) {
      console.error("Error fetching blog categories:", e);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const { posts } = await blogService.listPosts({
        category: selectedCategorySlug !== "all" ? selectedCategorySlug : undefined,
        limit: 60,
        offset: 0,
      });
      setPosts(posts || []);
      // console.log("Fetched posts:", posts);
    } catch (e) {
      console.error("Error fetching blog posts:", e);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const sortedCategories = useMemo(() => {
    const sorted = [...categories].sort((a, b) => {
      const ao = a.display_order ?? 0;
      const bo = b.display_order ?? 0;
      if (ao !== bo) return ao - bo;
      return (a.name || "").localeCompare(b.name || "");
    });
    return sorted;
  }, [categories]);

  // const filteredPosts = useMemo(() => {
  //   if (selectedCategorySlug === "all") return posts;

  //   // si backend filtre déjà c’est OK, sinon on filtre côté client
  //   return posts.filter((p) =>
  //     (p.categories || []).some((c) => c.slug === selectedCategorySlug)
  //   );
  // }, [posts, selectedCategorySlug]);

  const filteredPosts = useMemo(() => {
    // Le backend renvoie déjà les posts filtrés selon la catégorie demandée.
    // On retourne simplement les posts reçus.
    return posts;
  }, [posts]);

  const goToPost = (post: BlogPost) => {
    // route detail: /blog/:slug
    navigate(`/blog/${post.slug}`);
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
          {/* Categories */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: theme.spacing.md,
              justifyContent: "center",
              marginBottom: theme.spacing["2xl"],
            }}
          >
            <Button
              variant={selectedCategorySlug === "all" ? "primary" : "outline"}
              onClick={() => setSelectedCategorySlug("all")}
            >
              Tous les articles
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
              sortedCategories.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedCategorySlug === c.slug ? "primary" : "outline"}
                  onClick={() => setSelectedCategorySlug(c.slug)}
                >
                  {c.name}
                </Button>
              ))
            )}
          </div>

          {/* Posts */}
          {loadingPosts ? (
            <div
              style={{
                textAlign: "center",
                padding: theme.spacing["4xl"],
                color: theme.colors.text.secondary,
                fontFamily: theme.typography.fontFamily.body,
              }}
            >
              Chargement des articles...
            </div>
          ) : filteredPosts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: theme.spacing.xl,
              }}
            >
              {filteredPosts.map((post) => {
                const primaryCategory = (post.categories || [])[0];

                return (
                  <article
                    key={post.id}
                    onClick={() => goToPost(post)}
                    style={{
                      backgroundColor: theme.colors.background.secondary,
                      borderRadius: theme.borderRadius.lg,
                      overflow: "hidden",
                      boxShadow: theme.shadow.card,
                      transition: theme.transition.normal,
                      cursor: "pointer",
                      border: `1px solid ${theme.colors.border.light}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = theme.shadow.hover;
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = theme.shadow.card;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "240px",
                        backgroundColor: theme.colors.background.sage,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {primaryCategory?.name && (
                        <span
                          style={{
                            position: "absolute",
                            top: theme.spacing.md,
                            left: theme.spacing.md,
                            backgroundColor: theme.colors.primary.main,
                            color: theme.colors.text.inverse,
                            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                            borderRadius: theme.borderRadius.md,
                            fontSize: theme.typography.fontSize.xs,
                            fontWeight: theme.typography.fontWeight.medium,
                            fontFamily: theme.typography.fontFamily.body,
                            zIndex: 2,
                          }}
                        >
                          {primaryCategory.name}
                        </span>
                      )}

                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                            fontFamily: theme.typography.fontFamily.body,
                          }}
                        >
                          Aucun visuel
                        </div>
                      )}
                    </div>

                    <div style={{ padding: theme.spacing.lg }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: theme.spacing.md,
                          marginBottom: theme.spacing.md,
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.text.light,
                          fontFamily: theme.typography.fontFamily.body,
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: theme.spacing.xs }}>
                          <Clock size={14} />
                          {post.reading_time ?? 5} min
                        </span>

                        <span style={{ display: "flex", alignItems: "center", gap: theme.spacing.xs }}>
                          <Eye size={14} />
                          {post.views ?? 0}
                        </span>

                        {post.published_at && (
                          <span>
                            {new Date(post.published_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      <h3
                        style={{
                          ...theme.heading.h4,
                          fontSize: theme.typography.fontSize.xl,
                          marginBottom: theme.spacing.sm,
                        }}
                      >
                        {post.title}
                      </h3>

                      <p
                        style={{
                          fontFamily: theme.typography.fontFamily.body,
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.text.secondary,
                          lineHeight: theme.typography.lineHeight.body,
                          marginBottom: theme.spacing.md,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.excerpt || "Découvrez nos conseils pour une routine simple, naturelle et efficace."}
                      </p>

                      {/* ✅ bouton qui navigue aussi (et empêche l’event du parent si tu veux) */}
                      <Button
                        variant="outline"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPost(post);
                        }}
                      >
                        Lire l&apos;article
                      </Button>
                    </div>
                  </article>
                );
              })}
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
              Aucun article disponible dans cette catégorie.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
