// client/src/pages/admin/AdminProductsListPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productService } from "../../services/productService";
import type { Product } from "../../lib/types";

export default function AdminProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const { products } = await productService.listProducts({
        search: search.trim() || undefined,
        featured: featuredOnly ? true : undefined,
        limit: 200,
        offset: 0,
      });
      setProducts(products || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p: any) =>
      String(p.name ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  async function handleDelete(p: Product) {
    const ok = window.confirm(
      `Delete "${(p as any).name}"?\n\nThis action is irreversible.`
    );
    if (!ok) return;

    setError(null);
    setBusy(true);
    try {
      await productService.adminDeleteProduct((p as any).id);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  function onSubmitSearch(e: React.FormEvent) {
    e.preventDefault();
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
          <p className="text-gray-600">
            Manage products: view, create, edit, delete.
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
        >
          + New product
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <form onSubmit={onSubmitSearch} className="flex flex-col md:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name..."
            className="flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
          />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
            />
            Featured only
          </label>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
            disabled={loading || busy}
          >
            Search
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
          <div className="font-medium text-gray-900">
            Products ({filtered.length})
          </div>
          {(loading || busy) && (
            <div className="text-sm text-gray-500">
              {loading ? "Loading..." : "Working..."}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Image</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Featured</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    {/* ✅ Image */}
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              // fallback if URL is broken
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="text-xs text-gray-400">No img</div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.name}
                      {p.short_description ? (
                        <div className="text-xs text-gray-500 line-clamp-1">
                          {p.short_description}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-gray-700">{p.slug}</td>

                    <td className="px-4 py-3 text-gray-700">
                      {Number(p.price ?? 0).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {p.stock_status || "in_stock"}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {p.is_featured ? "Yes" : "No"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p)}
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
