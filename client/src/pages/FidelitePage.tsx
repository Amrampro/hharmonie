// client/src/pages/FidelitePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import HERO_IMG from "../assets/img/fidelity2.jpg";

// Hook pour la réactivité mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

export function FidelitePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.colors.background.primary,
      }}
    >
      {/* HEADER */}
      <div style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
        <div style={container(isMobile)}>
          <div
            style={{
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
                fontSize: isMobile ? "2rem" : theme.heading.h1.fontSize,
              }}
            >
              Fidélité
            </h1>
            <p
              style={{
                ...theme.body.base,
                marginTop: theme.spacing.md,
                color: theme.colors.text.secondary,
              }}
            >
              Découvrez comment économiser et gagner grâce à notre programme de
              fidélité !
            </p>
          </div>
        </div>
      </div>

      <div style={container(isMobile)}>
        {/* IMAGE CENTRÉE */}
        <section
          style={{
            padding: isMobile
              ? `${theme.spacing.lg} 0`
              : `${theme.spacing["2xl"]} 0`,
          }}
        >
          <div
            style={{
              borderRadius: isMobile
                ? theme.borderRadius.lg
                : theme.borderRadius.xl,
              overflow: "hidden",
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
            }}
          >
            <img
              src={HERO_IMG}
              alt="Programme de fidélité"
              style={{
                width: "100%",
                display: "block",
                maxHeight: isMobile ? "250px" : "none",
                objectFit: "cover",
              }}
            />
          </div>
        </section>

        {/* REDUCTIONS FIDELITE */}
        <section
          style={{
            paddingBottom: isMobile
              ? theme.spacing.xl
              : theme.spacing["2xl"],
          }}
        >
          <div style={sectionHeader(isMobile)}>
            <h2 style={{ ...theme.heading.h3, margin: 0 }}>
              Réductions Fidélité
            </h2>
            <p
              style={{
                ...theme.body.base,
                marginTop: theme.spacing.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Plus vous commandez, plus vous êtes récompensé.
            </p>
          </div>

          <div style={grid2(isMobile)}>
            <DiscountCard
              title="À votre 1ère commande"
              highlight="-10%"
              desc="Bénéficiez de 10% de réduction sur votre première commande."
              icon="🎁"
              isMobile={isMobile}
            />
            <DiscountCard
              title="À votre 6ème commande"
              highlight="-15%"
              desc="Obtenez 15% de réduction sur votre sixième commande."
              icon="🏷️"
              isMobile={isMobile}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------- UI Helpers -------------------- */

function DiscountCard(props: {
  title: string;
  highlight: string;
  desc: string;
  icon?: string;
  isMobile: boolean;
}) {
  return (
    <div style={card(props.isMobile)}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              ...theme.body.small,
              color: theme.colors.text.secondary,
            }}
          >
            {props.title}
          </div>
          <div
            style={{
              marginTop: theme.spacing.xs,
              fontSize: props.isMobile ? 28 : 34,
              fontWeight: 800,
              color: theme.colors.primary.main,
            }}
          >
            {props.highlight}
          </div>
        </div>

        <div style={{ fontSize: props.isMobile ? 24 : 28 }}>{props.icon}</div>
      </div>

      <div
        style={{
          height: 1,
          backgroundColor: theme.colors.border.light,
          margin: `${props.isMobile ? theme.spacing.md : theme.spacing.lg} 0`,
        }}
      />

      <p
        style={{
          ...theme.body.base,
          margin: 0,
          fontSize: props.isMobile ? "0.95rem" : "1rem",
        }}
      >
        {props.desc}
      </p>
    </div>
  );
}

function container(isMobile: boolean): React.CSSProperties {
  return {
    maxWidth: theme.container.maxWidth,
    margin: "0 auto",
    padding: `0 ${isMobile ? theme.spacing.lg : theme.spacing["2xl"]}`,
  };
}

function sectionHeader(isMobile: boolean): React.CSSProperties {
  return {
    textAlign: "center",
    marginBottom: isMobile ? theme.spacing.lg : theme.spacing.xl,
  };
}

function grid2(isMobile: boolean): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
    gap: isMobile ? theme.spacing.md : theme.spacing.xl,
  };
}

function card(isMobile: boolean): React.CSSProperties {
  return {
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.lg,
    padding: isMobile ? theme.spacing.lg : theme.spacing.xl,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  };
}