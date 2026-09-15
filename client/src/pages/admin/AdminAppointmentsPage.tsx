import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { appointmentService, type Appointment, type AppointmentService, type AppointmentSlot } from "../../services/appointmentService";

export default function AdminAppointmentsPage() {
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
    void load();
  }, []);

  const createService = async (event: FormEvent) => {
    event.preventDefault();
    await appointmentService.adminCreateService(serviceForm as any);
    setServiceForm({ name: "", short_description: "", duration_minutes: 60, price: 65, meeting_type: "online" });
    await load();
  };

  const createSlot = async (event: FormEvent) => {
    event.preventDefault();
    await appointmentService.adminCreateSlot(slotForm);
    await load();
  };

  const deleteSlot = async (id: string) => {
    await appointmentService.adminDeleteSlot(id);
    await load();
  };

  return (
    <div className="space-y-8">
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
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C99A32] px-4 py-3 font-semibold text-white">
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
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A47788] px-4 py-3 font-semibold text-white">
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
              <button type="button" onClick={() => deleteSlot(slot.id)} className="inline-flex items-center justify-center rounded-lg border p-2 text-red-600">
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
            <div key={appointment.id} className="grid gap-2 rounded-lg border border-slate-100 p-3 md:grid-cols-[1fr_1fr_1fr_1fr]">
              <strong>{appointment.appointment_number}</strong>
              <span>{appointment.first_name} {appointment.last_name}</span>
              <span>{appointment.service_name}</span>
              <span>{new Date(appointment.available_date).toLocaleDateString("fr-FR")} {appointment.start_time.slice(0, 5)}</span>
            </div>
          ))}
          {!appointments.length && <p className="text-slate-500">Aucune réservation pour le moment.</p>}
        </div>
      </section>
    </div>
  );
}
