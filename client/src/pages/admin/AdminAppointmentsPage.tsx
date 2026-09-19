import { useAdminAction } from "../../hooks/useAdminAction";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { appointmentService, consultationReasonLabels, type Appointment, type AppointmentService, type AppointmentSlot } from "../../services/appointmentService";

const yesNo = (value: boolean | number | null) => value == null ? "Non renseigné" : value === true || value === 1 ? "Oui" : "Non";

export default function AdminAppointmentsPage() {
  const { error, busy, run } = useAdminAction();
  const [services, setServices] = useState<AppointmentService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [serviceForm, setServiceForm] = useState({ name: "", short_description: "", duration_minutes: 60, price: 65, meeting_type: "online" });
  const [slotForm, setSlotForm] = useState({ service_id: "", available_date: "", start_time: "09:00", end_time: "10:00", status: "available" });

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
    setSlotForm((current) => ({ ...current, service_id: current.service_id || loadedServices[0]?.id || "" }));
  };

  useEffect(() => {
    void run(load);
  }, []);

  const createService = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      await appointmentService.adminCreateService(serviceForm as any);
      setServiceForm({ name: "", short_description: "", duration_minutes: 60, price: 65, meeting_type: "online" });
      await load();
    });
  };

  const createSlot = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      await appointmentService.adminCreateSlot(slotForm);
      await load();
    });
  };

  const deleteSlot = async (id: string) => {
    await run(async () => {
      await appointmentService.adminDeleteSlot(id);
      await load();
    });
  };

  return (
    <div className="space-y-8">
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-sm font-semibold text-slate-400 uppercase">Consultations</span>
          <h1 className="text-3xl font-bold text-slate-900">Rendez-vous H&H</h1>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={createService} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Ajouter un accompagnement</h2>
          <div className="grid gap-3">
            <input required placeholder="Nom" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
            <textarea placeholder="Description courte" value={serviceForm.short_description} onChange={(e) => setServiceForm({ ...serviceForm, short_description: e.target.value })} />
            <div className="grid grid-cols-3 gap-3">
              <input type="number" min="15" value={serviceForm.duration_minutes} onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })} />
              <input type="number" min="0" step="0.01" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })} />
              <select value={serviceForm.meeting_type} onChange={(e) => setServiceForm({ ...serviceForm, meeting_type: e.target.value })}>
                <option value="online">En ligne</option>
                <option value="physical">Présentiel</option>
                <option value="phone">Téléphone</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>
            <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C99A32] px-4 py-3 font-semibold text-white">
              <Plus size={18} /> Ajouter
            </button>
          </div>
        </form>

        <form onSubmit={createSlot} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Ajouter un créneau</h2>
          <div className="grid gap-3">
            <select required value={slotForm.service_id} onChange={(e) => setSlotForm({ ...slotForm, service_id: e.target.value })}>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-3">
              <input required type="date" value={slotForm.available_date} onChange={(e) => setSlotForm({ ...slotForm, available_date: e.target.value })} />
              <input required type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} />
              <input required type="time" value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })} />
            </div>
            <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A47788] px-4 py-3 font-semibold text-white">
              <CalendarDays size={18} /> Créer le créneau
            </button>
          </div>
        </form>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Créneaux à venir</h2>
        <div className="grid gap-3">
          {slots.map((slot) => (
            <div key={slot.id} className="grid items-center gap-3 rounded-lg border border-slate-100 p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <strong>{slot.service_name}</strong>
              <span>{new Date(slot.available_date).toLocaleDateString("fr-FR")}</span>
              <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)} | {slot.status}</span>
              <button disabled={busy} type="button" onClick={() => deleteSlot(slot.id)} className="inline-flex items-center justify-center rounded-lg border p-2 text-red-600">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Réservations reçues</h2>
        <div className="grid gap-3">
          {appointments.map((appointment) => (
            <details key={appointment.id} className="rounded-lg border border-slate-200 p-4">
              <summary className="cursor-pointer space-y-1">
                <strong>{appointment.first_name} {appointment.last_name}</strong>
                <span className="ml-3">{appointment.service_name} — {new Date(appointment.available_date).toLocaleDateString("fr-FR")} {appointment.start_time.slice(0, 5)}</span>
                <span className="block break-all text-sm text-slate-500">{appointment.appointment_number} · {appointment.status}</span>
              </summary>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
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
