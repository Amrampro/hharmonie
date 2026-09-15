import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bannerService } from "../services/bannerService";
import { theme } from "../config/theme";
import { Button } from "./Button";

type BannerPageName = "home" | "shop" | "about" | "faqs" | "contact" | "approach" | "consultation" | "events";

type Banner = {
  id: string;
  page_name: BannerPageName;
  title: string | null;
  subtitle: string | null;
  button: string | null;
  link: string | null;
  background_img: string | null;
  is_active: any;
  display_order: number;
};

type Props = {
  defaultKicker?: string;
};

// --- HELPER HOOK FOR RESPONSIVENESS ---
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

function routeToPageName(pathname: string): BannerPageName | null {
  const p = (pathname || "").trim();

  if (p === "/" || p === "") return "home";
  if (p === "/shop" || p.startsWith("/shop/")) return "shop";
  if (p === "/about" || p.startsWith("/about/")) return "about";
  if (p === "/approach" || p.startsWith("/approach/")) return "approach";
  if (p === "/consultation" || p.startsWith("/consultation/")) return "consultation";
  if (p === "/events" || p.startsWith("/events/")) return "events";
  if (p === "/faqs" || p.startsWith("/faqs/")) return "faqs";
  if (p === "/contact" || p.startsWith("/contact/")) return "contact";

  return null;
}

const toBool = (v: any) => v === true || v === 1 || v === "1";

export function PageBanner({}: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Detect if screen is large (Desktop/Laptop)
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const pageName = useMemo(
    () => routeToPageName(location.pathname),
    [location.pathname]
  );

  const [banner, setBanner] = useState<Banner | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {

      if (!pageName) {
        if (!mounted) return;
        setBanner(null);
        setLoaded(true);
        return;
      }

      setLoaded(false);

      try {
        const resp = await bannerService.getActiveBannerByPageName(pageName);
        if (!mounted) return;
        setBanner(resp?.banner ?? null);
      } catch (e: any) {
        if (!mounted) return;
        setBanner(null);
      } finally {
        if (!mounted) return;
        setLoaded(true);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [pageName]);

  if (!loaded) return null;
  if (!banner) return null;
  if (!toBool(banner.is_active)) return null;

  const bgImage = (banner.background_img || "").trim();
  const title = (banner.title || "").trim();
  const subtitle = (banner.subtitle || "").trim();
  const buttonText = (banner.button || "").trim();
  const buttonLink = (banner.link || "").trim();

  const showCta = Boolean(buttonText && buttonLink);
  const hasAnyContent = Boolean(title || subtitle || bgImage || showCta);

  if (!hasAnyContent) return null;

  // --- STYLING UPDATES ---
  const sectionStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.sage,
    position: "relative",
    overflow: "hidden",
    
    // Flexbox used to vertically center content
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",

    // Responsive padding
    padding: isLargeScreen 
      ? `${theme.spacing["4xl"]} ${theme.spacing.lg}`
      : `${theme.spacing["2xl"]} ${theme.spacing.md}`,

    // --- CHANGED HERE: FORCE 60vh MAX HEIGHT ---
    height: "60vh",
    maxHeight: "60vh",

    ...(bgImage
      ? {
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          // --- CHANGED HERE: LEFT ALIGNMENT ---
          // "left center" anchors the image to the left edge. 
          // As the screen shrinks, the right side is cropped.
          backgroundPosition: "left center", 
        }
      : {}),
  };

  const onNavigate = (to: string) => {
    const path = to.startsWith("/") ? to : `/${to}`;
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section style={sectionStyle}>
      <div
        style={{
          maxWidth: theme.container.maxWidth,
          width: "100%", 
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: isLargeScreen ? theme.spacing["3xl"] : theme.spacing.lg, 
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
        className="hero-grid"
      >
        <div style={{ textAlign: "center" }}>
          {title ? (
            <h1
              style={{
                ...theme.heading.h1,
                fontSize: isLargeScreen ? "3.5rem" : "2.25rem",
                marginBottom: theme.spacing.lg,
                fontStyle: "italic",
              }}
            >
              {title}
            </h1>
          ) : null}

          {subtitle ? (
            <h2
              style={{
                ...theme.heading.h2,
                fontSize: isLargeScreen ? "2.5rem" : "1.5rem",
                marginBottom: theme.spacing.md,
                fontStyle: "italic",
              }}
            >
              {subtitle}
            </h2>
          ) : null}

          {showCta ? (
            <div
              style={{
                display: "flex",
                gap: theme.spacing.md,
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: theme.spacing.xl, 
              }}
            >
              <Button
                variant="primary"
                size={isLargeScreen ? "medium" : "small"} 
                onClick={() => onNavigate(buttonLink)}
              >
                {buttonText}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
