import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { contentService, type Testimonial } from "../services/contentService";
export function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [selected, setSelected] = useState<Testimonial | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { let active = true; contentService.list<Testimonial>("testimonials").then(data => { if (active) setItems(data.items); }).catch(() => {}); return () => { active = false; }; }, []);
  useEffect(() => { if (!selected) return; dialog.current?.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; }; }, [selected]);
  if (!items.length) return null;
  const price = (value: number) => Number(value).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  return <section className="hh-testimonials" aria-labelledby="testimonials-title"><h2 id="testimonials-title">Témoignages</h2><div className="hh-testimonial-track">{items.map(item => <article className="hh-testimonial-card" key={item.id}>
    <button className="hh-testimonial-photo" onClick={() => setSelected(item)} aria-label={`Lire le témoignage de ${item.author_name}`}><img src={item.photo_url} alt={item.author_name} loading="lazy" /><span>Lire le témoignage ↗</span></button>
    <Link className="hh-testimonial-product" to={`/products/${encodeURIComponent(item.product_slug)}`}>{item.product_image && <img src={item.product_image} alt="" loading="lazy" />}<span><strong>{item.product_name}</strong><small>{price(item.product_price)}</small></span></Link>
  </article>)}</div>
    {selected && <dialog className="hh-testimonial-dialog" ref={dialog} onClose={() => setSelected(null)} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }} aria-labelledby="testimony-title"><button className="hh-dialog-close" onClick={() => dialog.current?.close()} aria-label="Fermer">×</button><img className="hh-dialog-portrait" src={selected.photo_url} alt={selected.author_name} /><div className="hh-dialog-copy"><h3 id="testimony-title">Le témoignage de {selected.author_name}</h3><p>{selected.testimony}</p><Link to={`/products/${encodeURIComponent(selected.product_slug)}`} onClick={() => dialog.current?.close()}>Découvrir {selected.product_name} — {price(selected.product_price)}</Link></div></dialog>}
  </section>;
}
