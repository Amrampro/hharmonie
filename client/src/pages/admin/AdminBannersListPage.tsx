import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bannerService } from "../../services/bannerService";

type BannerPageName = "shop" | "home" | "about" | "faqs" | "contact" | "approach" | "consultation" | "events";

export default function AdminBannersListPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pageName, setPageName] = useState<BannerPageName | "">("");
  const [activeOnly, setActiveOnly] = useState(false);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const { banners } = await bannerService.listBanners({
        page_name: pageName ? (pageName as BannerPageName) : undefined,
        active: activeOnly ? true : undefined,
      });
      setBanners(banners || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    // API already filters, this just keeps UI fast if you later add text search
    return banners;
  }, [banners]);

  async function handleDelete(b: any) {
    const ok = window.confirm(
      `Delete banner?\n\nPage: ${b.page_name}\nTitle: ${b.title || "(no title)"}\n\nThis action is irreversible.`
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      await bannerService.adminDeleteBanner(b.id);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  function onSubmitFilters(e: React.FormEvent) {
    e.preventDefault();
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Banners</h1>
          <p className="text-gray-600">Manage banners per page (create, edit, delete).</p>
        </div>

        <Link
          to="/admin/banners/new"
          className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
        >
          + New banner
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <form onSubmit={onSubmitFilters} className="flex flex-col md:flex-row gap-3">
          <select
            value={pageName}
            onChange={(e) => setPageName(e.target.value as any)}
            className="px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
            disabled={loading || busy}
          >
            <option value="">All pages</option>
            <option value="home">home</option>
            <option value="shop">shop</option>
            <option value="about">about</option>
            <option value="approach">approach</option>
            <option value="consultation">consultation</option>
            <option value="events">events</option>
            <option value="faqs">faqs</option>
            <option value="contact">contact</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              disabled={loading || busy}
            />
            Active only
          </label>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
            disabled={loading || busy}
          >
            Apply
          </button>

          <button
            type="button"
            onClick={refresh}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
            disabled={loading || busy}
          >
            Refresh
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-medium text-gray-900">Banners ({filtered.length})</div>
          {(loading || busy) && (
            <div className="text-sm text-gray-500">{loading ? "Loading..." : "Working..."}</div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Image</th>
                <th className="text-left px-4 py-3">Page</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-gray-500">
                    Loading banners...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-gray-500">
                    No banners found.
                  </td>
                </tr>
              ) : (
                filtered.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-14 h-10 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                        {b.background_img ? (
                          <img
                            src={b.background_img}
                            alt={b.title || "Banner"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="text-xs text-gray-400">No img</div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-700">{b.page_name}</td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{b.title || "(no title)"}</div>
                      {b.subtitle ? (
                        <div className="text-xs text-gray-500 line-clamp-1">{b.subtitle}</div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-gray-700">{b.is_active ? "Yes" : "No"}</td>

                    <td className="px-4 py-3 text-gray-700">{Number(b.display_order ?? 0)}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/banners/${b.id}/edit`}
                          className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(b)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
