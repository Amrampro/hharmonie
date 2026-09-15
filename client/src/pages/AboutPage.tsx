// client/src/pages/AboutPage.tsx
import {
  Sparkles,
  Heart,
  Leaf,
  Globe,
} from "lucide-react";
import { theme } from "../config/theme";
import { PageBanner } from "../components/PageBanner";
import { useSiteParams } from "../contexts/SiteParamsContext";

export function AboutPage() {
  const features = [
    {
      icon: Leaf,
      title: "Écoute",
      description:
        "Comprendre les symptômes, le terrain et les besoins réels.",
    },
    {
      icon: Heart,
      title: "Naturelle",
      description: "Des solutions douces, globales et respectueuses du corps.",
    },
    {
      icon: Globe,
      title: "Personnalisée",
      description: "Chaque accompagnement s'adapte au profil et aux priorités.",
    },
    {
      icon: Sparkles,
      title: "Complète",
      description: "Produits, conseils et rendez-vous avancent ensemble.",
    },
  ];

  const siteState = useSiteParams() as any;
  const parameters =
    siteState?.parameters ?? siteState?.data ?? siteState?.siteParams ?? null;

  const story = String(parameters?.story || "").trim();
  const vision = String(parameters?.vision || "").trim();
  const mission = String(parameters?.mission || "").trim();
  const expertise = String(parameters?.expertise || "").trim();

  return (
    <div>
      <PageBanner />

      {/* STORY */}
      <section
        style={{
          backgroundColor: theme.colors.background.primary,
          padding: `${theme.spacing["4xl"]} ${theme.spacing.lg}`,
        }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: theme.spacing["3xl"],
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: theme.spacing["2xl"],
                boxShadow: theme.shadow.card,
              }}
            >
              <h2
                style={{ ...theme.heading.h2, marginBottom: theme.spacing.xl }}
              >
                Notre Histoire
              </h2>

              <div
                style={{
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.secondary,
                  lineHeight: theme.typography.lineHeight.body,
                }}
              >
                <p
                  style={{
                    marginBottom: theme.spacing.lg,
                    whiteSpace: "pre-line",
                    textAlign: "justify", // Added justify here
                  }}
                >
                  {story}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES / FEATURES */}
      <section
        style={{
          backgroundColor: theme.colors.background.secondary,
          padding: `${theme.spacing["4xl"]} ${theme.spacing.lg}`,
        }}
      >
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <div
            style={{ textAlign: "center", marginBottom: theme.spacing["3xl"] }}
          >
            <h2 style={{ ...theme.heading.h2, marginBottom: theme.spacing.lg }}>
              Nos engagements
            </h2>
            <p
              style={{
                fontFamily: theme.typography.fontFamily.body,
                fontSize: theme.typography.fontSize.lg,
                color: theme.colors.text.secondary,
                lineHeight: theme.typography.lineHeight.body,
                maxWidth: 900,
                margin: "0 auto",
              }}
            >
              Une démarche naturelle et structurée autour de l'équilibre hormonal,
              du cycle féminin, du confort intime et de la fertilité.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: theme.spacing.xl,
            }}
          >
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  padding: theme.spacing.xl,
                  backgroundColor: theme.colors.background.sage,
                  borderRadius: theme.borderRadius.lg,
                  textAlign: "center",
                  border: `1px solid ${theme.colors.border.light}`,
                  boxShadow: theme.shadow.card,
                }}
              >
                <feature.icon
                  size={48}
                  color={theme.colors.secondary.main}
                  style={{ margin: `0 auto ${theme.spacing.md}` }}
                />
                <h3
                  style={{
                    ...theme.heading.h5,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    lineHeight: theme.typography.lineHeight.body,
                    margin: 0,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section
        style={{
          backgroundColor: theme.colors.background.primary,
          padding: `${theme.spacing["4xl"]} ${theme.spacing.lg}`,
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              ...theme.heading.h2,
              marginBottom: theme.spacing.xl,
              textAlign: "center",
            }}
          >
            Qui sommes-nous ?
          </h2>

          <div
            style={{
              fontFamily: theme.typography.fontFamily.body,
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              lineHeight: theme.typography.lineHeight.body,
              padding: theme.spacing["2xl"],
              boxShadow: theme.shadow.card,
            }}
          >
            <h3
              style={{
                ...theme.heading.h4,
                marginTop: theme.spacing["2xl"],
                marginBottom: theme.spacing.lg,
              }}
            >
              Notre mission
            </h3>
            <p
              style={{
                marginBottom: theme.spacing.lg,
                whiteSpace: "pre-line",
                textAlign: "justify", // Added justify here
              }}
            >
              {mission}
            </p>

            <h3
              style={{
                ...theme.heading.h4,
                marginTop: theme.spacing["2xl"],
                marginBottom: theme.spacing.lg,
              }}
            >
              Notre vision
            </h3>
            <p
              style={{
                marginBottom: theme.spacing.lg,
                whiteSpace: "pre-line",
                textAlign: "justify", // Added justify here
              }}
            >
              {vision}
            </p>

            <h3
              style={{
                ...theme.heading.h4,
                marginTop: theme.spacing["2xl"],
                marginBottom: theme.spacing.lg,
              }}
            >
              Notre expertise
            </h3>
            <p
              style={{
                marginBottom: 0,
                whiteSpace: "pre-line",
                textAlign: "justify", // Added justify here
              }}
            >
              {expertise}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
