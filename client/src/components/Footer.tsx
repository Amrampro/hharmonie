import { useEffect, useMemo, useState } from "react";
import {
  Leaf,
  Mail,
  Phone,
  MapPin,
  FileText,
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  PhoneIcon,
} from "lucide-react";
import { theme } from "../config/theme";
import { Button } from "./Button";
import { useSiteParams } from "../contexts/SiteParamsContext";
import {
  legalLinksService,
  type LegalLink,
} from "../services/legalLinksService";
import { newsletterService } from "../services/newsletterService";

import { Link } from "react-router-dom";

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  // ✅ IMPORTANT: adapte juste CETTE ligne si ton context utilise un autre nom
  // Exemples possibles:
  // const { parameters } = useSiteParams();
  // const { data: parameters } = useSiteParams();
  // const { siteParams: parameters } = useSiteParams();
  const siteState = useSiteParams() as any;
  const parameters =
    siteState?.parameters ?? siteState?.data ?? siteState?.siteParams ?? null;

  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState("");

  const [legalLinks, setLegalLinks] = useState<LegalLink[]>([]);
  const [legalLoading, setLegalLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadLegalLinks() {
      setLegalLoading(true);
      try {
        // ✅ Ton service expose listLegalLinks()
        const data = await legalLinksService.listLegalLinks();
        if (!mounted) return;

        const links = (data.links || [])
          .filter(
            (l: LegalLink) =>
              String(l.is_active) === "true" || String(l.is_active) === "1"
          )
          .sort(
            (a: LegalLink, b: LegalLink) =>
              Number(a.display_order || 0) - Number(b.display_order || 0)
          );

        setLegalLinks(links);
      } catch {
        if (!mounted) return;
        setLegalLinks([]);
      } finally {
        if (!mounted) return;
        setLegalLoading(false);
      }
    }

    loadLegalLinks();
    return () => {
      mounted = false;
    };
  }, []);

  // client/src/components/Footer.tsx (replace handleSubscribe)
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    setMessage("");

    try {
      const res = await newsletterService.subscribe(email);

      if (res.status === "already_subscribed") {
        setMessage("Vous êtes déjà inscrit(e) à la newsletter.");
      } else {
        setMessage("Merci de votre inscription !");
        setEmail("");
      }
    } catch {
      setMessage("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubscribing(false);
    }
  };

  // ---- Params fallback helpers ----
  const footerLogo = String(parameters?.logo_footer || "").trim();
  const companyEmail = String(parameters?.email || "").trim();
  const companyPhone = String(parameters?.phone || "").trim();
  const companyAddress = String(parameters?.address || "").trim();
  const enterpriseNumber = String(parameters?.enterprise_number || "").trim();

  const facebook = String(parameters?.facebook_link || "").trim();
  const instagram = String(parameters?.instagram_link || "").trim();
  const twitter = String(parameters?.twitter_link || "").trim();
  const whatsapp = String(parameters?.whatsapp_link || "").trim(); // (si tu veux afficher plus tard)

  const socialLinks = useMemo(() => {
    const arr: Array<{
      key: string;
      href: string;
      Icon: React.ComponentType<any>;
      label: string;
    }> = [];
    if (facebook)
      arr.push({
        key: "fb",
        href: facebook,
        Icon: FacebookIcon,
        label: "Facebook",
      });
    if (instagram)
      arr.push({
        key: "ig",
        href: instagram,
        Icon: InstagramIcon,
        label: "Instagram",
      });
    if (twitter)
      arr.push({
        key: "x",
        href: twitter,
        Icon: TwitterIcon,
        label: "X / Twitter",
      });
    if (whatsapp)
      arr.push({
        key: "wa",
        href: whatsapp,
        Icon: PhoneIcon,
        label: "WhatsApp",
      });

    return arr;
  }, [facebook, instagram, twitter, whatsapp]);

  return (
    <footer>
      <div
        style={{
          backgroundColor: theme.colors.background.secondary,
          padding: `${theme.spacing["3xl"]} 0 ${theme.spacing.md}`,
        }}
      >
        <div
          style={{
            maxWidth: theme.container.maxWidth,
            margin: "0 auto",
            padding: `0 ${theme.spacing.lg}`,
          }}
        >
          {/* Newsletter */}
          <div
            style={{ textAlign: "center", marginBottom: theme.spacing["3xl"], backgroundColor: theme.colors.background.sage, padding: theme.spacing["2xl"] }}
          >
            <Mail
              size={48}
              color={theme.colors.primary.main}
              style={{ margin: "0 auto 1rem" }}
            />
            <h3 style={{ ...theme.heading.h3, marginBottom: theme.spacing.md }}>
              Inscrivez-vous à la newsletter
            </h3>
            <p
              style={{
                fontFamily: theme.typography.fontFamily.body,
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xl,
                maxWidth: "600px",
                margin: `0 auto ${theme.spacing.xl}`,
              }}
            >
              Bénéficiez de 10% de réduction immédiate et recevez nos conseils,
              offres et nouveautés bien-être.
            </p>

            <form
              onSubmit={handleSubscribe}
              style={{
                display: "flex",
                gap: theme.spacing.sm,
                maxWidth: "500px",
                margin: "0 auto",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <input
                type="email"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  flex: "1 1 300px",
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
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
              <Button type="submit" disabled={isSubscribing} variant="primary" style={{...theme.button.secondary}}>
                {isSubscribing ? "Inscription..." : "S'inscrire"}
              </Button>
            </form>

            {message && (
              <p
                style={{
                  marginTop: theme.spacing.md,
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.sm,
                  color:
                    message.includes("erreur") || message.includes("déjà")
                      ? theme.colors.status.error
                      : theme.colors.status.success,
                }}
              >
                {message}
              </p>
            )}
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: theme.spacing["2xl"],
              marginBottom: theme.spacing["2xl"],
            }}
          >
            {/* Brand */}
            <div>
              <div
                style={{
                  alignItems: "center",
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.lg,
                }}
              >
                {footerLogo ? (
                  <img
                    src={footerLogo}
                    alt="Logo"
                    style={{
                      width: "60%",
                      height: "auto",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Leaf size={32} color={theme.colors.primary.main} />
                )}

                {/* <div>
                  <div
                    style={{
                      ...theme.heading.h4,
                      fontSize: theme.typography.fontSize.xl,
                      marginBottom: 0,
                    }}
                  >
                    Novéden
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: theme.typography.fontSize.sm,
                      fontStyle: "italic",
                      color: theme.colors.text.secondary,
                    }}
                  >
                    la beauté authentique
                  </div>
                </div> */}
              </div>

              {/* <p
                style={{
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                  lineHeight: theme.typography.lineHeight.body,
                }}
              >
                Inspirés de l'Éden, nos soins 100 % naturels allient plantes ayurvédiques, fruits, extraits végétaux et actifs issus de la science dermo-cosmétique, pour nourrir, fortifier et révéler la beauté naturelle de la peau et des cheveux.
              </p> */}
              {enterpriseNumber && (
                <p
                  style={{
                    marginTop: theme.spacing.md,
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}
                >
                  N° d’entreprise : {enterpriseNumber}
                </p>
              )}
            </div>

            {/* Legal links */}
            <div>
              <h4
                style={{
                  ...theme.heading.h5,
                  fontSize: theme.typography.fontSize.base,
                  marginBottom: theme.spacing.lg,
                  textTransform: "uppercase",
                  letterSpacing: theme.typography.letterSpacing.wide,
                }}
              >
                Liens Légaux
              </h4>

              {legalLoading ? (
                <div
                  style={{
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}
                >
                  Chargement...
                </div>
              ) : legalLinks.length === 0 ? (
                <div
                  style={{
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}
                >
                  Aucun lien légal disponible.
                </div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {legalLinks.map((l: LegalLink) => (
                    <li key={l.id} style={{ marginBottom: theme.spacing.sm }}>
                      <a
                        href={l.file}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: theme.spacing.sm,
                          fontFamily: theme.typography.fontFamily.body,
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.text.secondary,
                          textDecoration: "none",
                          cursor: "pointer",
                          transition: theme.transition.fast,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color =
                            theme.colors.primary.main;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color =
                            theme.colors.text.secondary;
                        }}
                      >
                        <FileText size={16} color={theme.colors.primary.main} />
                        {l.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Navigation */}
            <div>
              <h4
                style={{
                  ...theme.heading.h5,
                  fontSize: theme.typography.fontSize.base,
                  marginBottom: theme.spacing.lg,
                  textTransform: "uppercase",
                  letterSpacing: theme.typography.letterSpacing.wide,
                }}
              >
                Navigation
              </h4>
              <Link to="/admin">Administration</Link>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {[
                  { label: "Accueil", key: "home" },
                  { label: "Nos produits", key: "shop" },
                  { label: "Notre approche", key: "approach" },
                  { label: "Consultation", key: "consultation" },
                  { label: "Événements", key: "events" },
                  { label: "FAQ", key: "faqs" },
                  { label: "Contact", key: "contact" },
                ].map((item) => (
                  <li key={item.key} style={{ marginBottom: theme.spacing.sm }}>
                    <button
                      onClick={() => onNavigate?.(item.key)}
                      style={{
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        padding: 0,
                        transition: theme.transition.fast,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme.colors.primary.main;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color =
                          theme.colors.text.secondary;
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social + Contact */}
            <div>
              <h4
                style={{
                  ...theme.heading.h5,
                  fontSize: theme.typography.fontSize.base,
                  marginBottom: theme.spacing.lg,
                  textTransform: "uppercase",
                  letterSpacing: theme.typography.letterSpacing.wide,
                }}
              >
                Suivez-Nous
              </h4>

              <div
                style={{
                  display: "flex",
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.lg,
                }}
              >
                {socialLinks.length === 0 ? (
                  <span
                    style={{
                      fontFamily: theme.typography.fontFamily.body,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    —
                  </span>
                ) : (
                  socialLinks.map((s) => (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      title={s.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 40,
                        height: 40,
                        borderRadius: theme.borderRadius.full,
                        backgroundColor: theme.colors.primary[100],
                        transition: theme.transition.fast,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          theme.colors.primary.main;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          theme.colors.primary[100];
                      }}
                    >
                      <s.Icon size={20} color={theme.colors.primary.main} />
                    </a>
                  ))
                )}
              </div>

              <div style={{ marginTop: theme.spacing.lg }}>
                {companyEmail && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: theme.spacing.sm,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <Mail
                      size={16}
                      color={theme.colors.primary.main}
                      style={{ marginTop: "2px" }}
                    />
                    <span
                      style={{
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      Email : {companyEmail}
                    </span>
                  </div>
                )}

                {companyPhone && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: theme.spacing.sm,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    <Phone
                      size={16}
                      color={theme.colors.primary.main}
                      style={{ marginTop: "2px" }}
                    />
                    <span
                      style={{
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      Tel : {companyPhone}
                    </span>
                  </div>
                )}

                {companyAddress && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: theme.spacing.sm,
                    }}
                  >
                    <MapPin
                      size={16}
                      color={theme.colors.primary.main}
                      style={{ marginTop: "2px" }}
                    />
                    <span
                      style={{
                        fontFamily: theme.typography.fontFamily.body,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      Adresse : {companyAddress}
                    </span>
                  </div>
                )}

                {!companyEmail && !companyPhone && !companyAddress && (
                  <span
                    style={{
                      fontFamily: theme.typography.fontFamily.body,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    —
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: `1px solid ${theme.colors.border.main}`,
              paddingTop: theme.spacing.lg,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: theme.typography.fontFamily.body,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                margin: 0,
              }}
            >
              © 2026, Hormones & Harmonie. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
