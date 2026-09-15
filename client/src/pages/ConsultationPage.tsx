import { useEffect, useMemo, useState } from "react";
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
  const [error, setError] = useState("");
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", message: "" });

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
    appointmentService.listSlots({ serviceId: selectedService })
      .then((resp) => setSlots(resp.slots || []))
      .catch(() => setSlots([]));
  }, [selectedService]);

  const selectedServiceData = useMemo(
    () => services.find((service) => service.id === selectedService),
    [selectedService, services]
  );

  const availableSlots = slots.filter((slot) => slot.status === "available");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess("");
    setError("");
    if (!selectedService || !selectedSlot) {
      setError("Choisissez un accompagnement et un créneau.");
      return;
    }
    try {
      const resp = await appointmentService.book({
        service_id: selectedService,
        slot_id: selectedSlot,
        ...form,
      });
      setSuccess(`Rendez-vous confirmé. Référence : ${resp.appointment_number}`);
      setSelectedSlot("");
      setForm({ first_name: "", last_name: "", email: "", phone: "", message: "" });
      const fresh = await appointmentService.listSlots({ serviceId: selectedService });
      setSlots(fresh.slots || []);
    } catch {
      setError("Ce créneau n'est plus disponible ou les informations sont incomplètes.");
    }
  };

  return (
    <section className="hh-consultation">
      <div className="hh-page-intro">
        <span>Consultation</span>
        <h1>Réserver un accompagnement</h1>
        <p>
          Choisissez un service, puis un créneau disponible créé depuis l'administration.
          La réservation est ensuite transmise à Hormones & Harmonie.
        </p>
      </div>

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
                  className={selectedService === service.id ? "is-active" : ""}
                  onClick={() => {
                    setSelectedService(service.id);
                    setSelectedSlot("");
                  }}
                >
                  <Icon size={20} />
                  <strong>{service.name}</strong>
                  <small>{service.duration_minutes} min - {Number(service.price).toFixed(2)} EUR</small>
                  <span>{service.short_description}</span>
                </button>
              );
            })}
          </aside>

          <form onSubmit={submit}>
            <h2>{selectedServiceData?.name || "Votre rendez-vous"}</h2>
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
                </button>
              )) : <p>Aucun créneau disponible pour cet accompagnement.</p>}
            </div>

            <div className="form-grid">
              <input required placeholder="Prénom" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <input required placeholder="Nom" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input placeholder="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <textarea rows={5} placeholder="Message ou besoin principal" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            {error && <p className="hh-error">{error}</p>}
            {success && <p className="hh-success">{success}</p>}
            <Button type="submit" size="large">Prendre rendez-vous</Button>
          </form>
        </div>
      )}
    </section>
  );
}
