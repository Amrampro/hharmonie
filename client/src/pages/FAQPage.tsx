// client/src/pages/FAQPage.tsx
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Search } from "lucide-react";
import { theme } from "../config/theme";
import { faqsService, type Faq } from "../services/faqsService";
import { PageBanner } from "../components/PageBanner";

export function FAQPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // optionnel: petit champ de recherche côté client
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    void fetchFAQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    setError("");
    try {
      const { faqs: data } = await faqsService.listFaqs({
        limit: 200,
        offset: 0,
      });

      // tri par display_order puis question
      const sorted = [...(data || [])].sort((a, b) => {
        const ao = a.display_order ?? 0;
        const bo = b.display_order ?? 0;
        if (ao !== bo) return ao - bo;
        return String(a.question || "").localeCompare(String(b.question || ""));
      });

      setFaqs(sorted);
      setOpenIndex(sorted.length > 0 ? 0 : null);
    } catch (e: any) {
      console.error("Error fetching FAQs:", e);
      setFaqs([]);
      setOpenIndex(null);
      setError(e?.message || "Erreur lors du chargement des questions.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();

    return faqs.filter((f) => {
      const inCategory =
        selectedCategory === "all"
          ? true
          : (f.category || "") === selectedCategory;

      if (!inCategory) return false;

      if (!q) return true;

      const hay = `${f.question || ""} ${f.answer || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [faqs, query, selectedCategory]);

  return (
    <div>
      <PageBanner />

      {/* CONTENT */}
      <section
        style={{
          backgroundColor: theme.colors.background.sage,
          padding: `${theme.spacing["4xl"]} ${theme.spacing.lg}`,
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          {/* Filter bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: theme.spacing.md,
              marginBottom: theme.spacing["2xl"],
            }}
          >
            <div
              style={{
                display: "flex",
                gap: theme.spacing.md,
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Cat buttons */}
              <div
                style={{
                  display: "flex",
                  gap: theme.spacing.sm,
                  flexWrap: "wrap",
                }}
              >

                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCategory(c)}
                    style={{
                      border: `1px solid ${
                        selectedCategory === c
                          ? theme.colors.primary.main
                          : theme.colors.border.light
                      }`,
                      backgroundColor:
                        selectedCategory === c
                          ? theme.colors.primary.main
                          : theme.colors.background.secondary,
                      color:
                        selectedCategory === c
                          ? theme.colors.text.inverse
                          : theme.colors.text.primary,
                      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                      borderRadius: theme.borderRadius.full,
                      cursor: "pointer",
                      fontFamily: theme.typography.fontFamily.body,
                      fontSize: theme.typography.fontSize.sm,
                      transition: theme.transition.fast,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div
                style={{
                  position: "relative",
                  minWidth: 260,
                  flex: "0 0 auto",
                }}
              >
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: theme.spacing.md,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: theme.colors.text.light,
                  }}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une question..."
                  style={{
                    width: "100%",
                    padding: `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 44px`,
                    border: `1px solid ${theme.colors.border.main}`,
                    borderRadius: theme.borderRadius.full,
                    fontSize: theme.typography.fontSize.base,
                    fontFamily: theme.typography.fontFamily.body,
                    outline: "none",
                    backgroundColor: theme.colors.background.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      theme.colors.primary.main;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      theme.colors.border.main;
                  }}
                />
              </div>
            </div>
          </div>

          {/* States */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: theme.spacing["4xl"],
                color: theme.colors.text.secondary,
                fontFamily: theme.typography.fontFamily.body,
              }}
            >
              Chargement des questions...
            </div>
          ) : error ? (
            <div
              style={{
                backgroundColor: theme.colors.error[50],
                border: `1px solid ${theme.colors.error.main}`,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                fontFamily: theme.typography.fontFamily.body,
                color: theme.colors.error.main,
                marginBottom: theme.spacing.lg,
              }}
            >
              {error}
              <div style={{ marginTop: theme.spacing.md }}>
                <button
                  type="button"
                  onClick={fetchFAQs}
                  style={{
                    border: "none",
                    backgroundColor: theme.colors.primary.main,
                    color: theme.colors.text.inverse,
                    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                    borderRadius: theme.borderRadius.full,
                    cursor: "pointer",
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : filteredFaqs.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing.md,
              }}
            >
              {filteredFaqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    key={faq.id}
                    style={{
                      backgroundColor: theme.colors.primary[100],
                      borderRadius: theme.borderRadius.lg,
                      overflow: "hidden",
                      border: `2px solid ${
                        isOpen
                          ? theme.colors.primary.main
                          : theme.colors.border.light
                      }`,
                      transition: theme.transition.normal,
                    }}
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      style={{
                        width: "100%",
                        padding: theme.spacing.lg,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: theme.spacing.md,
                        border: "none",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          ...theme.heading.h5,
                          fontSize: theme.typography.fontSize.base,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.text.primary,
                        }}
                      >
                        {faq.question || "Question"}
                      </span>

                      {isOpen ? (
                        <ChevronUp
                          size={24}
                          color={theme.colors.primary.main}
                          style={{ flexShrink: 0 }}
                        />
                      ) : (
                        <ChevronDown
                          size={24}
                          color={theme.colors.text.secondary}
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </button>

                    {isOpen && (
                      <div
                        style={{
                          padding: `0 ${theme.spacing.lg} ${theme.spacing.lg}`,
                          fontFamily: theme.typography.fontFamily.body,
                          fontSize: theme.typography.fontSize.base,
                          color: theme.colors.text.secondary,
                          lineHeight: theme.typography.lineHeight.body,
                          borderTop: `1px solid ${theme.colors.border.light}`,
                          paddingTop: theme.spacing.lg,
                          whiteSpace: "pre-line", // ✅ garde les \n
                        }}
                      >
                        {faq.answer || "Réponse à venir."}
                      </div>
                    )}
                  </div>
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
                backgroundColor: theme.colors.background.secondary,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.border.light}`,
              }}
            >
              Aucune question ne correspond à votre recherche.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
