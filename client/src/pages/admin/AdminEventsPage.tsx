import { useAdminAction } from "../../hooks/useAdminAction";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { eventService, type EventItem } from "../../services/eventService";

const emptyForm = {
  title: "",
  short_description: "",
  description: "",
  cover_image_url: "",
  event_type: "physical",
  location_name: "",
  city: "",
  online_url: "",
  starts_at: "",
  ends_at: "",
  capacity: "",
  price: 0,
  currency: "EUR",
  status: "published",
};

export default function AdminEventsPage() {
  const { error, busy, run } = useAdminAction();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const resp = await eventService.list({ admin: true });
    setEvents(resp.events || []);
  };

  useEffect(() => {
    void run(load);
  }, []);

  const createEvent = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      await eventService.adminCreate({
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
        price: Number(form.price || 0),
      } as any);
      setForm(emptyForm);
      await load();
    });
  };

  const toggleStatus = async (eventItem: EventItem) => {
    await run(async () => {
      await eventService.adminUpdate(eventItem.id, { status: eventItem.status === "published" ? "draft" : "published" });
      await load();
    });
  };

  const deleteEvent = async (id: string) => {
    await run(async () => {
      await eventService.adminDelete(id);
      await load();
    });
  };

  return (
    <div className="space-y-8">
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
      <div>
        <span className="text-sm font-semibold text-slate-400 uppercase">Contenu</span>
        <h1 className="text-3xl font-bold text-slate-900">Événements H&H</h1>
      </div>

      <form onSubmit={createEvent} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Créer un événement</h2>
        <div className="grid gap-3">
          <input required placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Résumé" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
          <textarea rows={5} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="URL image" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-4">
            <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
              <option value="physical">Présentiel</option>
              <option value="online">En ligne</option>
              <option value="hybrid">Hybride</option>
            </select>
            <input placeholder="Lieu" value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} />
            <input placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input placeholder="Lien en ligne" value={form.online_url} onChange={(e) => setForm({ ...form, online_url: e.target.value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <input required type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            <input placeholder="Capacité" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
            </select>
          </div>
          <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C99A32] px-4 py-3 font-semibold text-white">
            <Plus size={18} /> Créer
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Liste des événements</h2>
        <div className="grid gap-3">
          {events.map((eventItem) => (
            <div key={eventItem.id} className="grid items-center gap-3 rounded-lg border border-slate-100 p-3 md:grid-cols-[1.4fr_1fr_0.8fr_auto]">
              <div>
                <strong>{eventItem.title}</strong>
                <p className="m-0 text-sm text-slate-500">{eventItem.short_description}</p>
              </div>
              <span>{new Date(eventItem.starts_at).toLocaleString("fr-FR")}</span>
              <button disabled={busy} type="button" onClick={() => toggleStatus(eventItem)} className="rounded-lg border px-3 py-2">
                {eventItem.status}
              </button>
              <button disabled={busy} type="button" onClick={() => deleteEvent(eventItem.id)} className="inline-flex items-center justify-center rounded-lg border p-2 text-red-600">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {!events.length && <p className="text-slate-500">Aucun événement créé.</p>}
        </div>
      </section>
    </div>
  );
}
