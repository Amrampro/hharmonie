// client/src/pages/admin/AdminAmbassadorsPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { theme } from "../../config/theme";
import { ambassadorsService } from "../../services/ambassadorsService";
import { Button } from "../../components/Button";

function money(cents: number, currency = "EUR") {
  const v = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat("fr-BE", { style: "currency", currency }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency}`;
  }
}

export function AdminAmbassadorsPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [payModal, setPayModal] = useState<{ open: boolean; amb: any | null }>({ open: false, amb: null });
  const [payAmountEur, setPayAmountEur] = useState<string>("");
  const [payNote, setPayNote] = useState<string>("");
  const [paying, setPaying] = useState(false);
  const paymentPending = useRef(false);

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await ambassadorsService.adminList({ search, limit: 100, offset: 0 });
      setRows(data.ambassadors || []);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalDue = useMemo(() => rows.reduce((s, a) => s + Number(a.due_amount || 0), 0), [rows]);

  const openPay = (amb: any) => {
    setPayModal({ open: true, amb });
    setPayAmountEur(((Number(amb.due_amount || 0) / 100) || 0).toFixed(2)); // pré-rempli au max
    setPayNote("");
  };

  const closePay = () => setPayModal({ open: false, amb: null });

  const submitPay = async () => {
    if (paymentPending.current) return;
    const amb = payModal.amb;
    if (!amb?.id) return;

    const eur = Number(payAmountEur);
    if (!Number.isFinite(eur) || eur <= 0) return alert("Montant invalide");

    const amount = Math.round(eur * 100);
    paymentPending.current = true;
    setPaying(true);

    try {
      const result = await ambassadorsService.adminPay(amb.id, { amount, note: payNote || undefined });
      closePay();
      await load();
      alert(result.warning || "Paiement enregistré.");
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Erreur paiement");
    } finally {
      paymentPending.current = false;
      setPaying(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.colors.background.primary }}>
      <div style={{ padding: theme.spacing["2xl"] }}>
        <h1 style={{ ...theme.heading.h2 }}>Ambassadeurs</h1>

        <div style={{ display: "flex", gap: theme.spacing.md, alignItems: "center", marginTop: theme.spacing.md }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche (code, email, nom)"
            style={inputStyle()}
          />
          <Button variant="primary" onClick={load} disabled={busy}>Rechercher</Button>
        </div>

        <div style={{ marginTop: theme.spacing.lg, ...theme.body.small, color: theme.colors.text.light }}>
          Total dû (tous ambassadeurs) : <b>{money(totalDue, "EUR")}</b>
        </div>

        {error && <div style={{ marginTop: theme.spacing.md, color: theme.colors.error.main }}>{error}</div>}

        <div style={{
          marginTop: theme.spacing.lg,
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.border.light}`,
          overflowX: "auto",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th()}>Code</th>
                <th style={th()}>Ambassadeur</th>
                <th style={th()}>Email</th>
                <th style={th()}>IBAN</th>
                <th style={thRight()}>Dû</th>
                <th style={th()}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td style={tdMono()}>{a.code}</td>
                  <td style={td()}>{a.first_name} {a.last_name}</td>
                  <td style={td()}>{a.email}</td>
                  <td style={tdMono()}>{a.iban || "-"}</td>
                  <td style={tdRight()}><b>{money(a.due_amount, "EUR")}</b></td>
                  <td style={td()}>
                    <Button variant="primary" onClick={() => openPay(a)} disabled={Number(a.due_amount || 0) <= 0}>
                      Payer
                    </Button>
                  </td>
                </tr>
              ))}
              {!rows.length && !busy && (
                <tr><td style={td()} colSpan={6}>Aucun ambassadeur.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal paiement */}
        {payModal.open && payModal.amb && (
          <div style={modalBackdrop()}>
            <div style={modalCard()}>
              <h3 style={{ ...theme.heading.h4, marginTop: 0 }}>Payer {payModal.amb.code}</h3>
              <div style={{ ...theme.body.small, color: theme.colors.text.light }}>
                Dû : <b>{money(payModal.amb.due_amount, "EUR")}</b>
              </div>

              <div style={{ marginTop: theme.spacing.md, display: "grid", gap: theme.spacing.md }}>
                <input
                  value={payAmountEur}
                  onChange={(e) => setPayAmountEur(e.target.value)}
                  placeholder="Montant en EUR (ex: 25.50)"
                  style={inputStyle()}
                />
                <input
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Note (optionnel)"
                  style={inputStyle()}
                />
              </div>

              <div style={{ display: "flex", gap: theme.spacing.md, justifyContent: "flex-end", marginTop: theme.spacing.lg }}>
                <Button variant="outline" onClick={closePay} disabled={paying}>Annuler</Button>
                <Button variant="primary" onClick={submitPay} disabled={paying}>{paying ? "Enregistrement…" : "Valider paiement"}</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: `${theme.spacing.md} ${theme.spacing.md}`,
    border: `1px solid ${theme.colors.border.main}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    backgroundColor: theme.colors.background.primary,
    outline: "none",
  };
}

function th(): React.CSSProperties {
  return { textAlign: "left", padding: "12px 10px", borderBottom: "1px solid #eee", fontSize: 12, color: "#555", textTransform: "uppercase" };
}
function thRight(): React.CSSProperties { return { ...th(), textAlign: "right" }; }
function td(): React.CSSProperties { return { padding: "12px 10px", borderBottom: "1px solid #f1f1f1", fontSize: 14, color: "#333" }; }
function tdRight(): React.CSSProperties { return { ...td(), textAlign: "right", whiteSpace: "nowrap" }; }
function tdMono(): React.CSSProperties { return { ...td(), fontFamily: "monospace", fontSize: 12 }; }

function modalBackdrop(): React.CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 1000,
  };
}
function modalCard(): React.CSSProperties {
  return {
    width: "min(520px, 100%)",
    background: "#fff",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 12px 40px rgba(0,0,0,.18)",
  };
}
