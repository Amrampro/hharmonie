// client/src/pages/AmbassadorDashboardPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { theme } from "../config/theme";
import { ambassadorsService } from "../services/ambassadorsService";
import { Button } from "../components/Button";

// --- Helpers ---
function money(cents: number, currency = "EUR") {
  const v = (Number(cents || 0) / 100);
  try {
    return new Intl.NumberFormat("fr-BE", { style: "currency", currency }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency}`;
  }
}

// Composant pour copier une valeur (Code Promo / IBAN)
function CopyableField({ label, value, icon }: { label: string, value: string, icon?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
      <span style={{ fontSize: "11px", fontWeight: 700, color: theme.colors.text.light, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </span>
      <div 
        onClick={handleCopy}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          gap: "10px", 
          cursor: "pointer",
          padding: "8px 12px",
          backgroundColor: "#fff",
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${theme.colors.border.light}`,
          transition: "all 0.2s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        }}
      >
        <span style={{ fontFamily: "monospace", fontWeight: "bold", color: theme.colors.text.primary, fontSize: "14px" }}>
          {value || "—"}
        </span>
        <span style={{ fontSize: "16px" }}>{copied ? "✅" : (icon || "📋")}</span>
      </div>
    </div>
  );
}

// Badge de statut pour les commandes
function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || "";
  const isPaid = s === "paid" || s === "completed" || s === "success";
  const isPending = s === "pending" || s === "processing";

  const styles: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 800,
    padding: "3px 10px",
    borderRadius: "20px",
    textTransform: "uppercase",
    display: "inline-block",
    backgroundColor: isPaid ? "#DEF7EC" : isPending ? "#FEF3C7" : "#F3F4F6",
    color: isPaid ? "#03543F" : isPending ? "#92400E" : "#4B5563",
  };

  return <span style={styles}>{status}</span>;
}

