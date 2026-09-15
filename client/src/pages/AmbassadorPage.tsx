// client/src/pages/AmbassadorPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../config/theme";
import { Button } from "../components/Button";
import { ambassadorsService } from "../services/ambassadorsService";

const TOKEN_KEY = "token";

export function AmbassadorPage() {
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [amb, setAmb] = useState<any>(null);
  const [iban, setIban] = useState("");
  const [bankName, setBankName] = useState("");

  const [showAuthModal, setShowAuthModal] = useState(false);

  const ensureAuth = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const load = async () => {
    setErr(null);
    setMsg(null);

    try {
      if (!ensureAuth()) return;

      const res = await ambassadorsService.getMe();
      const ambassador = res?.ambassador || null;

      setAmb(ambassador);
      setIban(ambassador?.iban || "");
      setBankName(ambassador?.bank_account_name || "");
    } catch (e: any) {
      const message = e?.message || "";

      if (
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("invalid token") ||
        message.toLowerCase().includes("access token required") ||
        message.toLowerCase().includes("expired")
      ) {
        setShowAuthModal(true);
        return;
      }

      if (message.toLowerCase().includes("not found")) {
        setAmb(null);
        setIban("");
        setBankName("");
        return;
      }

      setErr(message || "Erreur de chargement ambassadeur");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validateBankFields = () => {
    if (!iban.trim() || !bankName.trim()) {
      throw new Error(
        "Les champs IBAN et Banque / titulaire sont obligatoires.",
      );
    }
  };

  const createAmbassador = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      if (!ensureAuth()) return;

      validateBankFields();

      const r = await ambassadorsService.register({
        iban: iban.trim(),
        bank_account_name: bankName.trim(),
      });

      setAmb(r?.ambassador || null);
      setMsg("Compte ambassadeur créé.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Erreur création ambassadeur");
    } finally {
      setBusy(false);
    }
  };

  const saveAmbassadorBank = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);

    try {
      if (!ensureAuth()) return;

      validateBankFields();

      await ambassadorsService.updateBank({
        iban: iban.trim(),
        bank_account_name: bankName.trim(),
      });

      setMsg("Informations bancaires mises à jour.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Erreur mise à jour ambassadeur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${theme.colors.background.primary} 0%, ${theme.colors.background.secondary} 100%)`,
      }}
    >
      {showAuthModal && (
        <AuthRequiredModal
          onConfirm={() => navigate("/auth")}
        />
      )}

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
            <h1 style={{ ...theme.heading.h2, margin: 0 }}>
              Espace ambassadeur
            </h1>
            <div
              style={{
                ...theme.body.base,
                color: theme.colors.text.secondary,
                marginTop: 6,
              }}
            >
              Activez votre compte ambassadeur et gérez vos informations
              bancaires.
            </div>
          </div>

          <div
            style={{ display: "flex", gap: theme.spacing.sm, flexWrap: "wrap" }}
          >
            <Button variant="outline" onClick={() => navigate("/account")}>
              Retour à mon compte
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
              <div
                style={{ color: theme.colors.error.main, ...theme.body.base }}
              >
                {err}
              </div>
            )}
            {msg && (
              <div
                style={{ color: theme.colors.primary.main, ...theme.body.base }}
              >
                {msg}
              </div>
            )}
          </div>
        )}

        <div style={card()}>
          <div style={cardHeader()}>
            <div>
              <h3 style={{ ...theme.heading.h4, margin: 0 }}>Ambassadeur</h3>
              <div
                style={{
                  ...theme.body.base,
                  color: theme.colors.text.secondary,
                  marginTop: 6,
                }}
              >
                Les champs <b>IBAN</b> et <b>Banque / titulaire</b> sont
                obligatoires.
              </div>
            </div>
          </div>

          {amb ? (
            <>
              <Button
                style={{
                  background: "blue",
                  padding: 15,
                  color: "white",
                  borderRadius: 15,
                }}
                onClick={() => navigate("/ambassador-dashboard")}
              >
                Accéder à mon Tableau de bord Ambassadeur
              </Button>

              <div
                style={{
                  marginTop: theme.spacing.lg,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  border: `1px solid ${theme.colors.border.light}`,
                  backgroundColor: theme.colors.background.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: theme.spacing.md,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ ...theme.body.base }}>
                  Code :
                  <span
                    style={{
                      marginLeft: 8,
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}
                  >
                    {amb.code}
                  </span>
                </div>

                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    border: `1px solid ${theme.colors.border.light}`,
                    backgroundColor: theme.colors.background.secondary,
                  }}
                >
                  Actif
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: theme.spacing.md,
                  marginTop: theme.spacing.lg,
                }}
              >
                <label style={labelStyle()}>
                  IBAN *
                  <input
                    style={inputStyle()}
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="IBAN"
                  />
                </label>

                <label style={labelStyle()}>
                  Banque / Titulaire *
                  <input
                    style={inputStyle()}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Nom de banque / titulaire"
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
                <Button
                  variant="primary"
                  onClick={saveAmbassadorBank}
                  disabled={busy}
                >
                  {busy ? "Enregistrement..." : "Mettre à jour"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  ...theme.body.base,
                  color: "red",
                  marginTop: theme.spacing.lg,
                }}
              >
                Vous n’avez pas encore de compte ambassadeur. Complétez les
                champs ci-dessous pour l’activer !
              </div>

              <div
                style={{
                  display: "grid",
                  gap: theme.spacing.md,
                  marginTop: theme.spacing.lg,
                }}
              >
                <label style={labelStyle()}>
                  IBAN *
                  <input
                    style={inputStyle()}
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="IBAN"
                  />
                </label>

                <label style={labelStyle()}>
                  Banque / Titulaire *
                  <input
                    style={inputStyle()}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Nom de banque / titulaire"
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
                <Button
                  variant="primary"
                  onClick={createAmbassador}
                  disabled={busy}
                >
                  {busy ? "Création..." : "Créer mon compte ambassadeur"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthRequiredModal({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,

        /* overlay sombre */
        backgroundColor: "rgba(0,0,0,0.35)",

        /* BLUR derrière */
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: theme.spacing.lg,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: theme.colors.background.primary,
          borderRadius: theme.borderRadius.xl,
          border: `1px solid ${theme.colors.border.light}`,
          boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: theme.spacing.xl,
            borderBottom: `1px solid ${theme.colors.border.light}`,
            background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.primary} 100%)`,
          }}
        >
          <h3
            style={{
              ...theme.heading.h3,
              margin: 0,
              color: theme.colors.text.primary,
            }}
          >
            Connexion requise
          </h3>
        </div>

        <div style={{ padding: theme.spacing.xl }}>
          <p
            style={{
              ...theme.body.base,
              color: theme.colors.text.secondary,
              lineHeight: 1.7,
              marginTop: 0,
            }}
          >
            Vous devez être <b>connecté à la plateforme</b> pour pouvoir accéder
            à cette section ambassadeur.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: theme.spacing.xl,
            }}
          >
            <Button variant="primary" onClick={onConfirm}>
              Me connecter / créer un compte
            </Button>
          </div>
        </div>
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
    flexWrap: "wrap",
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