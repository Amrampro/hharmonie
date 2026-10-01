import { useAdminAction } from "../../hooks/useAdminAction";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Pencil, Save, Trash2 } from "lucide-react";
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

function localDateTime(value: string | null) {
  if (!value) return "";
  // SQL dates without a timezone already represent the form's wall-clock time.
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(value)) return value.replace(" ", "T");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function AdminEventsPage() {
  const { error, busy, run } = useAdminAction();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [notice, setNotice] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const resp = await eventService.list({ admin: true });
    setEvents(resp.events || []);
  };

  useEffect(() => {
    void run(load);
  }, []);

  const editEvent = (item: EventItem) => {
    setEditing(item);
    setNotice("");
    setForm({
      title: item.title, short_description: item.short_description || "",
      description: item.description || "", cover_image_url: item.cover_image_url || "",
      event_type: item.event_type, location_name: item.location_name || "", city: item.city || "",
      online_url: item.online_url || "", starts_at: localDateTime(item.starts_at), ends_at: localDateTime(item.ends_at),
      capacity: item.capacity == null ? "" : String(item.capacity), price: Number(item.price),
      currency: item.currency, status: item.status,
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
  };

  const saveEvent = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");
    await run(async () => {
      if (!form.title.trim()) throw new Error("Le titre est obligatoire.");
      if (form.ends_at && form.ends_at < form.starts_at) throw new Error("La date de fin doit être postérieure à la date de début.");
      const payload: Partial<EventItem> = {
        ...form, title: form.title.trim(),
        event_type: form.event_type as EventItem["event_type"], status: form.status as EventItem["status"],
        starts_at: editing && form.starts_at === localDateTime(editing.starts_at) ? editing.starts_at : form.starts_at,
        ends_at: editing && form.ends_at === localDateTime(editing.ends_at) ? editing.ends_at : form.ends_at || null,
        capacity: form.capacity ? Number(form.capacity) : null, price: Number(form.price || 0),
      };
      if (editing) await eventService.adminUpdate(editing.id, payload);
      else await eventService.adminCreate(payload);
      setNotice(editing ? "Événement modifié." : "Événement créé.");
      setEditing(null); setForm(emptyForm);
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
      if (editing?.id === id) { setEditing(null); setForm(emptyForm); }
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

      <form ref={formRef} onSubmit={saveEvent} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">{editing ? "Modifier l’événement" : "Créer un événement"}</h2>
        {notice && <p role="status" className="mb-4 text-green-700">{notice}</p>}
        <fieldset disabled={busy} className="grid gap-4">
          <label className="block text-sm font-medium text-slate-700">Titre *<input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" required placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="block text-sm font-medium text-slate-700">Résumé<input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" placeholder="Résumé" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></label>
          <label className="block text-sm font-medium text-slate-700">Description<textarea className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" rows={5} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="block text-sm font-medium text-slate-700">URL de l’image<input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" placeholder="URL image" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} /></label>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="block text-sm font-medium text-slate-700">Format<select className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
              <option value="physical">Présentiel</option>
              <option value="online">En ligne</option>
              <option value="hybrid">Hybride</option>
            </select></label>
            <label className="block text-sm font-medium text-slate-700">Lieu<input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" placeholder="Lieu" value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700">Ville<input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700">Lien de l’événement (facultatif)<input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" type="url" maxLength={1000} placeholder="https://…" value={form.online_url} onChange={(e) => setForm({ ...form, online_url: e.target.value })} /></label>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <label className="block text-sm font-medium text-slate-700">Date et heure de début *<input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" required type="datetime-local" step="1" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700">Date et heure de fin<input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" type="datetime-local" step="1" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700">Capacité (facultatif)<input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" type="number" min="0" step="1" placeholder="Nombre de places" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700">Prix (€)<input className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#A47788]" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></label>
            <label className="block text-sm font-medium text-slate-700">Statut<select className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archivé</option>
            </select></label>
          </div>
          <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#C99A32] px-4 py-3 font-semibold text-white">
            {editing ? <Save size={18} /> : <Plus size={18} />} {busy ? "Enregistrement…" : editing ? "Enregistrer les modifications" : "Créer"}
          </button>
          {editing && <button type="button" className="rounded-lg border px-4 py-3" onClick={() => { setEditing(null); setForm(emptyForm); setNotice(""); }}>Annuler la modification</button>}
        </fieldset>
      </form>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Liste des événements</h2>
        <div className="grid gap-3">
          {events.map((eventItem) => (
            <div key={eventItem.id} className="grid items-center gap-3 rounded-lg border border-slate-100 p-3 md:grid-cols-[1.4fr_1fr_auto_auto_auto]">
              <div>
                <strong>{eventItem.title}</strong>
                <p className="m-0 text-sm text-slate-500">{eventItem.short_description}</p>
              </div>
              <span>{new Date(eventItem.starts_at).toLocaleString("fr-FR")}</span>
              <button disabled={busy} type="button" onClick={() => editEvent(eventItem)} className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2"><Pencil size={16} /> Modifier</button>
              <button disabled={busy} type="button" onClick={() => toggleStatus(eventItem)} className="rounded-lg border px-3 py-2">
                {{ published: "Publié", draft: "Brouillon", archived: "Archivé" }[eventItem.status]}
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
