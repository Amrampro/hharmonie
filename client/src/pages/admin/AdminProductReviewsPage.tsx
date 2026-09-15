import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productService, type ProductReview } from "../../services/productService";

export default function AdminProductReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({ email: "", product_id: "", rating: "" });
  const [reviews, setReviews] = useState<(ProductReview & { product_name?: string; product_slug?: string })[]>([]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const { reviews } = await productService.adminListProductReviews({
        email: filters.email.trim() || undefined,
        product_id: filters.product_id.trim() || undefined,
        rating: filters.rating.trim() ? Number(filters.rating) : undefined,
        limit: 200,
        offset: 0,
      });
      setReviews(reviews as any);
    } catch (e: any) {
      setError(e?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    setBusyId(id);
    try {
      await productService.adminDeleteProductReview(id);
      setReviews((r) => r.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Product reviews</h1>
          <p className="text-gray-600">View and delete customer reviews.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={load} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">{error}</div>
      )}

      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="px-3 py-2 rounded-lg border"
          placeholder="Filter by email"
          value={filters.email}
          onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          className="px-3 py-2 rounded-lg border"
          placeholder="Filter by product_id"
          value={filters.product_id}
          onChange={(e) => setFilters((f) => ({ ...f, product_id: e.target.value }))}
        />
        <input
          className="px-3 py-2 rounded-lg border"
          placeholder="Filter by rating (1..5)"
          value={filters.rating}
          onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value }))}
        />

        <div className="md:col-span-3 flex justify-end">
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
          >
            Apply filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">Loading...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">No reviews found.</div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Rating</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Created</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    {r.product_slug ? (
                      <Link to={`/products/${r.product_slug}`} className="text-blue-600 hover:underline">
                        {r.product_name || r.product_slug}
                      </Link>
                    ) : (
                      <span className="text-gray-600">{r.product_id}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{r.customer_name}</div>
                    <div className="text-gray-600">{r.customer_email}</div>
                  </td>
                  <td className="p-3">{Number(r.rating)}</td>
                  <td className="p-3">{r.title || "-"}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onDelete(r.id)}
                      disabled={busyId === r.id}
                      className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      {busyId === r.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
