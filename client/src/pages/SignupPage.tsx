import { useState } from "react";
import { Mail, Lock, User, Phone, UserPlus } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { useAuth } from "../contexts/AuthContext";

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      formData.phone
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate("/account", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.colors.background.primary }}>
  

      <section
        style={{
          backgroundColor: theme.colors.background.sage,
          padding: `${theme.spacing["3xl"]} ${theme.spacing.lg}`,
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ ...theme.heading.h1, marginBottom: theme.spacing.lg }}>
            Créer un compte
          </h1>
          <p style={{ ...theme.body.large, color: theme.colors.text.secondary }}>
            Rejoignez-nous pour profiter d&apos;une expérience d&apos;achat personnalisée
          </p>
        </div>
      </section>

      <section
        style={{
          backgroundColor: theme.colors.background.primary,
          padding: `${theme.spacing["4xl"]} ${theme.spacing.lg}`,
          minHeight: "60vh",
        }}
      >
        <div style={{ maxWidth: "500px", margin: "0 auto" }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  backgroundColor: theme.colors.error[50],
                  border: `1px solid ${theme.colors.error.main}`,
                  borderRadius: theme.borderRadius.md,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.lg,
                }}
              >
                <p style={{ ...theme.body.base, color: theme.colors.error.main }}>{error}</p>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: theme.spacing.lg,
                marginBottom: theme.spacing.lg,
              }}
            >
              <div>
                <label
                  htmlFor="firstName"
                  style={{
                    display: "block",
                    ...theme.body.base,
                    fontWeight: theme.typography.fontWeight.medium,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  Prénom *
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={20}
                    style={{
                      position: "absolute",
                      left: theme.spacing.md,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: theme.colors.text.light,
                    }}
                  />
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 48px`,
                      border: `1px solid ${theme.colors.border.main}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      fontFamily: theme.typography.fontFamily.body,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  style={{
                    display: "block",
                    ...theme.body.base,
                    fontWeight: theme.typography.fontWeight.medium,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  Nom *
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={20}
                    style={{
                      position: "absolute",
                      left: theme.spacing.md,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: theme.colors.text.light,
                    }}
                  />
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 48px`,
                      border: `1px solid ${theme.colors.border.main}`,
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.base,
                      fontFamily: theme.typography.fontFamily.body,
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: theme.spacing.lg }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  ...theme.body.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Adresse email *
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={20}
                  style={{
                    position: "absolute",
                    left: theme.spacing.md,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: theme.colors.text.light,
                  }}
                />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 48px`,
                    border: `1px solid ${theme.colors.border.main}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: theme.spacing.lg }}>
              <label
                htmlFor="phone"
                style={{
                  display: "block",
                  ...theme.body.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Téléphone *
              </label>
              <div style={{ position: "relative" }}>
                <Phone
                  size={20}
                  style={{
                    position: "absolute",
                    left: theme.spacing.md,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: theme.colors.text.light,
                  }}
                />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 48px`,
                    border: `1px solid ${theme.colors.border.main}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: theme.spacing.lg }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  ...theme.body.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Mot de passe *
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={20}
                  style={{
                    position: "absolute",
                    left: theme.spacing.md,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: theme.colors.text.light,
                  }}
                />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 48px`,
                    border: `1px solid ${theme.colors.border.main}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: theme.spacing.xl }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: "block",
                  ...theme.body.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Confirmer le mot de passe *
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={20}
                  style={{
                    position: "absolute",
                    left: theme.spacing.md,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: theme.colors.text.light,
                  }}
                />
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: `${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md} 48px`,
                    border: `1px solid ${theme.colors.border.main}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.typography.fontSize.base,
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                padding: theme.spacing.md,
                backgroundColor: theme.colors.primary.main,
                color: "#fff",
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.lg,
              }}
            >
              {loading ? (
                "Création du compte..."
              ) : (
                <>
                  <UserPlus size={20} style={{ marginRight: theme.spacing.sm }} />
                  Créer mon compte
                </>
              )}
            </Button>

            <p style={{ ...theme.body.base, textAlign: "center" }}>
              Vous avez déjà un compte ?{" "}
              <Link
                to="/auth"
                style={{
                  color: theme.colors.primary.main,
                  textDecoration: "underline",
                  fontSize: theme.typography.fontSize.base,
                  fontFamily: theme.typography.fontFamily.body,
                }}
              >
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </section>

    </div>
  );
}
