// client/src/pages/AmbassadorsPage.tsx
import React, { useState, useEffect } from "react"; // Added useEffect and useState
import { useNavigate, Link } from "react-router-dom";
import { theme } from "../config/theme";
import { Button } from "../components/Button";

// --- Simple hook to detect mobile ---
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768); // 768px is a standard breakpoint

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

export function AmbassadorsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(); // Use the hook

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.colors.background.primary,
      }}
    >
      {/* HEADER */}
      <div style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
        <div style={container()}>
          <div
            style={{
              // Adjust padding on mobile if needed
              padding: isMobile
                ? `${theme.spacing.xl} 0`
                : `${theme.spacing["2xl"]} 0`,
              textAlign: "center",
            }}
          >
            <h1
              style={{
                ...theme.heading.h1,
                margin: 0,
                // Adjust font size on mobile if your theme doesn't handle it
                fontSize: isMobile ? "2rem" : theme.heading.h1.fontSize,
              }}
            >
              Programme Ambassadeur
            </h1>
            <p
              style={{
                ...theme.body.base,
                marginTop: theme.spacing.md,
                color: theme.colors.text.secondary,
                maxWidth: 780,
                marginInline: "auto",
              }}
            >
              Rejoignez notre programme exclusif et gagnez des commissions grâce
              à votre code de parrainage.
            </p>
          </div>
        </div>
      </div>

      <div style={container()}>
        {/* IMPORTANT NOTICE */}
        <section
          style={{
            paddingTop: isMobile ? theme.spacing.xl : theme.spacing["2xl"],
          }}
        >
          <div>
            <div style={sectionHeader()}>
              <h2 style={{ ...theme.heading.h3, margin: 0 }}>
                Comment devenir ambassadeur
              </h2>
            </div>
            <div
              style={{
                marginTop: theme.spacing.lg,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.background.secondary,
                border: `1px solid ${theme.colors.border.light}`,
              }}
            >
              <ol style={{ ...theme.body.base, margin: 0, paddingLeft: theme.spacing.lg, lineHeight: 1.8 }}>
                <li>Créez votre compte sur notre plateforme si vous n'en avez pas encore un.</li>
                <li>Connectez-vous à votre compte.</li>
                <li>Rendez-vous dans "Mon Compte".</li>
                <li>Vous verrez l'option "Paramètres du compte ambassadeur". Cliquez dessus et remplissez les informations et le tour est joué !</li>
              </ol>
            </div>
            <div
              style={{
                marginTop: theme.spacing.lg,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.background.primary,
                border: `1px solid ${theme.colors.border.light}`,
              }}
            >
              <p style={stepParagraph()}>
                <span style={{ fontWeight: 700 }}>
                  1) Vous n’avez pas encore de compte ?
                </span>{" "}
                Créer un compte sur la plateforme.{" "}
                <i>
                  <Link style={linkStyle()} to="/signup">
                    Pour créer un compte, cliquer ici
                  </Link>
                </i>
              </p>

              <p style={stepParagraph()}>
                <span style={{ fontWeight: 700 }}>
                  2) Vous avez déjà un compte ?
                </span>{" "}
                Connectez-vous et accédez au compte ambassadeur.{" "}
                <i>
                  <Link style={linkStyle()} to="/auth">
                    Pour vous connecter à la plateforme, cliquer ici
                  </Link>
                </i>
              </p>
              <p style={stepParagraph()}>
                <span style={{ fontWeight: 700 }}>
                  3) Vous êtes déjà connecté à la plateforme ?
                </span>{" "}
                Accédez tout simplement au paramètres du compte ambassadeur.{" "}
                <i>
                  <Link style={linkStyle()} to="/ambassador/account">
                    Pour accéder au compte ambassadeur, cliquer ici
                  </Link>
                </i>
              </p>
            </div>

            <div
              style={{
                marginTop: theme.spacing.xl,
                display: "flex",
                justifyContent: "center",
                gap: theme.spacing.md,
                flexWrap: "wrap",
                // On mobile, take full width if needed
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
              }}
            >
              <Button
                variant="primary"
                onClick={() => navigate("/signup")}
                // style={isMobile ? { width: "100%" } : {}}
                style={{...theme.button.primary, width: isMobile ? "100%" : "auto"}}
              >
                Créer un compte
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                // style={isMobile ? { width: "100%" } : {}}
                style={{...theme.button.outline, width: isMobile ? "100%" : "auto"}}
              >
                Se connecter
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/ambassador/account")}
                // style={isMobile ? { width: "100%" } : {}}
                style={{...theme.button.secondary, width: isMobile ? "100%" : "auto"}}
              >
                Accéder au compte ambassadeur
              </Button>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section
          style={{
            paddingTop: isMobile ? theme.spacing.xl : theme.spacing["2xl"],
            paddingBottom: isMobile ? theme.spacing.xl : theme.spacing["2xl"],
          }}
        >
          <div style={sectionHeader()}>
            <h2 style={{ ...theme.heading.h3, margin: 0 }}>
              Avantages du programme
            </h2>
          </div>

          {/* We pass 'isMobile' to grid2 */}
          <div style={grid2(isMobile)}>
            <BenefitCard
              title="Commissions"
              desc="Gagnez 5% des commissions sur chaque parrainage réussi."
              icon="💰"
            />
            <BenefitCard
              title="Code personnel"
              desc="Obtenez un code de parrainage unique à partager."
              icon="🔗"
            />
            <BenefitCard
              title="Support dédié"
              desc="Accédez à un support prioritaire pour vos questions."
              icon="🎧"
            />
            <BenefitCard
              title="Suivi en temps réel"
              desc="Consultez vos commissions et conversions en direct."
              icon="📊"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------- UI Helpers -------------------- */

