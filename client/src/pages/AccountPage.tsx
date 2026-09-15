// client/src/pages/AccountPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { api } from "../services/api";

const TOKEN_KEY = "token";

export function AccountPage() {
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const ensureAuth = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      navigate("/auth", { replace: true });
      return false;
    }
    return true;
  };

  const load = async () => {
    setErr(null);
    setMsg(null);

    try {
      if (!ensureAuth()) return;

      const p = await api.getProfile();
      setProfile(p?.user || p);
    } catch (e: any) {
      const message = e?.message || "";
      if (
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("invalid token") ||
        message.toLowerCase().includes("access token required") ||
        message.toLowerCase().includes("expired")
      ) {
        navigate("/login", { replace: true });
        return;
      }
      setErr(message || "Erreur de chargement");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      await api.updateProfile({
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        phone: profile?.phone ?? "",
      });

      setMsg("Profil mis à jour.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Erreur mise à jour profil");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      if (!currentPassword || !newPassword || !newPassword2) {
        throw new Error("Veuillez remplir tous les champs mot de passe.");
      }
      if (newPassword !== newPassword2) {
        throw new Error("Les deux nouveaux mots de passe ne correspondent pas.");
      }
      if (newPassword.length < 8) {
        throw new Error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      }

      await api.updatePassword({ currentPassword, newPassword });

      setMsg("Mot de passe mis à jour.");
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e: any) {
      setErr(e?.message || "Erreur mise à jour mot de passe");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          `linear-gradient(180deg, ${theme.colors.background.primary} 0%, ${theme.colors.background.secondary} 100%)`,
      }}
    >
      <div
        style={{
          maxWidth: theme.container.maxWidth,
          margin: "0 auto",
          padding: theme.spacing["2xl"],
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: theme.spacing.md,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: theme.spacing.xl,
          }}
        >
          <div>
            <h1 style={{ ...theme.heading.h2, margin: 0 }}>Mon compte</h1>
            <div
              style={{
                ...theme.body.base,
                color: theme.colors.text.secondary,
                marginTop: 6,
              }}
            >
              Gérez vos informations personnelles et la sécurité de votre compte.
            </div>
          </div>

          <div style={{ display: "flex", gap: theme.spacing.sm, flexWrap: "wrap" }}>
            <Button variant="outline" onClick={() => navigate("/ambassador/account")}>
              Paramètres du compte ambassadeur
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Retour à l’accueil
            </Button>
          </div>
        </div>

        {(err || msg) && (
          <div
            style={{
              marginBottom: theme.spacing.lg,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${
                err ? theme.colors.error.main : theme.colors.border.light
              }`,
              backgroundColor: theme.colors.background.primary,
              padding: theme.spacing.lg,
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            }}
          >
            {err && (
              <div style={{ color: theme.colors.error.main, ...theme.body.base }}>
                {err}
              </div>
            )}
            {msg && (
              <div style={{ color: theme.colors.primary.main, ...theme.body.base }}>
                {msg}
              </div>
            )}
          </div>
        )}

        <div
          className="account-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: theme.spacing.lg,
          }}
        >
          <div style={card()}>
            <div style={cardHeader()}>
              <div>
                <h3 style={{ ...theme.heading.h4, margin: 0 }}>Mes informations</h3>
                <div
                  style={{
                    ...theme.body.base,
                    color: theme.colors.text.secondary,
                    marginTop: 6,
                  }}
                >
                  Mettez à jour vos données personnelles.
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
              <label style={labelStyle()}>
                Prénom
                <input
                  style={inputStyle()}
                  value={profile?.first_name ?? ""}
                  onChange={(e) =>
                    setProfile((s: any) => ({ ...s, first_name: e.target.value }))
                  }
                  placeholder="Prénom"
                />
              </label>

              <label style={labelStyle()}>
                Nom
                <input
                  style={inputStyle()}
                  value={profile?.last_name ?? ""}
                  onChange={(e) =>
                    setProfile((s: any) => ({ ...s, last_name: e.target.value }))
                  }
                  placeholder="Nom"
                />
              </label>

              <label style={labelStyle()}>
                Téléphone
                <input
                  style={inputStyle()}
                  value={profile?.phone ?? ""}
                  onChange={(e) =>
                    setProfile((s: any) => ({ ...s, phone: e.target.value }))
                  }
                  placeholder="Téléphone"
                />
              </label>
            </div>

            <div
              style={{
                marginTop: theme.spacing.xl,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button variant="primary" onClick={saveProfile} disabled={busy}>
                {busy ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>

          <div style={card()}>
            <div style={cardHeader()}>
              <div>
                <h3 style={{ ...theme.heading.h4, margin: 0 }}>Sécurité</h3>
                <div
                  style={{
                    ...theme.body.base,
                    color: theme.colors.text.secondary,
                    marginTop: 6,
                  }}
                >
                  Modifiez votre mot de passe.
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
              <label style={labelStyle()}>
                Mot de passe actuel
                <input
                  style={inputStyle()}
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mot de passe actuel"
                  autoComplete="current-password"
                />
              </label>

              <label style={labelStyle()}>
                Nouveau mot de passe
                <input
                  style={inputStyle()}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  autoComplete="new-password"
                />
              </label>

              <label style={labelStyle()}>
                Confirmer le nouveau mot de passe
                <input
                  style={inputStyle()}
                  type="password"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  placeholder="Confirmer le nouveau mot de passe"
                  autoComplete="new-password"
                />
              </label>
            </div>

            <div
              style={{
                marginTop: theme.spacing.xl,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button variant="primary" onClick={savePassword} disabled={busy}>
                {busy ? "Enregistrement..." : "Mettre à jour le mot de passe"}
              </Button>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 960px) {
            .account-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

function card(): React.CSSProperties {
  return {
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  };
}

function cardHeader(): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: "grid",
    gap: 6,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: `${theme.spacing.md} ${theme.spacing.md}`,
    border: `1px solid ${theme.colors.border.light}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    backgroundColor: theme.colors.background.primary,
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(0,0,0,0.03)",
  };
}