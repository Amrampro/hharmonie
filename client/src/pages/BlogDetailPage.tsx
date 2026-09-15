import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Clock, Calendar, Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { blogService, BlogPost } from "../services/blogService";
import DOMPurify from "dompurify";
import { SITE_NAME, SITE_URL } from "../components/Seo";

interface BlogDetailPageProps {
  slug: string;
}

export function BlogDetailPage({ slug }: BlogDetailPageProps) {
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchBlogPost = async () => {
    setLoading(true);
    try {
      const { post: data } = await blogService.getPostBySlug(slug);
      setPost(data || null);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const primaryCategory = useMemo(() => {
    if (!post?.categories?.length) return null;
    // Si tu as display_order côté categories, tu peux trier,
    // sinon on prend la première.
    return post.categories[0];
  }, [post]);

  // const renderContent = (content: string) => {
  //   const lines = content.split("\n");
  //   return lines.map((line, index) => {
  //     if (line.startsWith("# ")) {
  //       return (
  //         <h2
  //           key={index}
  //           style={{
  //             ...theme.heading.h2,
  //             marginTop: theme.spacing["2xl"],
  //             marginBottom: theme.spacing.xl,
  //           }}
  //         >
  //           {line.substring(2)}
  //         </h2>
  //       );
  //     }
  //     if (line.startsWith("## ")) {
  //       return (
  //         <h3
  //           key={index}
  //           style={{
  //             ...theme.heading.h3,
  //             marginTop: theme.spacing.xl,
  //             marginBottom: theme.spacing.md,
  //           }}
  //         >
  //           {line.substring(3)}
  //         </h3>
  //       );
  //     }
  //     if (line.startsWith("### ")) {
  //       return (
  //         <h4
  //           key={index}
  //           style={{
  //             ...theme.heading.h4,
  //             marginTop: theme.spacing.lg,
  //             marginBottom: theme.spacing.sm,
  //           }}
  //         >
  //           {line.substring(4)}
  //         </h4>
  //       );
  //     }
  //     if (line.startsWith("#### ")) {
  //       return (
  //         <h5
  //           key={index}
  //           style={{
  //             fontSize: theme.typography.fontSize.lg,
  //             fontWeight: theme.typography.fontWeight.semibold,
  //             color: theme.colors.text.primary,
  //             marginTop: theme.spacing.md,
  //             marginBottom: theme.spacing.sm,
  //             fontFamily: theme.typography.fontFamily.heading,
  //           }}
  //         >
  //           {line.substring(5)}
  //         </h5>
  //       );
  //     }
  //     if (line.startsWith("**") && line.endsWith("**")) {
  //       return (
  //         <p
  //           key={index}
  //           style={{
  //             ...theme.body.large,
  //             fontWeight: theme.typography.fontWeight.semibold,
  //             marginTop: theme.spacing.md,
  //             marginBottom: theme.spacing.sm,
  //           }}
  //         >
  //           {line.substring(2, line.length - 2)}
  //         </p>
  //       );
  //     }
  //     if (line.startsWith("- ") || line.startsWith("* ")) {
  //       return (
  //         <li
  //           key={index}
  //           style={{
  //             ...theme.body.base,
  //             marginLeft: theme.spacing.xl,
  //             marginBottom: theme.spacing.xs,
  //           }}
  //         >
  //           {line.substring(2)}
  //         </li>
  //       );
  //     }
  //     if (line.match(/^\d+\.\s/)) {
  //       return (
  //         <li
  //           key={index}
  //           style={{
  //             ...theme.body.base,
  //             marginLeft: theme.spacing.xl,
  //             marginBottom: theme.spacing.xs,
  //             listStyleType: "decimal",
  //           }}
  //         >
  //           {line.replace(/^\d+\.\s/, "")}
  //         </li>
  //       );
  //     }
  //     if (line.trim() === "") {
  //       return <div key={index} style={{ height: theme.spacing.md }} />;
  //     }
  //     return (
  //       <p
  //         key={index}
  //         style={{
  //           ...theme.body.base,
  //           marginBottom: theme.spacing.md,
  //         }}
  //       >
  //         {line}
  //       </p>
  //     );
  //   });
  // };

  const safeHtml = useMemo(() => {
    return DOMPurify.sanitize(post?.content || "", {
      USE_PROFILES: { html: true }, // profil safe
    });
  }, [post?.content]);

  const plainExcerpt = String(post?.excerpt || "")
    .replace(/<[^>]+>/g, "")
    .trim();

  // ✅ LOADING
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: theme.colors.background.primary,
        }}
      >
        <div
          style={{
            minHeight: "70vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: theme.typography.fontFamily.body,
            color: theme.colors.text.secondary,
          }}
        >
          Chargement...
        </div>
      </div>
    );
  }

  // ✅ NOT FOUND
  if (!post) {
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
            <h1 style={{ ...theme.heading.h1, marginBottom: theme.spacing.sm }}>
              Blog
            </h1>
            <p
              style={{
                ...theme.body.large,
                color: theme.colors.text.secondary,
              }}
            >
              L’article demandé n’existe pas ou a été supprimé.
            </p>
          </div>
        </section>

        <section
          style={{
            backgroundColor: theme.colors.background.primary,
            padding: `${theme.spacing["3xl"]} ${theme.spacing.lg}`,
            minHeight: "55vh",
          }}
        >
          <div
            style={{
              maxWidth: theme.container.maxWidth,
              margin: "0 auto",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 720,
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing["2xl"],
                border: `1px solid ${theme.colors.border.light}`,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  ...theme.body.large,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xl,
                }}
              >
                Article non trouvé
              </p>

              <Button variant="outline" onClick={() => navigate("/blog")}>
                <ArrowLeft
                  size={20}
                  style={{ marginRight: theme.spacing.sm }}
                />
                Retour au blog
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const publishedLabel = post.published_at
    ? formatDate(post.published_at)
    : "Non publié";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.colors.background.primary,
      }}
    >
      <Helmet>
        <title>{`${post.title} | ${SITE_NAME}`}</title>
        <meta
          name="description"
          content={
            plainExcerpt ||
            "Conseil H&H autour du cycle, des hormones, de la fertilité et du bien-être naturel."
          }
        />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <link rel="canonical" href={`${SITE_URL}/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${post.title} | ${SITE_NAME}`} />
        <meta
          property="og:description"
          content={
            plainExcerpt ||
            "Conseil H&H autour du cycle, des hormones et du bien-être naturel."
          }
        />
        <meta property="og:url" content={`${SITE_URL}/blog/${post.slug}`} />
        {post.image_url ? <meta property="og:image" content={post.image_url} /> : null}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: plainExcerpt || post.title,
            image: post.image_url ? [post.image_url] : undefined,
            datePublished: post.published_at || post.created_at,
            dateModified: post.updated_at || post.published_at || post.created_at,
            author: {
              "@type": "Organization",
              name: SITE_NAME,
            },
            publisher: {
              "@type": "Organization",
              name: SITE_NAME,
            },
            mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
          })}
        </script>
      </Helmet>
      {/* HERO */}
      <section
        style={{
          backgroundColor: theme.colors.background.sage,
          padding: `${theme.spacing["3xl"]} ${theme.spacing.lg}`,
          borderBottom: `1px solid ${theme.colors.border.light}`,
        }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <div style={{ marginBottom: theme.spacing.lg }}>
            <Button variant="outline" onClick={() => navigate("/blog")}>
              <ArrowLeft size={20} style={{ marginRight: theme.spacing.sm }} />
              Retour au blog
            </Button>
          </div>

          {/* category pill */}
          {primaryCategory && (
            <span
              style={{
                display: "inline-block",
                backgroundColor: theme.colors.primary[100],
                color: theme.colors.primary[700],
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                borderRadius: theme.borderRadius.full,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.body,
                marginBottom: theme.spacing.md,
              }}
            >
              {primaryCategory.name}
            </span>
          )}

          <h1 style={{ ...theme.heading.h1, marginBottom: theme.spacing.md }}>
            {post.title}
          </h1>

          {post.excerpt && (
            <p
              style={{
                ...theme.body.large,
                color: theme.colors.text.secondary,
                maxWidth: 900,
                marginBottom: theme.spacing.xl,
              }}
            >
              {post.excerpt}
            </p>
          )}

          {/* meta row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: theme.spacing.md,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: theme.colors.background.primary,
                borderRadius: theme.borderRadius.full,
                border: `1px solid ${theme.colors.border.light}`,
              }}
            >
              <Calendar size={16} color={theme.colors.text.light} />
              <span
                style={{
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                }}
              >
                {publishedLabel}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: theme.colors.background.primary,
                borderRadius: theme.borderRadius.full,
                border: `1px solid ${theme.colors.border.light}`,
              }}
            >
              <Clock size={16} color={theme.colors.text.light} />
              <span
                style={{
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                }}
              >
                {post.reading_time} min
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: theme.colors.background.primary,
                borderRadius: theme.borderRadius.full,
                border: `1px solid ${theme.colors.border.light}`,
              }}
            >
              <Folder size={16} color={theme.colors.text.light} />
              <span
                style={{
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                }}
              >
                {post.categories?.length
                  ? `${post.categories.length} catégorie(s)`
                  : "Sans catégorie"}
              </span>
            </div>
          </div>

          {/* categories chips */}
          {!!post.categories?.length && (
            <div
              style={{
                marginTop: theme.spacing.lg,
                display: "flex",
                flexWrap: "wrap",
                gap: theme.spacing.sm,
              }}
            >
              {post.categories.map((c) => (
                <span
                  key={c.id}
                  style={{
                    backgroundColor: theme.colors.background.primary,
                    color: theme.colors.text.secondary,
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                    borderRadius: theme.borderRadius.full,
                    fontSize: theme.typography.fontSize.xs,
                    border: `1px solid ${theme.colors.border.light}`,
                  }}
                >
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* IMAGE */}
      {post.image_url && (
        <section
          style={{
            backgroundColor: theme.colors.background.primary,
            padding: `${theme.spacing["2xl"]} ${theme.spacing.lg} 0`,
          }}
        >
          <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
            <div
              style={{
                width: "100%",
                height: 520,
                borderRadius: theme.borderRadius.lg,
                overflow: "hidden",
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadow.card,
                backgroundColor: theme.colors.background.secondary,
              }}
            >
              <img
                src={post.image_url}
                alt={post.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        </section>
      )}

      {/* CONTENT */}
      <section
        style={{
          backgroundColor: theme.colors.background.primary,
          padding: `${theme.spacing["2xl"]} ${theme.spacing.lg}`,
        }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <div
            style={{
              maxWidth: 860,
              margin: "0 auto",
              backgroundColor: theme.colors.background.primary,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing["2xl"],
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadow.card,
            }}
          >
            {/* <div
              style={{
                fontFamily: theme.typography.fontFamily.body,
                color: theme.colors.text.secondary,
                lineHeight: 1.9,
                fontSize: theme.typography.fontSize.base,
              }}
            >
              {renderContent(post.content)}
            </div> */}
            <div
              style={{
                fontFamily: theme.typography.fontFamily.body,
                color: theme.colors.text.secondary,
                lineHeight: 1.9,
                fontSize: theme.typography.fontSize.base,
              }}
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />

            {/* CTA */}
            <div
              style={{
                marginTop: theme.spacing["3xl"],
                paddingTop: theme.spacing.xl,
                borderTop: `1px solid ${theme.colors.border.light}`,
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing.md,
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  ...theme.body.base,
                  color: theme.colors.text.secondary,
                }}
              >
                Envie de découvrir plus de conseils ?
              </p>

              <Button variant="primary" onClick={() => navigate("/blog")}>
                Voir plus d&apos;articles
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
