// client/src/pages/admin/AdminNewsletterList.tsx
import React, { useEffect, useState } from "react";
import {
  RefreshCcw,
  Trash2,
  Mail,
  AlertCircle,
  Calendar,
  Users,
  Send,
} from "lucide-react";
import {
  newsletterService,
  type NewsletterSubscriber,
} from "../../services/newsletterService";

export default function AdminNewsletterList() {
  const [items, setItems] = useState<NewsletterSubscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await newsletterService.adminList({ limit: 300, offset: 0 });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e?.message || "Impossible de charger la liste des abonnés.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: number) => {
    if (
      !window.confirm(
        "Êtes-vous sûr(e) de vouloir supprimer cet abonné ? Cette action est irréversible."
      )
    )
      return;

    setDeletingId(id);
    setError("");
    try {
      await newsletterService.adminDelete(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      setError(e?.message || "La suppression a échoué.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("fr-BE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openMailClient = (email: string) => {
    // simple mailto (tu peux enrichir subject/body plus tard)
    const url = `mailto:${encodeURIComponent(email)}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans text-slate-800">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Abonnés Newsletter
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gérez votre audience et les inscriptions à la newsletter.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
              {loading
                ? "Synchronisation..."
                : `${total} abonnés actifs`}
            </div>

            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Main Card Content */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            // Skeleton Loader
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between animate-pulse"
                >
                  <div className="h-4 w-1/3 bg-gray-100 rounded"></div>
                  <div className="h-4 w-1/4 bg-gray-100 rounded"></div>
                  <div className="h-8 w-24 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <Users size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">
                Aucun abonné pour le moment
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                La liste est vide. Les abonnés apparaîtront ici dès qu’ils
                s’inscriront via le formulaire newsletter.
              </p>
            </div>
          ) : (
            // Table
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Abonné</th>
                    <th className="px-6 py-4">Date d’inscription</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {items.map((s) => (
                    <tr
                      key={s.id}
                      className="group transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <Mail size={16} />
                          </div>
                          <span className="font-medium text-slate-700">
                            {s.email}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {formatDate(s.created_at)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Envoyer mail */}
                          <button
                            onClick={() => openMailClient(s.email)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-slate-700 text-xs font-semibold hover:bg-gray-50 hover:text-slate-900 transition-colors"
                            title="Ouvrir la boîte mail"
                          >
                            <Send size={14} />
                            Envoyer mail
                          </button>

                          {/* Supprimer */}
                          <button
                            onClick={() => onDelete(s.id)}
                            disabled={deletingId === s.id}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Supprimer l’abonné"
                          >
                            {deletingId === s.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer hint */}
        {!loading && items.length > 0 && (
          <div className="text-center text-xs text-gray-400">
            Affichage des abonnés les plus récents
          </div>
        )}
      </div>
    </div>
  );
}
