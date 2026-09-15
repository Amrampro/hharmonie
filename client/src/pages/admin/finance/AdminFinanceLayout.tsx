// client/src/pages/admin/finance/AdminFinanceLayout.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Package,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Truck
} from "lucide-react";
import {
  adminFinanceService,
  AdminFinanceOrderRow,
  OrderStatus,
  ShippingMethod,
} from "../../../services/adminFinanceService";

// --- Constants & Helpers ---
const STATUSES: OrderStatus[] = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
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

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    refunded: "bg-rose-100 text-rose-800 border-rose-200",
    pending_payment: "bg-amber-100 text-amber-800 border-amber-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
    delivered: "bg-teal-100 text-teal-800 border-teal-200",
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
      {status.replace("_", " ")}
    </span>
  );
};

export default function AdminFinanceLayout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<AdminFinanceOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);

  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  // Filters
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | "">("");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFinanceService.list({
        status: status || undefined,
        shipping_method: shippingMethod || undefined,
        q: q.trim() || undefined,
        date_from: dateFrom ? `${dateFrom} 00:00:00` : undefined,
        date_to: dateTo ? `${dateTo} 23:59:59` : undefined,
        limit,
        offset,
      });
      setOrders(data.orders);
      setTotal(data.total);
      setStats(data.stats);
    } catch (e: any) {
      setError(e?.message || "Erreur chargement finance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]); // Only auto-fetch on pagination

  const applyFilters = () => {
    setOffset(0);
    fetchData();
  };

  const clearFilters = () => {
    setStatus("");
    setShippingMethod("");
    setQ("");
    setDateFrom("");
    setDateTo("");
    setOffset(0);
    // Use a timeout to allow state to settle before fetch, or use a separate effect
    setTimeout(() => {
       // Ideally trigger a refetch here or via a dependency
       // For this snippet, we'll manually call it with cleared values
       adminFinanceService.list({ limit: 25, offset: 0 }).then(data => {
         setOrders(data.orders);
         setTotal(data.total);
         setStats(data.stats);
       });
    }, 50);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Finance</h1>
          <p className="text-slate-500 mt-1">
            Suivi des flux de trésorerie, remboursements et soldes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
             onClick={fetchData}
             className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
             title="Rafraîchir"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm">
            <Download size={18} />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>
      </div>

      {/* --- KPI STATS --- */}
      {stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Solde Actuel" 
            subLabel="Commandes payées (Paid)"
            value={money(stats.balance_current, "EUR")} 
            icon={<Wallet className="text-emerald-600" size={24} />}
            trend="positive"
            color="emerald"
          />
          <StatCard 
            label="Sorties" 
            subLabel="Remboursements (Refunded)"
            value={money(stats.total_out, "EUR")} 
            icon={<ArrowUpRight className="text-rose-600" size={24} />}
            trend="negative"
            color="rose"
          />
          <StatCard 
            label="En Attente" 
            subLabel="Paiement manquant"
            value={money(stats.total_pending_payment, "EUR")} 
            icon={<Clock className="text-amber-600" size={24} />}
            trend="neutral"
            color="amber"
          />
          <StatCard 
            label="Volume en cours" 
            subLabel="Processing + Shipped"
            value={money(stats.total_in_progress, "EUR")} 
            icon={<Package className="text-indigo-600" size={24} />}
            trend="neutral"
            color="indigo"
          />
        </div>
      ) : (
        // Skeleton loader for stats
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-pulse">
           {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>)}
        </div>
      )}

      {/* --- FILTERS TOOLBAR --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
         <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search */}
            <div className="md:col-span-4 relative">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input 
                 value={q}
                 onChange={(e) => setQ(e.target.value)}
                 placeholder="Rechercher (ID, Email, Coupon...)"
                 className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
               />
            </div>

            {/* Date Range */}
            <div className="md:col-span-4 flex items-center gap-2">
               <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="text-slate-400" size={16} />
                  </div>
                  <input 
                    type="date" 
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm text-slate-600"
                  />
               </div>
               <span className="text-slate-400">-</span>
               <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="text-slate-400" size={16} />
                  </div>
                  <input 
                    type="date" 
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm text-slate-600"
                  />
               </div>
            </div>

            {/* Dropdowns */}
            <div className="md:col-span-2">
               <select 
                 value={status} 
                 onChange={(e) => setStatus(e.target.value as any)}
                 className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none bg-white text-sm"
               >
                 <option value="">Tous les statuts</option>
                 {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
            </div>
            
            <div className="md:col-span-2">
               <select 
                 value={shippingMethod} 
                 onChange={(e) => setShippingMethod(e.target.value as any)}
                 className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none bg-white text-sm"
               >
                 <option value="">Livraison (Tous)</option>
                 {SHIPPING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
               </select>
            </div>
         </div>

         {/* Filter Actions */}
         <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex gap-2">
               <button onClick={applyFilters} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                 Appliquer les filtres
               </button>
               <button onClick={clearFilters} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                 Réinitialiser
               </button>
            </div>
            {error && <span className="text-sm text-red-600 font-medium">{error}</span>}
         </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Loading State */}
        {loading && (
           <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <RefreshCw className="animate-spin mb-2" size={24} />
              <p>Mise à jour des données...</p>
           </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
           <div className="p-12 text-center text-slate-500">
              <p className="text-lg font-medium text-slate-900">Aucune transaction trouvée</p>
              <p>Modifiez vos filtres pour voir les résultats.</p>
           </div>
        )}

        {/* Desktop Table View */}
        {!loading && orders.length > 0 && (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider text-xs border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Date / ID</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Livraison</th>
                  <th className="px-6 py-4">Coupon</th>
                  <th className="px-6 py-4 text-right">Montant Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{new Date(o.created_at).toLocaleDateString("fr-BE")}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">#{o.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{o.customer_full_name || "Invité"}</div>
                      <div className="text-xs text-slate-500">{o.customer_email}</div>
                    </td>
                    <td className="px-6 py-4">
                       <StatusBadge status={o.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                       <div className="flex items-center gap-2">
                          <Truck size={14} className="text-slate-400" />
                          <span className="capitalize">{o.shipping_method?.replace("_", " ") || "-"}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       {o.coupon_code ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200">
                             {o.coupon_code}
                          </span>
                       ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className={`font-semibold text-base ${o.status === 'refunded' ? 'text-rose-600' : 'text-slate-900'}`}>
                          {o.status === 'refunded' ? '-' : ''}{money(o.total_amount, o.currency)}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
             {orders.map((o) => (
                <div key={o.id} className="p-4 space-y-3">
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="text-xs text-slate-500 mb-0.5">{new Date(o.created_at).toLocaleString("fr-BE")}</div>
                         <div className="font-semibold text-slate-900">{o.customer_full_name}</div>
                      </div>
                      <StatusBadge status={o.status} />
                   </div>
                   
                   <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex flex-col gap-1">
                         <span className="text-xs text-slate-400 uppercase tracking-wide">ID Commande</span>
                         <span className="font-mono">{o.id.slice(0,8)}</span>
                      </div>
                      <div className="text-right">
                         <div className={`font-bold text-lg ${o.status === 'refunded' ? 'text-rose-600' : 'text-slate-900'}`}>
                            {money(o.total_amount, o.currency)}
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                      <div className="flex items-center gap-1">
                         <Truck size={12} />
                         {o.shipping_method || "N/A"}
                      </div>
                      {o.coupon_code && (
                         <div className="flex items-center gap-1">
                            <CreditCard size={12} />
                            Code: {o.coupon_code}
                         </div>
                      )}
                   </div>
                </div>
             ))}
          </div>
        </>
        )}

        {/* --- PAGINATION --- */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
           <div className="hidden sm:block text-sm text-slate-500">
              Affichage de <span className="font-medium text-slate-900">{offset + 1}</span> à <span className="font-medium text-slate-900">{Math.min(offset + limit, total)}</span> sur <span className="font-medium text-slate-900">{total}</span>
           </div>
           
           <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <select 
                value={limit} 
                onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
                className="px-2 py-1.5 rounded border border-slate-300 text-sm bg-white"
              >
                 <option value={10}>10 / page</option>
                 <option value={25}>25 / page</option>
                 <option value={50}>50 / page</option>
              </select>

              <div className="flex gap-1">
                 <button 
                   onClick={() => setOffset(Math.max(0, offset - limit))}
                   disabled={offset === 0}
                   className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <ChevronLeft size={16} />
                 </button>
                 <button 
                   onClick={() => setOffset(offset + limit)}
                   disabled={offset + limit >= total}
                   className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <ChevronRight size={16} />
                 </button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ label, subLabel, value, icon, color, trend }: any) {
   const colors: any = {
      emerald: "bg-emerald-50 border-emerald-100",
      rose: "bg-rose-50 border-rose-100",
      amber: "bg-amber-50 border-amber-100",
      indigo: "bg-indigo-50 border-indigo-100"
   };

   return (
      <div className={`p-5 rounded-2xl border ${colors[color] || "bg-white border-slate-100"} transition-all hover:shadow-md`}>
         <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5">
               {icon}
            </div>
            {trend === 'positive' && <ArrowDownLeft className="text-emerald-500" size={20} />}
            {trend === 'negative' && <ArrowUpRight className="text-rose-500" size={20} />}
         </div>
         <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
            <div className="font-medium text-slate-700 mt-1">{label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{subLabel}</div>
         </div>
      </div>
   )
}