// Refactored BenefitCard to use fewer inline styles inside the component
function BenefitCard(props: { title: string; desc: string; icon?: string }) {
  return (
    <div style={card()}>
      <div style={{ fontSize: 32, marginBottom: theme.spacing.sm }}>
        {props.icon}
      </div>
      <h3
        style={{
          ...theme.body.base,
          fontWeight: 700,
          margin: 0,
          marginBottom: theme.spacing.xs, // reduced spacing
          color: theme.colors.text.primary,
        }}
      >
        {props.title}
      </h3>
      <p
        style={{
          ...theme.body.base,
          margin: 0,
          color: theme.colors.text.secondary,
          lineHeight: 1.6, // reduced line height for small cards
          fontSize: "0.95rem", // slightly smaller font
        }}
      >
        {props.desc}
      </p>
    </div>
  );
}

// Factorized repeated styles
function stepParagraph(): React.CSSProperties {
  return {
    ...theme.body.base,
    marginTop: theme.spacing.sm,
    marginBottom: 0,
    color: theme.colors.text.primary,
    lineHeight: 1.7,
  };
}

function linkStyle(): React.CSSProperties {
  return {
    textDecoration: "underline",
    color: theme.colors.primary.main,
  };
}

function container(): React.CSSProperties {
  return {
    maxWidth: theme.container.maxWidth,
    margin: "0 auto",
    padding: `0 ${theme.spacing.lg}`, // Reduced horizontal padding for small screens, will be overridden by theme if container has specific padding
  };
}

function sectionHeader(): React.CSSProperties {
  return {
    textAlign: "center",
    marginBottom: theme.spacing.lg, // Reduced margin
  };
}

// --- MODIFIED FUNCTION ---
// Accepts isMobile argument to change the grid template
function grid2(isMobile: boolean): React.CSSProperties {
  return {
    display: "grid",
    // 1 column on mobile, 2 columns otherwise
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
    gap: theme.spacing.md, // Reduced gap for tighter look on mobile
  };
}

function card(): React.CSSProperties {
  return {
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg, // Reduced padding
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)", // Lighter shadow
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start", // align content to start
  };
}

// --- Unused helpers in final version but kept for context if needed ---
/*
function alertCard(): React.CSSProperties {
  return {
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.error.main}`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  };
}

function alertTitle(): React.CSSProperties {
  return {
    ...theme.heading.h4,
    margin: 0,
    color: theme.colors.error.main,
  };
}

function dangerText(): React.CSSProperties {
  return {
    color: theme.colors.error.main,
    fontWeight: 700,
  };
}
*/