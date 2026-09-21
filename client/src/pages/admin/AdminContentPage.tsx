import { useEffect, useState, type FormEvent } from "react";
import { contentService } from "../../services/contentService";
import { bannerService } from "../../services/bannerService";
import { http } from "../../services/http";
import { apiEndpoints } from "../../services/apiEndpoints";

type Kind = "testimonials" | "collaborators" | "messages";
type Entry = Record<string, any>;
const initial = () => ({ author_name: "", photo_url: "", testimony: "", product_id: "", company_name: "", person_name: "", address: "", phone: "", country: "", is_active: true, display_order: 0 });
export default function AdminContentPage({ kind }: { kind: Kind }) {
  const [items, setItems] = useState<Entry[]>([]);
  const [products, setProducts] = useState<Entry[]>([]);
  const [form, setForm] = useState(initial);
  const [id, setId] = useState<string>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const title = kind === "testimonials" ? "Témoignages" : kind === "collaborators" ? "Collaborateurs" : "Messages de contact";
  const load = async () => { const data = await contentService.list<Entry>(kind, true); setItems(data.items); };
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([contentService.list<Entry>(kind, true), kind === "testimonials" ? http<{ products: Entry[] }>(`${apiEndpoints.base}/content/admin/products`) : Promise.resolve({ products: [] })])
      .then(([data, catalog]) => { if (!cancelled) { setItems(data.items); setProducts(catalog.products); } })
      .catch(e => { if (!cancelled) setError(e.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [kind]);
  const act = async (fn: () => Promise<unknown>) => { setBusy(true); setError(""); setNotice(""); try { await fn(); await load(); } catch (e: any) { setError(e.message); } finally { setBusy(false); } };
  const save = (event: FormEvent) => { event.preventDefault(); if (busy || uploading) return; void act(async () => { await contentService.save(kind, form, id); setForm(initial()); setId(undefined); setNotice("Enregistrement effectué."); }); };
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 bg-white";
  const field = (key: keyof ReturnType<typeof initial>, label: string, max: number, required = false) => <label key={key} className="block">{label}{required && " *"}<input className={input} value={String(form[key] ?? "")} maxLength={max} required={required} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} /></label>;
  return <div className="space-y-6"><h1 className="text-2xl font-semibold">{title}</h1>
    {error && <p role="alert" className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</p>}
    {notice && <p role="status" className="text-green-700">{notice}</p>}
    {kind !== "messages" && <form onSubmit={save} className="bg-white border rounded-xl p-6 space-y-4"><h2 className="text-lg font-medium">{id ? "Modifier" : "Ajouter"}</h2><fieldset disabled={busy || uploading || loading} className="space-y-4">
      {kind === "testimonials" ? <>
        {field("author_name", "Nom de la personne", 190, true)}
        <label className="block">Photo *<input className={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; setUploading(true); setError(""); try { const uploaded = await bannerService.uploadBannerImage(file); setForm(f => ({ ...f, photo_url: uploaded.url })); } catch (err: any) { setError(err.message); } finally { setUploading(false); } }} /></label>
        {form.photo_url && <img src={form.photo_url} alt="Photo du témoignage" className="h-40 w-28 object-cover rounded-lg" />}
        <label className="block">Témoignage *<textarea className={input} required rows={7} maxLength={10000} value={form.testimony} onChange={e => setForm(f => ({ ...f, testimony: e.target.value }))} /></label>
        <label className="block">Produit associé *<select className={input} required value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}><option value="">Sélectionner un produit</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      </> : <>{field("company_name", "Nom de l’entreprise collaboratrice", 190, true)}{field("person_name", "Nom de la personne", 190)}{field("address", "Adresse", 500)}{field("phone", "Téléphone", 50)}{field("country", "Pays", 100)}</>}
      <label className="block">Ordre d’affichage<input type="number" min={0} max={1000000} className={input} value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} /></label>
      <label className="flex gap-2 items-center"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />Visible sur le site</label>
      <div className="flex gap-3"><button disabled={kind === "testimonials" && !form.photo_url} className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-40">{busy ? "Enregistrement…" : "Enregistrer"}</button>{id && <button type="button" onClick={() => { setForm(initial()); setId(undefined); }}>Annuler</button>}</div>
    </fieldset>{uploading && <p role="status">Envoi de la photo…</p>}</form>}
    {loading ? <p>Chargement…</p> : items.length === 0 ? <p>Aucun élément pour le moment.</p> : <div className="space-y-3">{items.map(item => kind === "messages" ? <article key={item.id} className="p-5 border rounded-xl bg-white">
      <div className="flex justify-between gap-4 flex-wrap"><h2 className="font-semibold">{item.subject} {!item.is_read && <span className="text-sm text-purple-700"> • Non lu</span>}</h2><time>{new Date(item.created_at).toLocaleString("fr-FR")}</time></div>
      <p>{item.name} — <a href={`mailto:${item.email}`} className="underline">{item.email}</a></p><p className="whitespace-pre-wrap break-words my-4">{item.message}</p>
      <button disabled={busy} className="underline" onClick={() => void act(() => contentService.save("messages", { is_read: !item.is_read }, item.id))}>{item.is_read ? "Marquer comme non lu" : "Marquer comme lu"}</button>
    </article> : <article key={item.id} className="p-4 border rounded-xl bg-white flex gap-4 justify-between items-center flex-wrap"><div><strong>{item.author_name || item.company_name}</strong><p className="text-sm text-slate-500">{item.product_name || item.country} · {item.is_active ? "Visible" : "Masqué"}</p></div><div className="flex gap-4"><button disabled={busy || uploading} onClick={() => { setId(item.id); setForm({ ...initial(), ...item, is_active: Boolean(item.is_active) }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Modifier</button><button disabled={busy || uploading} className="text-red-700" onClick={() => { if (window.confirm("Supprimer cet élément ?")) void act(() => contentService.remove(kind, item.id)); }}>Supprimer</button></div></article>)}</div>}
  </div>;
}