export function AmbassadorDashboardPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  const currency = me?.currency || "EUR";

  const totals = useMemo(() => {
    const totalCommission = orders.reduce((s, o) => s + Number(o.ambassador_commission_amount || 0), 0);
    const totalPaid = payouts.reduce((s, p) => s + Number(p.amount || 0), 0);
    const due = Math.max(0, totalCommission - totalPaid);
    return { totalCommission, totalPaid, due };
  }, [orders, payouts]);

  const load = async () => {
    setError(null);
    setBusy(true);
    try {
      const [a, o, p] = await Promise.all([
        ambassadorsService.getMe(),
        ambassadorsService.getMyOrders(),
        ambassadorsService.getMyPayouts()
      ]);
      setMe(a.ambassador);
      setOrders(o.orders || []);
      setPayouts(p.payouts || []);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (busy) return <div style={{ padding: "100px", textAlign: "center", ...theme.body.large }}>Chargement du dashboard...</div>;

  if (error) return (
    <div style={{ padding: theme.spacing["2xl"], textAlign: "center" }}>
      <div style={{ color: theme.colors.error.main, marginBottom: theme.spacing.md }}>{error}</div>
      <Button variant="primary" onClick={load}>Réessayer</Button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.colors.background.primary }}>
      {/* HEADER SECTION */}
      <section style={{
        backgroundColor: theme.colors.background.sage,
        padding: `${theme.spacing.xl} ${theme.spacing.lg}`,
        borderBottom: `1px solid ${theme.colors.border.light}`,
      }}>
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <h1 style={{ ...theme.heading.h2, margin: 0 }}>Espace Ambassadeur</h1>
              <p style={{ ...theme.body.medium, color: theme.colors.text.secondary }}>Bonjour, {me?.first_name || "Partenaire"}</p>
            </div>
            
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <CopyableField label="Code Promo" value={me?.code} icon="🎟️" />
              <CopyableField label="IBAN de Versement" value={me?.iban} icon="🏦" />
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section style={{ padding: `${theme.spacing.xl} ${theme.spacing.lg}` }}>
        <div style={{ maxWidth: theme.container.maxWidth, margin: "0 auto", display: "grid", gap: "32px" }}>
          
          {/* Stats Grid */}
          <div className="stats-grid">
            <Card title="Commissions Totales" value={money(totals.totalCommission, currency)} />
            <Card title="Montant Déjà Payé" value={money(totals.totalPaid, currency)} />
            <Card title="Solde à Recevoir" value={money(totals.due, currency)} highlight />
          </div>

          {/* Orders Table */}
          <div style={panel()}>
            <div style={panelHeader()}>
              <h3 style={{ ...theme.heading.h4, margin: 0 }}>Ventes réalisées</h3>
              <Button variant="outline" onClick={load} size="small">Actualiser</Button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle()}>
                <thead>
                  <tr>
                    <th style={th()}>Réf</th>
                    <th style={th()}>Statut</th>
                    <th style={thRight()}>Montant HT</th>
                    <th style={thRight()}>Commission</th>
                    <th style={th()}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length ? orders.map((o) => (
                    <tr key={o.id}>
                      <td style={tdMono()}>#{o.id.toString().slice(-6)}</td>
                      <td style={td()}><StatusBadge status={o.status} /></td>
                      <td style={tdRight()}>{money(o.total_amount, o.currency)}</td>
                      <td style={tdRight()}><b>{money(o.ambassador_commission_amount, o.currency)}</b></td>
                      <td style={td()}>{o.created_at ? new Date(o.created_at).toLocaleDateString("fr-BE") : "-"}</td>
                    </tr>
                  )) : (
                    <tr><td style={td()} colSpan={5}>Aucune vente pour le moment.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payouts Table */}
          <div style={panel()}>
            <h3 style={{ ...theme.heading.h4, marginBottom: theme.spacing.md }}>Historique des paiements</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle()}>
                <thead>
                  <tr>
                    <th style={th()}>Référence</th>
                    <th style={thRight()}>Montant</th>
                    <th style={th()}>Date</th>
                    <th style={th()}>Note / Libellé</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length ? payouts.map((p) => (
                    <tr key={p.id}>
                      <td style={tdMono()}>{p.id.toString().slice(-8)}</td>
                      <td style={tdRight()}><b>{money(p.amount, p.currency)}</b></td>
                      <td style={td()}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString("fr-BE") : "-"}</td>
                      <td style={{ ...td(), fontStyle: "italic", color: theme.colors.text.light }}>
                        {p.note || "-"}
                      </td>
                    </tr>
                  )) : (
                    <tr><td style={td()} colSpan={4}>Aucun paiement enregistré.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* CSS pour le responsive direct */}
        <style>{`
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          @media (max-width: 850px) {
            .stats-grid { grid-template-columns: 1fr; }
            section { padding: 20px 10px !important; }
          }
        `}</style>
      </section>
    </div>
  );
}

// --- Composants de Style ---

function Card({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      border: `1px solid ${highlight ? theme.colors.primary.main : theme.colors.border.light}`,
      boxShadow: highlight ? "0 4px 12px rgba(0,0,0,0.05)" : "none"
    }}>
      <div style={{ ...theme.body.small, color: theme.colors.text.light, fontWeight: 600 }}>{title}</div>
      <div style={{
        ...theme.heading.h3,
        marginTop: theme.spacing.xs,
        color: highlight ? theme.colors.primary.main : theme.colors.text.primary
      }}>
        {value}
      </div>
    </div>
  );
}

function panel(): React.CSSProperties {
  return {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    border: `1px solid ${theme.colors.border.light}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
  };
}

function panelHeader(): React.CSSProperties {
  return { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.lg, flexWrap: "wrap", gap: "10px" };
}

function tableStyle(): React.CSSProperties {
  return { width: "100%", borderCollapse: "collapse", minWidth: "600px" };
}

function th(): React.CSSProperties {
  return { textAlign: "left", padding: "12px 8px", borderBottom: "2px solid #f1f1f1", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" };
}

function thRight(): React.CSSProperties {
  return { ...th(), textAlign: "right" };
}

function td(): React.CSSProperties {
  return { padding: "14px 8px", borderBottom: "1px solid #f8f8f8", fontSize: 14, color: "#333" };
}

function tdRight(): React.CSSProperties {
  return { ...td(), textAlign: "right", whiteSpace: "nowrap" };
}

function tdMono(): React.CSSProperties {
  return { ...td(), fontFamily: "monospace", fontSize: 12, color: "#666" };
}