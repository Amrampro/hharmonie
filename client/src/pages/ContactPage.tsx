// client/src/pages/ContactPage.tsx
import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { PageBanner } from "../components/PageBanner";
import { useSiteParams } from "../contexts/SiteParamsContext";
import { contactService } from "../services/contactService";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback("");

    try {
      const res = await contactService.send(formData);
      setFeedback(
        res.message ||
          "Merci pour votre message ! Nous vous répondrons rapidement."
      );
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setFeedback(err?.message || "Erreur lors de l'envoi du message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    border: `2px solid ${theme.colors.border.main}`,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.base,
    outline: "none",
    backgroundColor: theme.colors.background.primary,
  };

  const siteState = useSiteParams() as any;
  const parameters =
    siteState?.parameters ?? siteState?.data ?? siteState?.siteParams ?? null;

  const phone = String(parameters?.phone || "").trim();
  const email = String(parameters?.email || "").trim();
  const address = String(parameters?.address || "").trim();

  return (
    <div>
      <PageBanner />

      {/* CONTENT */}
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
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: theme.spacing["3xl"],
              alignItems: "start",
            }}
          >
            {/* FORM */}
            <div
              style={{
                backgroundColor: theme.colors.background.sage,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.border.light}`,
                padding: theme.spacing.xl,
                boxShadow: theme.shadow.card,
              }}
            >
              <h2
                style={{ ...theme.heading.h3, marginBottom: theme.spacing.xl }}
              >
                Envoyez-nous un message
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label
                    htmlFor="name"
                    style={{
                      display: "block",
                      fontFamily: theme.typography.fontFamily.body,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Nom complet
                  </label>
                  <input
                    id="name"
                    name="name"
                    maxLength={190}
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={inputBase}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        theme.colors.primary.main)
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        theme.colors.border.main)
                    }
                  />
                </div>

                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label
                    htmlFor="email"
                    style={{
                      display: "block",
                      fontFamily: theme.typography.fontFamily.body,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Adresse e-mail
                  </label>
                  <input
                    id="email"
                    name="email"
                    maxLength={254}
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={inputBase}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        theme.colors.primary.main)
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        theme.colors.border.main)
                    }
                  />
                </div>

                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label
                    htmlFor="subject"
                    style={{
                      display: "block",
                      fontFamily: theme.typography.fontFamily.body,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Sujet
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    maxLength={255}
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    style={inputBase}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        theme.colors.primary.main)
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        theme.colors.border.main)
                    }
                  />
                </div>

                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label
                    htmlFor="message"
                    style={{
                      display: "block",
                      fontFamily: theme.typography.fontFamily.body,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.text.primary,
                      marginBottom: theme.spacing.sm,
                    }}
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    maxLength={10000}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    style={{ ...inputBase, resize: "vertical" }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor =
                        theme.colors.primary.main)
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor =
                        theme.colors.border.main)
                    }
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                </Button>

                {feedback && (
                  <p
                    style={{
                      marginTop: theme.spacing.md,
                      fontFamily: theme.typography.fontFamily.body,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.status.success,
                      textAlign: "center",
                    }}
                  >
                    {feedback}
                  </p>
                )}
              </form>
            </div>

            {/* CONTACT INFOS */}
            <div>
              <h2
                style={{ ...theme.heading.h3, marginBottom: theme.spacing.xl }}
              >
                Nos coordonnées
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: theme.spacing.xl,
                }}
              >
                {[
                  {
                    icon: Mail,
                    title: "Email",
                    value: email,
                  },
                  {
                    icon: Phone,
                    title: "Téléphone",
                    value: phone,
                  },
                  {
                    icon: MapPin,
                    title: "Adresse",
                    value: address,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      display: "flex",
                      gap: theme.spacing.md,
                      padding: theme.spacing.lg,
                      backgroundColor: theme.colors.background.secondary,
                      borderRadius: theme.borderRadius.lg,
                      border: `1px solid ${theme.colors.border.light}`,
                      boxShadow: theme.shadow.sm,
                    }}
                  >
                    <item.icon
                      size={24}
                      color={theme.colors.primary.main}
                      style={{ flexShrink: 0, marginTop: 4 }}
                    />
                    <div>
                      <h3
                        style={{
                          ...theme.heading.h5,
                          fontSize: theme.typography.fontSize.base,
                          marginBottom: theme.spacing.xs,
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: theme.typography.fontFamily.body,
                          fontSize: theme.typography.fontSize.base,
                          color: theme.colors.text.secondary,
                          margin: 0,
                        }}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: theme.spacing["2xl"],
                  padding: theme.spacing.xl,
                  backgroundColor: theme.colors.background.sage,
                  borderRadius: theme.borderRadius.lg,
                  border: `1px solid ${theme.colors.border.light}`,
                }}
              >
                <h3
                  style={{
                    ...theme.heading.h5,
                    marginBottom: theme.spacing.md,
                  }}
                >
                  Heures d&apos;ouverture
                </h3>
                <p
                  style={{
                    fontFamily: theme.typography.fontFamily.body,
                    fontSize: theme.typography.fontSize.base,
                    color: theme.colors.text.secondary,
                    lineHeight: theme.typography.lineHeight.body,
                    margin: 0,
                  }}
                >
                  Lundi - Vendredi: 9h00 - 18h00
                  <br />
                  Samedi: 10h00 - 16h00
                  <br />
                  Dimanche: Fermé
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
