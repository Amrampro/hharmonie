import { useEffect, useState } from "react";
import { shippingService, ShippingMethod } from "../../services/shippingService";

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { shippingService.get().then(setMethods).catch(e => setMessage(e.message)); }, []);
  const update = (index: number, changes: Partial<ShippingMethod>) => setMethods(old => old.map((m, i) => i === index ? { ...m, ...changes } : m));
  const input = "border border-slate-300 rounded-lg p-3 w-full bg-white";
  return <div className="max-w-5xl mx-auto space-y-6">
    <header><h1 className="text-2xl font-bold">Livraisons et tarifs</h1><p>Ajoutez les pays desservis et leurs frais en euros, pour chaque mode de livraison.</p></header>
    <form className="space-y-6" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setMessage("");
      try { await shippingService.save(methods); setMessage("Les tarifs et les seuils ont été enregistrés."); }
      catch (error: any) { setMessage(error.message); } finally { setBusy(false); }
    }}>
      <fieldset disabled={busy} className="space-y-6">
      {methods.map((method, index) => <section key={method.method} className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">{method.method === "mondial_relay" ? "Point relais — Mondial Relay" : "Livraison à domicile"}</h2>
        <label className="flex gap-2 items-center"><input type="checkbox" checked={method.free_shipping_threshold_cents !== null} onChange={e => update(index, { free_shipping_threshold_cents: e.target.checked ? 0 : null })} /> Activer la livraison gratuite à partir d’un montant</label>
        {method.free_shipping_threshold_cents !== null && <label className="block">Montant minimum des articles (€), avant remise et hors livraison<input className={input} required type="number" min="0" step="0.01" value={method.free_shipping_threshold_cents / 100} onChange={e => update(index, { free_shipping_threshold_cents: Math.round(Number(e.target.value) * 100) })} /></label>}
        <p className="text-sm text-slate-600">{method.free_shipping_threshold_cents === null ? "Aucune gratuité automatique pour ce mode." : "Ce seuil s’applique à tous les pays ci-dessous. 0 € rend ce mode gratuit pour toute commande."}</p>
        {method.rates.map((rate, ri) => <div key={ri} className="grid sm:grid-cols-4 gap-3 items-end border-t pt-4">
          <label>Pays<input className={input} required maxLength={100} value={rate.country_name} onChange={e => update(index, { rates: method.rates.map((r, i) => i === ri ? { ...r, country_name: e.target.value } : r) })} /></label>
          <label>Code pays (ex. BE)<input className={input} required pattern="[A-Za-z]{2}" maxLength={2} value={rate.country_code} onChange={e => update(index, { rates: method.rates.map((r, i) => i === ri ? { ...r, country_code: e.target.value.toUpperCase() } : r) })} /></label>
          <label>Frais (€)<input className={input} required type="number" min="0" step="0.01" value={rate.amount_cents / 100} onChange={e => update(index, { rates: method.rates.map((r, i) => i === ri ? { ...r, amount_cents: Math.round(Number(e.target.value) * 100) } : r) })} /></label>
          <button type="button" className="border rounded-lg p-3 text-red-700" onClick={() => update(index, { rates: method.rates.filter((_, i) => i !== ri) })}>Retirer ce pays</button>
        </div>)}
        <button type="button" className="border rounded-lg p-3" onClick={() => update(index, { rates: [...method.rates, { country_code: "", country_name: "", amount_cents: 0 }] })}>+ Ajouter un pays</button>
        <p className="text-sm text-slate-600">Un pays retiré ne sera plus proposé pour ce mode lors des prochains achats. Les commandes existantes restent inchangées.</p>
      </section>)}
      </fieldset>
      <p role="status">{message}</p>
      <button className="bg-black text-white rounded-lg px-6 py-3" disabled={busy || methods.length !== 2}>{busy ? "Enregistrement…" : "Enregistrer les tarifs"}</button>
    </form>
  </div>;
}
