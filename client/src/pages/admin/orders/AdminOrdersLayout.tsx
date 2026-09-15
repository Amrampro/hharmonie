// client/src/pages/admin/orders/AdminOrdersLayout.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  adminOrderService,
  AdminOrder,
  OrderStatus,
  ShippingMethod,
  ShippingStatus,
} from "../../../services/admin/adminOrderService"

const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const SHIPPING_STATUSES: ShippingStatus[] = [
  "not_set",
  "label_created",
  "in_transit",
  "delivered",
  "returned",
];

const SHIPPING_METHODS: ShippingMethod[] = ["mondial_relay", "home_delivery"];

function money(cents: number, currency = "EUR") {
  const value = (cents || 0) / 100;
  try {
    return new Intl.NumberFormat("fr-BE", { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function getErrorMessage(e: any, fallback: string) {
  // fetch service throws Error(msg)
  return e?.message || fallback;
}

export default function AdminOrdersLayout() {
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);

  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  const [status, setStatus] = useState<OrderStatus | "">("");
  const [shippingStatus, setShippingStatus] = useState<ShippingStatus | "">("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | "">("");
  const [q, setQ] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderService.listOrders({
        status: status || undefined,
        shipping_status: shippingStatus || undefined,
        shipping_method: shippingMethod || undefined,
        q: q.trim() || undefined,
        limit,
        offset,
      });
      setOrders(data.orders);
      setTotal(data.total);
    } catch (e: any) {
      setError(getErrorMessage(e, "Erreur chargement commandes"));
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (id: string) => {
    setSelectedId(id);
    setSelectedOrder(null);
    setLoadingDetails(true);
    setError(null);
    try {
      const { order } = await adminOrderService.getOrderById(id);
      setSelectedOrder(order);
    } catch (e: any) {
      setError(getErrorMessage(e, "Erreur chargement commande"));
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]);

  const applyFilters = () => {
    setOffset(0);
    fetchList();
  };

  const clearFilters = () => {
    setStatus("");
    setShippingStatus("");
    setShippingMethod("");
    setQ("");
    setOffset(0);
    setTimeout(fetchList, 0);
  };

  const updateStatus = async (newStatus: OrderStatus) => {
    if (!selectedId) return;
    setError(null);
    try {
      const { order: updated } = await adminOrderService.updateOrderStatus(selectedId, {
        status: newStatus,
      });

      setSelectedOrder(updated);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o))
      );
    } catch (e: any) {
      setError(getErrorMessage(e, "Erreur update status"));
    }
  };

  const updateShipping = async (payload: {
    shipping_method?: ShippingMethod | null;
    shipping_status?: ShippingStatus;
    shipping_tracking_number?: string | null;
    shipping_tracking_url?: string | null;
  }) => {
    if (!selectedId) return;
    setError(null);
    try {
      const { order: updated } = await adminOrderService.updateOrderShipping(selectedId, payload);

      setSelectedOrder(updated);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === updated.id
            ? {
                ...o,
                shipping_method: updated.shipping_method,
                shipping_status: updated.shipping_status,
                shipping_tracking_number: updated.shipping_tracking_number,
                shipping_tracking_url: updated.shipping_tracking_url,
              }
            : o
        )
      );
    } catch (e: any) {
      setError(getErrorMessage(e, "Erreur update shipping"));
    }
  };

  const deleteOrder = async () => {
    if (!selectedId) return;
    const ok = window.confirm("Supprimer cette commande ? (action irréversible)");
    if (!ok) return;

    setError(null);
    try {
      await adminOrderService.deleteOrder(selectedId);
      setSelectedId(null);
      setSelectedOrder(null);
      setOrders((prev) => prev.filter((o) => o.id !== selectedId));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      setError(getErrorMessage(e, "Erreur suppression commande"));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Commandes</h1>
          <p className="text-sm opacity-70">Gestion des commandes, paiements et livraison</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchList}
            className="px-3 py-2 rounded-lg border hover:bg-black/5"
            disabled={loading}
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border p-3 md:p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Recherche: order id, email, coupon..."
            className="px-3 py-2 rounded-lg border md:col-span-2"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-3 py-2 rounded-lg border"
          >
            <option value="">Status (tous)</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={shippingStatus}
            onChange={(e) => setShippingStatus(e.target.value as any)}
            className="px-3 py-2 rounded-lg border"
          >
            <option value="">Shipping status (tous)</option>
            {SHIPPING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={shippingMethod}
            onChange={(e) => setShippingMethod(e.target.value as any)}
            className="px-3 py-2 rounded-lg border"
          >
            <option value="">Shipping method (tous)</option>
            {SHIPPING_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={applyFilters} className="px-3 py-2 rounded-lg bg-black text-white">
            Appliquer
          </button>
          <button onClick={clearFilters} className="px-3 py-2 rounded-lg border">
            Reset
          </button>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm opacity-70">Limit</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setOffset(0);
              }}
              className="px-3 py-2 rounded-lg border"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-black/5">
              <tr>
                <th className="text-left p-3">Num Commande</th>
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Shipping</th>
                <th className="text-left p-3">Total</th>
                <th className="text-left p-3">Date</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={7}>
                    Chargement...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={7}>
                    Aucune commande
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-3 font-mono text-xs">{o.id}</td>
                    <td className="p-3">
                      <div className="font-medium">{o.customer_full_name || "-"}</div>
                      <div className="opacity-70">{o.customer_email || "-"}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-md border bg-white">{o.status}</span>
                    </td>
                    <td className="p-3">
                      <div className="opacity-80">{o.shipping_method || "-"}</div>
                      <div className="text-xs opacity-70">{o.shipping_status}</div>
                    </td>
                    <td className="p-3 font-medium">{money(o.total_amount, o.currency)}</td>
                    <td className="p-3 opacity-80">{new Date(o.created_at).toLocaleString("fr-BE")}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openDetails(o.id)}
                        className="px-3 py-2 rounded-lg border hover:bg-black/5"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t bg-white">
          <div className="text-sm opacity-70">
            Total: {total} — Page {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-lg border disabled:opacity-50"
              disabled={offset <= 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Précédent
            </button>
            <button
              className="px-3 py-2 rounded-lg border disabled:opacity-50"
              disabled={offset + limit >= total}
              onClick={() => setOffset(offset + limit)}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Drawer details */}
      {selectedId && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setSelectedId(null);
              setSelectedOrder(null);
            }}
          />
          <div className="absolute right-0 top-0 h-full w-full md:w-[720px] bg-white shadow-xl p-4 md:p-6 overflow-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Order details</h2>
                <div className="text-xs font-mono opacity-70">{selectedId}</div>
              </div>
              <button
                className="px-3 py-2 rounded-lg border"
                onClick={() => {
                  setSelectedId(null);
                  setSelectedOrder(null);
                }}
              >
                Fermer
              </button>
            </div>

            {loadingDetails || !selectedOrder ? (
              <div className="py-6">Chargement des détails...</div>
            ) : (
              <div className="space-y-5 mt-4">
                {/* Summary */}
                <div className="rounded-xl border p-4 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">Client: {selectedOrder.customer_email || "-"}</div>
                      <div className="opacity-70">
                        Créée: {new Date(selectedOrder.created_at).toLocaleString("fr-BE")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {money(selectedOrder.total_amount, selectedOrder.currency)}
                      </div>
                      <div className="text-xs opacity-70">
                        subtotal {money(selectedOrder.subtotal_amount, selectedOrder.currency)} • shipping{" "}
                        {money(selectedOrder.shipping_amount, selectedOrder.currency)} • discount{" "}
                        {money(selectedOrder.discount_amount, selectedOrder.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm opacity-70">Order status</span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => updateStatus(e.target.value as OrderStatus)}
                        className="px-3 py-2 rounded-lg border"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={deleteOrder}
                      className="px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Shipping edit */}
                <ShippingEditor order={selectedOrder} onSave={updateShipping} />

                {/* Items */}
                <div className="rounded-xl border p-4">
                  <h3 className="font-semibold mb-2">Items</h3>
                  <div className="overflow-auto">
                    <table className="min-w-[600px] w-full text-sm">
                      <thead className="bg-black/5">
                        <tr>
                          <th className="text-left p-2">Produit</th>
                          <th className="text-left p-2">Prix</th>
                          <th className="text-left p-2">Qté</th>
                          <th className="text-left p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrder.items || []).map((it) => (
                          <tr key={it.id} className="border-t">
                            <td className="p-2">{it.product_name}</td>
                            <td className="p-2">{money(it.unit_price, selectedOrder.currency)}</td>
                            <td className="p-2">{it.quantity}</td>
                            <td className="p-2 font-medium">{money(it.line_total, selectedOrder.currency)}</td>
                          </tr>
                        ))}
                        {(selectedOrder.items || []).length === 0 && (
                          <tr>
                            <td className="p-2" colSpan={4}>
                              Aucun item
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Address */}
                <div className="rounded-xl border p-4">
                  <h3 className="font-semibold mb-2">Shipping address</h3>
                  {selectedOrder.address ? (
                    <div className="text-sm space-y-1">
                      <div className="font-medium">{selectedOrder.address.full_name}</div>
                      <div className="opacity-80">
                        {selectedOrder.address.email} • {selectedOrder.address.phone}
                      </div>
                      <div className="opacity-80">
                        {selectedOrder.address.address1}
                        {selectedOrder.address.address2 ? `, ${selectedOrder.address.address2}` : ""}
                      </div>
                      <div className="opacity-80">
                        {selectedOrder.address.postal_code} {selectedOrder.address.city} • {" "}
                        {selectedOrder.address.country}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm opacity-70">Aucune adresse</div>
                  )}
                </div>

                {/* Payment */}
                <div className="rounded-xl border p-4">
                  <h3 className="font-semibold mb-2">Payment</h3>
                  {selectedOrder.payment ? (
                    <div className="text-sm space-y-1">
                      <div>
                        Provider: <span className="font-medium">{selectedOrder.payment.provider}</span>
                      </div>
                      <div>
                        Status: <span className="font-medium">{selectedOrder.payment.status}</span>
                      </div>
                      <div>
                        Amount:{" "}
                        <span className="font-medium">
                          {money(selectedOrder.payment.amount, selectedOrder.payment.currency)}
                        </span>
                      </div>
                      <div className="text-xs opacity-70 font-mono">
                        intent: {selectedOrder.payment.stripe_payment_intent_id || "-"}
                      </div>
                      <div className="text-xs opacity-70 font-mono">
                        charge: {selectedOrder.payment.stripe_charge_id || "-"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm opacity-70">Aucun paiement</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ShippingEditor({
  order,
  onSave,
}: {
  order: AdminOrder;
  onSave: (payload: {
    shipping_method?: ShippingMethod | null;
    shipping_status?: ShippingStatus;
    shipping_tracking_number?: string | null;
    shipping_tracking_url?: string | null;
  }) => Promise<void>;
}) {
  const [shipping_method, setMethod] = useState<ShippingMethod | "">(order.shipping_method || "");
  const [shipping_status, setStatus] = useState<ShippingStatus>(order.shipping_status);
  const [shipping_tracking_number, setTrackingNumber] = useState(order.shipping_tracking_number || "");
  const [shipping_tracking_url, setTrackingUrl] = useState(order.shipping_tracking_url || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMethod(order.shipping_method || "");
    setStatus(order.shipping_status);
    setTrackingNumber(order.shipping_tracking_number || "");
    setTrackingUrl(order.shipping_tracking_url || "");
  }, [order.id]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        shipping_method: shipping_method === "" ? null : (shipping_method as ShippingMethod),
        shipping_status,
        shipping_tracking_number: shipping_tracking_number.trim() || null,
        shipping_tracking_url: shipping_tracking_url.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold">Shipping</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <div className="text-xs opacity-70 mb-1">Method</div>
          <select
            value={shipping_method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg border"
          >
            <option value="">(non défini)</option>
            {SHIPPING_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs opacity-70 mb-1">Status</div>
          <select
            value={shipping_status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg border"
          >
            {SHIPPING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs opacity-70 mb-1">Tracking number</div>
          <input
            value={shipping_tracking_number}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
            placeholder="ex: 123456..."
          />
        </div>

        <div>
          <div className="text-xs opacity-70 mb-1">Tracking URL</div>
          <input
            value={shipping_tracking_url}
            onChange={(e) => setTrackingUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={submit}
          disabled={saving}
          className="px-3 py-2 rounded-lg bg-black text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save shipping"}
        </button>
      </div>
    </div>
  );
}
