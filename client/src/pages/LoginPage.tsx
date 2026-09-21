import { PasswordInput } from "../components/PasswordInput";
import { useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate("/account", { replace: true });
  };

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
        <div
          style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}
        >
          <h1 style={{ ...theme.heading.h1, marginBottom: theme.spacing.lg }}>
            Connexion
          </h1>
          <p
            style={{ ...theme.body.large, color: theme.colors.text.secondary }}
          >
            Connectez-vous à votre compte pour passer votre commande
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
                <p
                  style={{ ...theme.body.base, color: theme.colors.error.main }}
                >
                  {error}
                </p>
              </div>
            )}

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
                Adresse email
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                htmlFor="password"
                style={{
                  display: "block",
                  ...theme.body.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  marginBottom: theme.spacing.sm,
                }}
              >
                Mot de passe
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
                <PasswordInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                "Connexion en cours..."
              ) : (
                <>
                  <LogIn size={20} style={{ marginRight: theme.spacing.sm }} />
                  Se connecter
                </>
              )}
            </Button>

            <p style={{ ...theme.body.base, textAlign: "center" }}>
              Pas encore de compte ?{" "}
              <Link
                to="/signup"
                style={{
                  color: theme.colors.primary.main,
                  textDecoration: "underline",
                  fontSize: theme.typography.fontSize.base,
                  fontFamily: theme.typography.fontFamily.body,
                }}
              >
                Créer un compte
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
