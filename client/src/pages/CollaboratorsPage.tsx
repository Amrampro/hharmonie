import { useEffect, useState } from "react";
import { Building2, MapPin, Phone, UserRound } from "lucide-react";
import { contentService, type Collaborator } from "../services/contentService";
export function CollaboratorsPage() {
  const [items, setItems] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; contentService.list<Collaborator>("collaborators").then(data => { if (active) setItems(data.items); }).catch(() => { if (active) setError("Impossible de charger les collaborateurs. Veuillez réessayer plus tard."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <section className="hh-collaborators"><header><span>HORMONES & HARMONIE</span><h1>Nos collaborateurs</h1><p>Découvrez les entreprises et les personnes qui nous accompagnent.</p></header>{loading ? <p role="status">Chargement…</p> : error ? <p role="alert">{error}</p> : !items.length ? <p>Nos collaborateurs seront bientôt présentés ici.</p> : <div className="hh-collaborator-grid">{items.map(item => <article key={item.id}><div className="hh-collaborator-top"><Building2 size={28} />{item.country && <span>{item.country}</span>}</div><h2>{item.company_name}</h2>{item.person_name && <p><UserRound size={18} /><span>{item.person_name}</span></p>}{item.address && <p><MapPin size={18} /><span>{item.address}</span></p>}{item.phone && <p><Phone size={18} /><a href={`tel:${item.phone.replace(/[^+0-9]/g, "")}`}>{item.phone}</a></p>}</article>)}</div>}</section>;
}
