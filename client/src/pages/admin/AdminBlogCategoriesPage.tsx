// client/src/pages/admin/AdminBlogCategoriesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { blogService, BlogCategory } from "../../services/blogService";

type FormState = {
  id?: string; // when present => edit
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: string; // keep as string for input
  parent_id: string; // "" means null
};

const emptyForm = (): FormState => ({
  id: undefined,
  name: "",
  slug: "",
  description: "",
  image_url: "",
  display_order: "0",
  parent_id: "",
});

function normalizeSlug(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminBlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);

  // auto-slug from name unless touched
  useEffect(() => {
    if (slugTouched) return;
    setForm((f) => ({ ...f, slug: normalizeSlug(f.name) }));
  }, [form.name, slugTouched]);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const data = await blogService.listCategories();
      setCategories(data.categories || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const name = String(c.name ?? "").toLowerCase();
      const slug = String(c.slug ?? "").toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [categories, search]);

  const parentOptions = useMemo(() => {
    const sorted = [...categories];
    sorted.sort((a, b) => {
      const ao = Number(a.display_order ?? 0);
      const bo = Number(b.display_order ?? 0);
      if (ao !== bo) return ao - bo;
      return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });
    return sorted;
  }, [categories]);

  function resetForm() {
    setForm(emptyForm());
    setSlugTouched(false);
  }

  function startEdit(cat: BlogCategory) {
    setForm({
      id: cat.id,
      name: cat.name ?? "",
      slug: cat.slug ?? "",
      description: cat.description ?? "",
      image_url: cat.image_url ?? "",
      display_order: String(cat.display_order ?? 0),
      parent_id: cat.parent_id ?? "",
    });
    setSlugTouched(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Name is required";
    const finalSlug = normalizeSlug(form.slug || form.name);
    if (!finalSlug) return "Invalid slug";

    const order = Number(form.display_order);
    if (!Number.isFinite(order) || order < 0) return "Display order must be a number >= 0";

    if (form.parent_id && form.id && form.parent_id === form.id)
      return "Parent cannot be the same category";

    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) return setError(v);

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: normalizeSlug(form.slug || form.name),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        display_order: Number(form.display_order) || 0,
        parent_id: form.parent_id ? form.parent_id : null,
      };

      if (form.id) {
        await blogService.adminUpdateCategory(form.id, payload as any);
      } else {
        await blogService.adminCreateCategory(payload as any);
      }

      await refresh();
      resetForm();
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(cat: BlogCategory) {
    const ok = window.confirm(
      `Delete "${cat.name}"?\n\nIf it's linked to blog posts, the API will refuse deletion.`
    );
    if (!ok) return;

    setError(null);
    setBusy(true);
    try {
      await blogService.adminDeleteCategory(cat.id);
      await refresh();
      if (form.id === cat.id) resetForm();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const formTitle = form.id ? "Edit blog category" : "Create blog category";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Blog categories</h1>
          <p className="text-gray-600">Create, edit and delete blog categories.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-white border rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-gray-900">{formTitle}</div>
          {form.id ? (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
              disabled={busy}
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name *">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
              disabled={busy}
            />
          </Field>

          <Field label="Slug *">
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: e.target.value }));
              }}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
              disabled={busy}
            />
            <div className="text-xs text-gray-500 mt-1">
              Auto-generated from name unless edited.
            </div>
          </Field>

          <Field label="Display order">
            <input
              type="number"
              min={0}
              step={1}
              value={form.display_order}
              onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
              disabled={busy}
            />
          </Field>

          <Field label="Parent category">
            <select
              value={form.parent_id}
              onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
              disabled={busy}
            >
              <option value="">— None —</option>
              {parentOptions
                .filter((c) => !form.id || c.id !== form.id) // cannot parent itself
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </option>
                ))}
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border min-h-[90px] focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={busy}
              />
            </Field>
          </div>

          <Field label="Image URL">
            <input
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
              disabled={busy}
            />
          </Field>

          <Field label="Preview">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="text-xs text-gray-400">No image</div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {form.image_url ? "Image loaded from URL" : "Add an image URL to preview"}
              </div>
            </div>
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
            disabled={busy}
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
            disabled={busy}
          >
            {busy ? "Saving..." : form.id ? "Save changes" : "Create category"}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="bg-white border rounded-xl">
        <div className="px-4 py-3 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="font-medium text-gray-900">
            Categories ({filtered.length})
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category..."
            className="w-full md:w-80 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
            disabled={busy}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Image</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-left px-4 py-3">Parent</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-gray-500">
                    Loading categories...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-gray-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const parentName =
                    c.parent_id
                      ? categories.find((x) => x.id === c.parent_id)?.name || "—"
                      : "—";

                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                          {c.image_url ? (
                            <img
                              src={c.image_url}
                              alt={c.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="text-xs text-gray-400">No img</div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900">
                        {c.name}
                        {c.description ? (
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {c.description}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-gray-700">{c.slug}</td>
                      <td className="px-4 py-3 text-gray-700">{parentName}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {Number(c.display_order ?? 0)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                            disabled={busy}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            disabled={busy}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t text-xs text-gray-500">
          Note: deletion can fail if the category is linked to blog posts (API returns 409).
        </div>
      </div>
    </div>
  );
}

/* ----------- UI helpers ----------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-800 mb-1">{label}</div>
      {children}
    </label>
  );
}
