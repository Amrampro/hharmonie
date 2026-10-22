import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ordersService } from "../services/ordersService";
import { useCart } from "../contexts/CartContext";
import { useSiteParams } from "../contexts/SiteParamsContext";

type OrderData = {
  order: {
    id: string;
    order_number?: string;
    status: string;
    currency: string;
    total_amount: number;
    subtotal_amount: number;
    discount_amount: number;
    shipping_amount: number;
    invoice_sent_at: string | null;
    shipping_tracking_url?: string;
    shipping_tracking_number?: string;
    shipping_status?: string;
    created_at: string;
  };
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
  address: {
    full_name: string;
    email: string;
    address1: string;
    address2?: string;
    city: string;
    postal_code: string;
    country: string;
  } | null;
  shipping: {
    tracking_url?: string;
    tracking_number?: string;
    relay_point_name?: string;
    relay_point_address?: string;
    provider?: string;
  } | null;
  tracking_url: string;
};
const labels: Record<string, string> = {
  pending_payment: "En attente du paiement",
  pending: "En attente",
  paid: "Paiement confirmé",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  completed: "Terminée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  not_set: "En attente de préparation",
};
const paidStates = ["paid", "processing", "shipped", "delivered", "completed"];
export default function OrderSuccessPage({
  tracking = false,
}: {
  tracking?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const id = params.get("order") || "";
  const session = params.get("session_id") || "";
  let token = params.get("token") || "";
  if (!token && id) {
    try {
      token = sessionStorage.getItem(`order-token:${id}`) || "";
    } catch {
      /* Private email links work without storage. */
    }
  }
  const [data, setData] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(id || session));
  const [attempt, setAttempt] = useState(0);
  const { clearCart } = useCart();
  const clearCartRef = useRef(clearCart);
  clearCartRef.current = clearCart;
  const cleared = useRef("");
  const { parameters } = useSiteParams();
  useEffect(() => {
    if (!id && !session) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let count = 0;
    const load = async () => {
      try {
        const result: OrderData = await ordersService.getOrder(
          id,
          token,
          session,
        );
        if (cancelled) return;
        setData(result);
        setError("");
        const paid = paidStates.includes(result.order.status);
        if (paid && !tracking && cleared.current !== result.order.id) {
          cleared.current = result.order.id;
          clearCartRef.current();
        }
        if (
          ["pending_payment", "pending"].includes(result.order.status) &&
          ++count < 12
        )
          timer = setTimeout(load, 3000);
      } catch (cause: any) {
        if (!cancelled)
          setError(cause.message || "Impossible de charger la commande.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    setData(null);
    setLoading(true);
    void load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, token, session, tracking, attempt]);
  const order = data?.order;
  const paid = Boolean(order && paidStates.includes(order.status));
  const money = (value: number) =>
    (Number(value) / 100).toLocaleString("fr-BE", {
      style: "currency",
      currency: order?.currency || "EUR",
    });
  const whatsappAfterPurchase =
    parameters?.whatsapp_after_purchase_link?.trim() || "";
  const trackingUrl =
    data?.shipping?.tracking_url || order?.shipping_tracking_url;
  const trackingNumber =
    data?.shipping?.tracking_number || order?.shipping_tracking_number;
  return (
    <section className="order-follow-page">
      <Helmet>
        <title>
          {tracking ? "Suivi des commandes" : "Confirmation de commande"} —{" "}
          {parameters?.name || "Hormones & Harmonie"}
        </title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      {!tracking && paid && /^https:\/\//i.test(whatsappAfterPurchase) && (
        <aside
          className="order-whatsapp-callout"
          aria-labelledby="order-whatsapp-title"
        >
          <h2 id="order-whatsapp-title">
            Accédez à notre espace WhatsApp après votre achat
          </h2>
          <a
            href={whatsappAfterPurchase}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cliquez ici pour accéder au lien WhatsApp{" "}
            <span aria-hidden="true">↗</span>
          </a>
        </aside>
      )}
      <header>
        <span>{parameters?.name || "Hormones & Harmonie"}</span>
        <h1>
          {tracking
            ? "Suivi des commandes"
            : paid
              ? "Merci pour votre commande !"
              : "Votre commande"}
        </h1>
        {order && (
          <>
            <p>
              Référence : <strong>{order.order_number || order.id}</strong>
            </p>
            <p role="status" className={paid ? "order-paid" : ""}>
              {labels[order.status] || order.status}
            </p>
          </>
        )}
        {tracking && (
          <form
            className="order-search"
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setError("");
              setData(null);
              try {
                const found: OrderData = await ordersService.lookup(
                  reference,
                  email,
                );
                setData(found);
                setParams(new URL(found.tracking_url).searchParams);
              } catch (cause: any) {
                setError(cause.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            <label>
              Numéro de commande
              <input
                required
                maxLength={80}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
            <label>
              E-mail utilisé à l’achat
              <input
                required
                type="email"
                maxLength={190}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <button className="order-refresh" disabled={loading}>
              Rechercher ma commande
            </button>
          </form>
        )}
        {loading && <p role="status">Vérification de votre commande…</p>}
        {error && (
          <p role="alert" className="hh-error">
            {error}
          </p>
        )}
        {(id || session) && (
          <button
            type="button"
            className="order-refresh"
            disabled={loading}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Actualiser le suivi
          </button>
        )}
      </header>
      {data && order && (
        <>
          {paid && (
            <p>
              {order.invoice_sent_at
                ? `Votre confirmation a été envoyée à ${data.address?.email || "votre adresse email"}. Vérifiez également vos courriers indésirables.`
                : "Votre paiement est confirmé. L’email de confirmation est en cours d’envoi."}
            </p>
          )}
          {!paid && ["pending", "pending_payment"].includes(order.status) && (
            <p>
              La confirmation du paiement peut prendre quelques instants. Cette
              page se met à jour automatiquement.
            </p>
          )}
          {paid && (
            <aside className="order-delivery-notice">
              <p>
                Délai de livraison : 3 - 7 jours ouvrables, et jusqu'à 10 jours dans les périodes d'affluence partir du jour où
                le colis a été expédié.
              </p>
              <p>
                Un e-mail de confirmation avec un numéro de suivi vous sera
                envoyé dès l’expédition.
              </p>
            </aside>
          )}
          {(paid || order.status === "refunded") && (
            <p>
              <a
                className="event-external-link"
                href={ordersService.invoiceUrl(
                  order.id,
                  new URL(data.tracking_url).searchParams.get("token") || "",
                )}
                download
              >
                Télécharger la facture
              </a>
            </p>
          )}
          <div className="order-follow-grid">
            <article>
              <h2>Votre commande</h2>
              {data.items.map((item) => (
                <div className="order-follow-item" key={item.id}>
                  <div>
                    <strong>{item.product_name}</strong>
                    <p>
                      {item.quantity} × {money(item.unit_price)}
                    </p>
                  </div>
                  <strong>{money(item.line_total)}</strong>
                </div>
              ))}
              <dl className="order-totals">
                {[
                  ["Sous-total", order.subtotal_amount],
                  ["Réduction", -order.discount_amount],
                  ["Livraison", order.shipping_amount],
                  ["Total", order.total_amount],
                ].map(([label, amount]) => (
                  <div key={String(label)}>
                    <dt>{label}</dt>
                    <dd>{money(Number(amount))}</dd>
                  </div>
                ))}
              </dl>
            </article>
            <article>
              <h2>Livraison</h2>
              {data.address && (
                <address>
                  {data.address.full_name}
                  <br />
                  {data.address.address1}
                  {data.address.address2 && (
                    <>
                      <br />
                      {data.address.address2}
                    </>
                  )}
                  <br />
                  {data.address.postal_code} {data.address.city}
                  <br />
                  {data.address.country}
                </address>
              )}
              {data.shipping?.relay_point_name && (
                <p>
                  Point relais : {data.shipping.relay_point_name}
                  <br />
                  {data.shipping.relay_point_address}
                </p>
              )}
              {order.shipping_status && (
                <p>{labels[order.shipping_status] || order.shipping_status}</p>
              )}
              {trackingNumber && (
                <p>
                  Numéro de suivi : <strong>{trackingNumber}</strong>
                </p>
              )}
              {trackingUrl && /^https?:\/\//i.test(trackingUrl) && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-external-link"
                >
                  Suivre le colis
                </a>
              )}
              {!trackingNumber && !trackingUrl && (
                <p>
                  Le suivi du colis apparaîtra ici lorsqu’il sera disponible.
                </p>
              )}
            </article>
          </div>
          {!tracking && (
            <Link
              to={
                new URL(data.tracking_url).pathname +
                new URL(data.tracking_url).search
              }
              className="event-external-link"
            >
              Voir le suivi de ma commande
            </Link>
          )}
        </>
      )}
      <p>
        {parameters?.email ? (
          <>
            Besoin d’aide ?{" "}
            <a href={`mailto:${parameters.email}`}>{parameters.email}</a>
          </>
        ) : (
          <Link to="/contact">Nous contacter</Link>
        )}
      </p>
      <Link to="/shop">Continuer mes achats</Link>
    </section>
  );
}
