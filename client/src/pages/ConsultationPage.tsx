import { useEffect, useMemo, useRef, useState } from "react";
import { ConsultationQuestionnaire, emptyConsultationForm } from "../components/ConsultationQuestionnaire";
import { CalendarDays, Clock, Monitor, Phone, MapPin } from "lucide-react";
import { Button } from "../components/Button";
import { appointmentService, type AppointmentService, type AppointmentSlot } from "../services/appointmentService";

const typeIcon = { online: Monitor, physical: MapPin, phone: Phone, hybrid: CalendarDays };

export function ConsultationPage() {
  const [services, setServices] = useState<AppointmentService[]>([]);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyConsultationForm);
  const [documents, setDocuments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const submissionPending = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (params.get("payment") === "cancelled") {
      setError("Paiement interrompu : le rendez-vous n’est pas confirmé. Le créneau sera libéré à l’expiration du paiement (environ 30 minutes).");
      try { setCheckoutUrl(sessionStorage.getItem("appointment_checkout_url") || ""); } catch { /* Storage is optional. */ }
    }
    if (!sessionId) return;
    let cancelled = false;
    setCheckingPayment(true);
    appointmentService.paymentStatus(sessionId).then(result => {
      if (cancelled) return;
      if (result.payment_status === "paid") {
        setSuccess(`Paiement reçu. Rendez-vous confirmé. Référence : ${result.appointment_number}`);
        try { sessionStorage.removeItem("appointment_checkout_url"); } catch { /* Storage is optional. */ }
      } else if (result.payment_status === "expired") setError("Ce paiement a expiré. Choisissez un nouveau créneau pour réserver.");
      else { setError("Le paiement n’est pas encore confirmé. Vous pouvez reprendre le paiement ou actualiser cette page."); setCheckoutUrl(result.checkout_url || ""); }
    }).catch(cause => { if (!cancelled) setError(cause.message); }).finally(() => { if (!cancelled) setCheckingPayment(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    Promise.all([appointmentService.listServices(), appointmentService.listSlots()])
      .then(([servicesResp, slotsResp]) => {
        const loadedServices = servicesResp.services || [];
        setServices(loadedServices);
        setSlots(slotsResp.slots || []);
        setSelectedService(loadedServices[0]?.id || "");
      })
      .catch(() => setError("Impossible de charger les créneaux pour le moment."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedService) return;
    let cancelled = false;
    setSlots([]);
    appointmentService.listSlots({ serviceId: selectedService })
      .then((resp) => { if (!cancelled) setSlots(resp.slots || []); })
      .catch(() => { if (!cancelled) setError("Impossible de charger les créneaux pour cet accompagnement."); });
    return () => { cancelled = true; };
  }, [selectedService]);

  const selectedServiceData = useMemo(
    () => services.find((service) => service.id === selectedService),
    [selectedService, services]
  );

  const availableSlots = slots.filter((slot) => slot.status === "available" && slot.service_id === selectedService);

  const selectedPrice = Number(availableSlots.find(slot => slot.id === selectedSlot)?.price ?? 0);
  const euros = (value: number) => Number(value).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionPending.current) return;
    setSuccess("");
    setError("");
    if (!selectedService || !availableSlots.some((slot) => slot.id === selectedSlot)) {
      setError("Choisissez un accompagnement et un créneau.");
      return;
    }
    if (!form.consultation_reasons.length) return setError("Sélectionnez au moins un motif de consultation.");
    submissionPending.current = true;
    setSubmitting(true);
    try {
      const resp = await appointmentService.book({
        service_id: selectedService,
        slot_id: selectedSlot,
        ...form,
        age: Number(form.age),
        baby_project: form.baby_project === "yes",
        consulted_professional: form.consulted_professional === "yes",
        has_diagnosis: form.has_diagnosis === "yes",
      }, documents);
      if (resp.checkout_url) {
        try { sessionStorage.setItem("appointment_checkout_url", resp.checkout_url); } catch { /* Checkout works without storage. */ }
        window.location.assign(resp.checkout_url);
        return;
      }
      setSuccess(`Rendez-vous confirmé. Référence : ${resp.appointment_number}`);
      setSelectedSlot("");
      setForm(emptyConsultationForm());
      setDocuments([]);
      setSlots((current) => current.filter((slot) => slot.id !== selectedSlot));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’enregistrer le rendez-vous.");
    } finally {
      submissionPending.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section className="hh-consultation">
      <div className="hh-page-intro">
        <span>Consultation</span>
        <h1>Réserver un accompagnement</h1>
        <p>
          Choisissez votre accompagnement et un créneau, puis complétez le questionnaire
          pour nous aider à préparer votre consultation.
        </p>
      </div>

      {checkingPayment && <p role="status">Vérification du paiement…</p>}
      {success && <p role="status" className="hh-success">{success}</p>}
      {error && <p role="alert" className="hh-error">{error}</p>}
      {checkoutUrl && <p><a href={checkoutUrl} className="underline">Reprendre le paiement</a></p>}
      {loading ? (
        <p>Chargement des disponibilités...</p>
      ) : (
        <div className="hh-consultation-grid">
          <aside>
            <h2>Accompagnements</h2>
            {services.map((service) => {
              const Icon = typeIcon[service.meeting_type] || CalendarDays;
              return (
                <button
                  key={service.id}
                  disabled={submitting}
                  className={selectedService === service.id ? "is-active" : ""}
                  onClick={() => {
                    setSelectedService(service.id);
                    setSelectedSlot("");
                  }}
                >
                  <Icon size={20} />
                  <strong>{service.name}</strong>
                  <small>{service.duration_minutes} min · Prix selon le créneau</small>
                  <span>{service.short_description}</span>
                </button>
              );
            })}
          </aside>

          <form onSubmit={submit}>
            <h2>{selectedServiceData?.name || "Votre rendez-vous"}</h2>
            <fieldset disabled={submitting} className="consultation-fields">
            <div className="slot-grid">
              {availableSlots.length ? availableSlots.map((slot) => (
                <button
                  type="button"
                  key={slot.id}
                  className={selectedSlot === slot.id ? "is-active" : ""}
                  onClick={() => setSelectedSlot(slot.id)}
                >
                  <CalendarDays size={18} />
                  <span>{new Date(slot.available_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
                  <Clock size={18} />
                  <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                  <strong>{Number(slot.price) === 0 ? "Gratuit · 0 €" : euros(slot.price)}</strong>
                </button>
              )) : <p>Aucun créneau disponible pour cet accompagnement.</p>}
            </div>

            <div className="form-grid">
              <label>Prénom *<input required autoComplete="given-name" maxLength={100} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></label>
              <label>Nom *<input required autoComplete="family-name" maxLength={100} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></label>
              <label>E-mail *<input required type="email" autoComplete="email" maxLength={190} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label>Téléphone<input type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            </div>
            <ConsultationQuestionnaire form={form} setForm={setForm} documents={documents} setDocuments={setDocuments} onError={setError} />
            </fieldset>
            {selectedSlot && <p>{selectedPrice === 0 ? "Cette consultation est gratuite. Votre réservation sera confirmée immédiatement." : `Montant à payer : ${euros(selectedPrice)}. La réservation sera confirmée après paiement.`}</p>}
            <Button type="submit" size="large" disabled={submitting || checkingPayment || !selectedSlot}>{submitting ? "Enregistrement…" : selectedSlot && selectedPrice > 0 ? `Payer ${euros(selectedPrice)} et réserver` : "Réserver gratuitement"}</Button>
          </form>
        </div>
      )}
    </section>
  );
}
