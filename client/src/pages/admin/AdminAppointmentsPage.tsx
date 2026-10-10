import { useAdminAction } from "../../hooks/useAdminAction";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, Plus, Trash2, Pencil, Save } from "lucide-react";
import { appointmentService, consultationReasonLabels, platformLabels, meetingTypeLabels, type Appointment, type AppointmentService, type AppointmentSlot } from "../../services/appointmentService";

const emptyService = () => ({ name: "", short_description: "", description: "", duration_minutes: 60, meeting_type: "online" as AppointmentService["meeting_type"] });
const statuses: Record<string, string> = { available: "Disponible", booked: "Réservé", blocked: "Bloqué", confirmed: "Confirmée", pending_payment: "Paiement en attente", payment_expired: "Paiement expiré", completed: "Terminée", cancelled_by_client: "Annulée par le client", cancelled_by_admin: "Annulée", no_show: "Absence" };
const yesNo = (value: boolean | number | null) => value == null ? "Non renseigné" : value === true || value === 1 ? "Oui" : "Non";

export default function AdminAppointmentsPage() {
  const { error, busy, run } = useAdminAction();
  const [services, setServices] = useState<AppointmentService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [slotLinks, setSlotLinks] = useState<Record<string, string>>({});
  const [slotPrices, setSlotPrices] = useState<Record<string, string>>({});
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const serviceFormRef = useRef<HTMLFormElement>(null);
  const editService = (service: AppointmentService) => {
    setEditingService(service.id); setNotice("");
    setServiceForm({ name: service.name, short_description: service.short_description || "", description: service.description || "", duration_minutes: service.duration_minutes, meeting_type: service.meeting_type });
    serviceFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    serviceFormRef.current?.querySelector("input")?.focus({ preventScroll: true });
  };
  const [slotForm, setSlotForm] = useState({ service_id: "", available_date: "", start_time: "09:00", end_time: "10:00", status: "available", price: 0, meeting_url: "" });

  const load = async () => {
    const [serviceResp, appointmentResp, slotResp] = await Promise.all([
      appointmentService.adminListServices(),
      appointmentService.adminListAppointments(),
      appointmentService.listSlots(),
    ]);
    const loadedServices = serviceResp.services || [];
    setServices(loadedServices);
    setAppointments(appointmentResp.appointments || []);
    setSlots(slotResp.slots || []);
    setSlotLinks(Object.fromEntries((slotResp.slots || []).map(slot => [slot.id, slot.meeting_url || ""])));
    setSlotPrices(Object.fromEntries((slotResp.slots || []).map(slot => [slot.id, String(slot.price)])));
    setSlotForm((current) => ({ ...current, service_id: current.service_id || loadedServices[0]?.id || "" }));
  };

  useEffect(() => {
    void run(load);
  }, []);

  const createService = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      if (editingService) await appointmentService.adminUpdateService(editingService, serviceForm);
      else await appointmentService.adminCreateService(serviceForm);
      setNotice(editingService ? "Consultation modifiée. Le texte est maintenant à jour sur le site." : "Consultation créée. Vous pouvez maintenant ajouter ses créneaux.");
      setEditingService(null); setServiceForm(emptyService());
      await load();
    });
  };

  const createSlot = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      if (slotForm.end_time <= slotForm.start_time) throw new Error("L’heure de fin doit être après l’heure de début.");
      await appointmentService.adminCreateSlot(slotForm);
      setNotice("Créneau créé.");
      await load();
    });
  };

  const deleteSlot = async (id: string) => {
    if (!window.confirm("Supprimer ce créneau disponible ?")) return;
    await run(async () => {
      await appointmentService.adminDeleteSlot(id);
      await load();
    });
  };

  return (
    <div className="space-y-8 admin-appointments">
      {notice && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{notice}</p>}
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-slate-400 uppercase">Consultations</span>
          <h1 className="text-3xl font-bold text-slate-900">Rendez-vous H&H</h1>
        </div>
      </div>

      <nav aria-label="Sections des rendez-vous" className="flex flex-wrap gap-3">
        <a href="#consultations" className="rounded-full border bg-white px-4 py-2">1. Consultations</a>
        <a href="#creneaux" className="rounded-full border bg-white px-4 py-2">2. Créneaux</a>
        <a href="#reservations" className="rounded-full border bg-white px-4 py-2">3. Réservations</a>
      </nav>
      <section id="consultations" className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm scroll-mt-6">
        <h2 className="text-xl font-semibold">1. Vos consultations</h2>
        <p className="mt-2 mb-5 text-slate-500">Choisissez « Modifier » pour corriger une consultation existante. Le prix payé se règle dans les créneaux, plus bas.</p>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-3">{services.map(service => <article key={service.id} className={`rounded-xl border p-4 ${editingService === service.id ? "border-[#A47788] bg-[#faf5f7]" : "border-slate-200"}`}>
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{service.name}</h3><p className="text-sm text-slate-500">{service.duration_minutes} min · {meetingTypeLabels[service.meeting_type]}</p></div>
            <button type="button" disabled={busy} onClick={() => editService(service)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2"><Pencil size={16} /> Modifier</button></div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600">{service.short_description || "Aucun texte de présentation."}</p>
          </article>)}{!services.length && <p>Aucune consultation. Créez votre première consultation avec le formulaire.</p>}</div>
          <form ref={serviceFormRef} onSubmit={createService} className="rounded-xl bg-slate-50 border p-5">
            <h3 className="mb-4 text-lg font-semibold">{editingService ? `Modifier « ${services.find(s => s.id === editingService)?.name || "la consultation"} »` : "Ajouter une consultation"}</h3>
            <fieldset disabled={busy} className="grid gap-4">
              <label>Nom de la consultation *<input required maxLength={190} value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} /></label>
              <label>Texte de présentation affiché sur le site<textarea rows={7} maxLength={500} value={serviceForm.short_description} onChange={e => setServiceForm({ ...serviceForm, short_description: e.target.value })} /><small>{serviceForm.short_description.length}/500 caractères</small></label>
              <label>Description complémentaire<textarea rows={5} maxLength={10000} value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} /><small>Précisions affichées pour la consultation sélectionnée et dans sa confirmation.</small></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>Durée (minutes) *<input required type="number" min="1" max="1440" value={serviceForm.duration_minutes} onChange={e => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })} /></label>
                <label>Format<select value={serviceForm.meeting_type} onChange={e => setServiceForm({ ...serviceForm, meeting_type: e.target.value as AppointmentService["meeting_type"] })}>{Object.entries(meetingTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A47788] px-4 py-3 font-semibold text-white">{editingService ? <Save size={18} /> : <Plus size={18} />}{busy ? "Enregistrement…" : editingService ? "Enregistrer les modifications" : "Créer la consultation"}</button>
              {editingService && <button type="button" className="rounded-lg border px-4 py-2" onClick={() => { setEditingService(null); setServiceForm(emptyService()); }}>Annuler la modification</button>}
            </fieldset>
          </form>
        </div>
      </section>
      <section id="creneaux" className="scroll-mt-6 space-y-5">
        <h2 className="text-xl font-semibold">2. Créneaux et tarifs</h2>
        <p className="text-slate-500">Ajoutez une date à une consultation, puis définissez son tarif et son lien de réunion.</p>
        <form onSubmit={createSlot} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Ajouter un créneau</h2>
          <fieldset disabled={busy} className="grid gap-4">
            <label>Consultation *<select required value={slotForm.service_id} onChange={(e) => setSlotForm({ ...slotForm, service_id: e.target.value })}>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select></label>
            <div className="grid sm:grid-cols-3 gap-3">
<label>Date *<input required type="date" value={slotForm.available_date} onChange={(e) => setSlotForm({ ...slotForm, available_date: e.target.value })} /></label>
<label>Heure de début *<input required type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} /></label>
<label>Heure de fin *<input required type="time" value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })} /></label>
            </div>
            <label>Lien de réunion par défaut<input type="url" maxLength={1000} placeholder="https://meet.google.com/..." value={slotForm.meeting_url} onChange={e => setSlotForm({ ...slotForm, meeting_url: e.target.value })} className="block w-full border rounded-lg px-3 py-2" /></label>
            <label>Prix du créneau (€) — 0 pour une consultation gratuite<input required type="number" min="0" max="999999.99" step="0.01" value={slotForm.price} onChange={e => setSlotForm({ ...slotForm, price: Number(e.target.value) })} /></label>
            <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A47788] px-4 py-3 font-semibold text-white">
              <CalendarDays size={18} /> Créer le créneau
            </button>
          </fieldset>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Créneaux à venir</h2>
        <div className="grid gap-3">
          {slots.map(slot => <form key={slot.id} className="rounded-xl border border-slate-200 p-4" onSubmit={e => {
            e.preventDefault(); void run(async () => {
              await appointmentService.adminUpdateSlot(slot.id, { price: Number(slotPrices[slot.id]), meeting_url: slotLinks[slot.id] || null });
              setNotice("Créneau mis à jour."); await load();
            });
          }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h3 className="font-semibold">{slot.service_name}</h3><p className="text-sm text-slate-500">{new Date(slot.available_date).toLocaleDateString("fr-FR")} · {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{statuses[slot.status] || slot.status}</span></div>
            <fieldset disabled={busy || slot.status === "booked"} className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <label>Prix (€)<input required type="number" min="0" max="999999.99" step="0.01" value={slotPrices[slot.id] ?? ""} onChange={e => setSlotPrices(current => ({ ...current, [slot.id]: e.target.value }))} /></label>
              <label>Lien de réunion<input type="url" maxLength={1000} value={slotLinks[slot.id] || ""} onChange={e => setSlotLinks(current => ({ ...current, [slot.id]: e.target.value }))} /></label>
              <div className="sm:col-span-2 flex flex-wrap gap-3"><button className="rounded-lg bg-[#A47788] px-4 py-2 text-white">Enregistrer le créneau</button><button type="button" onClick={() => deleteSlot(slot.id)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-red-600"><Trash2 size={16} /> Supprimer</button></div>
            </fieldset>
            {slot.status === "booked" && <p className="mt-3 text-sm text-slate-500">Ce créneau est réservé : son tarif et son lien ne sont plus modifiables.</p>}
          </form>)}
          {!slots.length && <p className="text-slate-500">Aucun créneau à venir.</p>}
        </div>
      </section>

      <section id="reservations" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm scroll-mt-6">
        <h2 className="mb-4 text-xl font-semibold">3. Réservations reçues</h2>
        <div className="grid gap-3">
          {appointments.map((appointment) => (
            <details key={appointment.id} className="rounded-lg border border-slate-200 p-4">
              <summary className="cursor-pointer space-y-1">
                <strong>{appointment.first_name} {appointment.last_name}</strong>
                <span className="ml-3">{appointment.service_name} — {new Date(appointment.available_date).toLocaleDateString("fr-FR")} {appointment.start_time.slice(0, 5)}</span>
                <span className="block break-all text-sm text-slate-500">{appointment.appointment_number} · {statuses[appointment.status] || appointment.status}</span>
              </summary>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  ["Montant", appointment.amount_cents == null ? "Ancienne réservation" : (appointment.amount_cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })],
                  ["Paiement", ({ free: "Gratuit", pending: "En attente de paiement", paid: "Payé", expired: "Paiement expiré" } as Record<string, string>)[appointment.payment_status || ""] || "Ancienne réservation"],
                  ["Plateforme souhaitée", platformLabels[appointment.platform_preference] || "Maintenir le lien par défaut"],
                  ["Lien de réunion prévu", appointment.meeting_url],
                  ["E-mail", appointment.email], ["Téléphone", appointment.phone],
                  ["1. Vous êtes", appointment.gender === "female" ? "Femme" : appointment.gender === "male" ? "Homme" : null],
                  ["2. Âge", appointment.age == null ? null : `${appointment.age} ans`],
                  ["3. Projet bébé", yesNo(appointment.baby_project)],
                  ["4. Préoccupation principale", appointment.main_concern],
                  ["5. Professionnel de santé déjà consulté", yesNo(appointment.consulted_professional)],
                  ["6. Examens déjà réalisés", appointment.exams_description],
                  ["7. Diagnostic reçu", yesNo(appointment.has_diagnosis)],
                  ["Précisions sur le diagnostic", appointment.diagnosis_details],
                  ["8. Motifs de consultation", (appointment.consultation_reasons ?? []).map((reason) => consultationReasonLabels[reason] || reason).join("\n")],
                  ["Autre motif", appointment.consultation_reason_other],
                  ...(appointment.message ? [["Message (ancien formulaire)", appointment.message]] : []),
                ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="font-semibold text-slate-700">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-slate-600">{value || "Non renseigné"}</dd></div>)}
              </dl>
              <div className="mt-5 border-t pt-4">
                <h3 className="font-semibold">Documents d’examens</h3>
                {appointment.documents?.length ? <ul className="mt-2 space-y-2">{appointment.documents.map((document) => <li key={document.id}>
                  <button type="button" disabled={busy} className="break-all text-left text-indigo-700 underline" onClick={() => run(() => appointmentService.adminDownloadDocument(document))}>Télécharger {document.original_name}</button>
                  <span className="ml-2 text-sm text-slate-500">({Math.ceil(document.size_bytes / 1024)} Ko)</span>
                </li>)}</ul> : <p className="mt-1 text-slate-500">Aucun document joint.</p>}
              </div>
            </details>
          ))}
          {!appointments.length && <p className="text-slate-500">Aucune réservation pour le moment.</p>}
        </div>
      </section>
    </div>
  );
}
