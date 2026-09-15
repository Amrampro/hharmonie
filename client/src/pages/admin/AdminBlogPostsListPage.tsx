// client/src/pages/admin/AdminBlogPostsListPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { blogService, BlogCategory, BlogPost } from "../../services/blogService";

export default function AdminBlogPostsListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "published" | "draft">("");
  const [categorySlug, setCategorySlug] = useState("");

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const [cats, list] = await Promise.all([
        blogService.listCategories(),
        blogService.adminListPosts({
          status: status || undefined,
          category: categorySlug || undefined,
          search: search.trim() || undefined,
          limit: 200,
          offset: 0,
        }),
      ]);

      setCategories(cats.categories || []);
      setPosts(list.posts || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    // backend already filters but keep fast UX while typing
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => String(p.title ?? "").toLowerCase().includes(q));
  }, [posts, search]);

  async function handleDelete(p: BlogPost) {
    const ok = window.confirm(`Delete "${p.title}"?\n\nThis action is irreversible.`);
    if (!ok) return;

    setError(null);
    setBusy(true);
    try {
      await blogService.adminDeletePost(p.id);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(p: BlogPost) {
    setError(null);
    setBusy(true);
    try {
      if (p.published_at) {
        await blogService.adminUnpublishPost(p.id);
      } else {
        await blogService.adminPublishPost(p.id);
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Action failed");
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
          <h1 className="text-2xl font-semibold text-gray-900">Blog posts</h1>
          <p className="text-gray-600">Manage posts: create, edit, publish, delete.</p>
        </div>

        <Link
          to="/admin/blog-posts/new"
          className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
        >
          + New post
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <form onSubmit={onSubmitFilters} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title / content..."
            className="md:col-span-2 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} ({c.slug})
              </option>
            ))}
          </select>

          <div className="md:col-span-4 flex gap-2">
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
          </div>
        </form>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-medium text-gray-900">Posts ({filtered.length})</div>
          {(loading || busy) && (
            <div className="text-sm text-gray-500">{loading ? "Loading..." : "Working..."}</div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Image</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Views</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-gray-500">
                    Loading posts...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-gray-500">
                    No posts found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.title}
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

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.title}
                      {p.excerpt ? (
                        <div className="text-xs text-gray-500 line-clamp-1">{p.excerpt}</div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-gray-700">{p.slug}</td>

                    <td className="px-4 py-3">
                      {p.published_at ? (
                        <span className="px-2 py-1 rounded-md text-xs bg-green-50 text-green-700 border border-green-200">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-xs bg-gray-50 text-gray-700 border">
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-700">{Number(p.views ?? 0)}</td>

                    <td className="px-4 py-3 text-gray-700">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/blog-posts/${p.id}/edit`}
                          className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => togglePublish(p)}
                          className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                          disabled={busy}
                        >
                          {p.published_at ? "Unpublish" : "Publish"}
                        </button>

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
