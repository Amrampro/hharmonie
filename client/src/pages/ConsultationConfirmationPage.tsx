import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { appointmentService, platformLabels, meetingTypeLabels, type AppointmentConfirmation } from "../services/appointmentService";

export function ConsultationConfirmationPage() {
  const [params, setParams] = useSearchParams();
  const token = params.get("token");
  const session = params.get("session_id");
  const [appointment, setAppointment] = useState<AppointmentConfirmation | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    setError(""); setPending(true);
    const load = async () => {
      try {
        if (session) {
          const result = await appointmentService.paymentStatus(session);
          if (stopped) return;
          if (result.confirmation_url) {
            const url = new URL(result.confirmation_url, window.location.origin);
            setParams(url.searchParams, { replace: true });
            return;
          }
          if (result.payment_status === "expired") throw new Error("Le paiement a expiré. Votre réservation n’est pas confirmée.");
          if (++attempts < 12) { timer = setTimeout(load, 3000); return; }
          throw new Error("Le paiement n’est pas encore confirmé. Vous pouvez actualiser le statut dans quelques instants.");
        }
        if (!token) throw new Error("Utilisez le lien de confirmation de votre réservation.");
        const result = await appointmentService.confirmation(token);
        if (stopped) return;
        if (!["paid", "free"].includes(result.appointment.payment_status || "")) throw new Error("La réservation n’est pas encore confirmée.");
        setAppointment(result.appointment);
        try { sessionStorage.removeItem("appointment_checkout_url"); } catch { /* Optional storage. */ }
        setPending(false);
      } catch (cause) {
        if (!stopped) { setError(cause instanceof Error ? cause.message : "Impossible de charger la confirmation."); setPending(false); }
      }
    };
    void load();
    return () => { stopped = true; clearTimeout(timer); };
  }, [token, session, reload, setParams]);
  const a = appointment;
  return <section className="order-follow-page consultation-confirmation">
    <Helmet><title>Confirmation de consultation — Hormones & Harmonie</title><meta name="robots" content="noindex,nofollow" /><meta name="referrer" content="no-referrer" /></Helmet>
    {pending && <p role="status">Vérification de votre réservation…</p>}
    {error && <p role="alert">{error}</p>}
    {a && <>
      <h1>Merci pour votre réservation !</h1>
      <div className="consultation-confirmation-notice" role="status">{a.confirmation_sent_at ? <>La confirmation de votre consultation a été envoyée à <strong>{a.email}</strong>. Pensez à vérifier vos courriers indésirables.</> : <>Votre consultation est confirmée. L’e-mail à <strong>{a.email}</strong> n’a pas encore pu être envoyé. Vous pouvez réessayer avec « Actualiser la confirmation ».</>}</div>
      <div className="consultation-confirmation-card">
        <h2>{a.service_name}</h2>
        {a.short_description && <p>{a.short_description}</p>}
        {a.description && <p className="whitespace-pre-line">{a.description}</p>}
        <dl className="grid gap-5 sm:grid-cols-2">
          {[
            ["Référence", a.appointment_number], ["Réservation au nom de", `${a.first_name} ${a.last_name}`],
            ["Type de consultation", meetingTypeLabels[a.meeting_type] || a.meeting_type],
            ["Date", new Date(`${a.available_date}T12:00:00Z`).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Brussels" })],
            ["Horaire (heure de Bruxelles)", `${a.start_time.slice(0, 5)} – ${a.end_time.slice(0, 5)}`],
            ["Durée prévue", `${a.duration_minutes} minutes`],
            ["Montant", (Number(a.amount_cents) / 100).toLocaleString("fr-BE", { style: "currency", currency: "EUR" })],
            ["Paiement", a.payment_status === "free" ? "Consultation gratuite" : "Paiement confirmé"],
            ["E-mail", a.email], ["Téléphone", a.phone || "Non renseigné"],
            ["Plateforme souhaitée", platformLabels[a.platform_preference] || platformLabels.default],
          ].map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}
        </dl>
        <div className="mt-6 border-t pt-5"><h3 className="font-semibold">Lien de réunion prévu</h3>
          {a.meeting_url && /^https:\/\//i.test(a.meeting_url) ? <a className="underline break-all" href={a.meeting_url} target="_blank" rel="noopener noreferrer">{a.meeting_url}</a> : <p>Le lien ou les modalités vous seront communiqués par notre équipe.</p>}
          {a.platform_preference !== "default" && <p className="mt-3">Votre préférence a été transmise à notre équipe. Le lien prévu reste valable tant qu’un nouveau lien ne vous a pas été communiqué.</p>}
        </div>
      </div>
    </>}
    <div className="flex flex-wrap gap-4 mt-6"><button type="button" disabled={pending} className="underline" onClick={() => setReload(v => v + 1)}>Actualiser la confirmation</button><Link to="/">Retour à l’accueil</Link></div>
  </section>;
}
