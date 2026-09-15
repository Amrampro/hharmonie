import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { legalLinksService } from "../../services/legalLinksService";

export default function AdminLegalLinksListPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeOnly, setActiveOnly] = useState(false);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const { links } = await legalLinksService.listLegalLinks({
        active: activeOnly ? true : undefined,
      });
      setLinks(links || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load legal links");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => links, [links]);

  async function handleDelete(l: any) {
    const ok = window.confirm(
      `Delete legal link?\n\n${l.name}\n\nThis action is irreversible.`
    );
    if (!ok) return;

    setError(null);
    setBusy(true);
    try {
      await legalLinksService.adminDeleteLegalLink(l.id);
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
          <h1 className="text-2xl font-semibold text-gray-900">Legal Links</h1>
          <p className="text-gray-600">Manage footer legal documents/links.</p>
        </div>

        <Link
          to="/admin/legal-links/new"
          className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
        >
          + New legal link
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <form onSubmit={onSubmitFilters} className="flex flex-col md:flex-row gap-3">
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
          <div className="font-medium text-gray-900">Links ({filtered.length})</div>
          {(loading || busy) && (
            <div className="text-sm text-gray-500">{loading ? "Loading..." : "Working..."}</div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">File / URL</th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-gray-500">
                    Loading links...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-gray-500">
                    No legal links found.
                  </td>
                </tr>
              ) : (
                filtered.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>

                    <td className="px-4 py-3 text-gray-700">
                      <div className="max-w-[520px] truncate">{l.file}</div>
                    </td>

                    <td className="px-4 py-3 text-gray-700">{l.is_active ? "Yes" : "No"}</td>

                    <td className="px-4 py-3 text-gray-700">{Number(l.display_order ?? 0)}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/legal-links/${l.id}/edit`}
                          className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(l)}
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
