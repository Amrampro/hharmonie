// client/src/pages/admin/ProductCategoriesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { productService } from "../../services/productService";
import type { ProductCategory } from "../../lib/types";

type FormState = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  parent_id: string | "";
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  description: "",
  image_url: "",
  display_order: 0,
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

function mapCategoryToForm(c: ProductCategory): FormState {
  return {
    name: (c as any).name ?? "",
    slug: (c as any).slug ?? "",
    description: (c as any).description ?? "",
    image_url: (c as any).image_url ?? "",
    display_order: Number((c as any).display_order ?? 0),
    parent_id: ((c as any).parent_id as any) ?? "",
  };
}

function getParentName(categories: ProductCategory[], parentId: any) {
  if (!parentId) return "—";
  const found = categories.find((c: any) => c.id === parentId);
  return found ? (found as any).name : "—";
}

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());
  const [createSlugTouched, setCreateSlugTouched] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductCategory | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [editSlugTouched, setEditSlugTouched] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  const sortedCategories = useMemo(() => {
    const copy = [...categories];
    copy.sort((a: any, b: any) => {
      const ao = Number(a.display_order ?? 0);
      const bo = Number(b.display_order ?? 0);
      if (ao !== bo) return ao - bo;
      const an = String(a.name ?? "").toLowerCase();
      const bn = String(b.name ?? "").toLowerCase();
      return an.localeCompare(bn);
    });
    return copy;
  }, [categories]);

  const parentOptions = useMemo(() => {
    // same list, used in create/edit (edit will filter out self)
    return sortedCategories.map((c: any) => ({
      id: c.id as string,
      name: c.name as string,
    }));
  }, [sortedCategories]);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const data = await productService.listCategories();
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

  // auto slug for create
  useEffect(() => {
    if (!createOpen) return;
    if (createSlugTouched) return;
    setCreateForm((f) => ({ ...f, slug: normalizeSlug(f.name) }));
  }, [createForm.name, createOpen, createSlugTouched]);

  // auto slug for edit
  useEffect(() => {
    if (!editOpen) return;
    if (editSlugTouched) return;
    setEditForm((f) => ({ ...f, slug: normalizeSlug(f.name) }));
  }, [editForm.name, editOpen, editSlugTouched]);

  function openCreate() {
    setCreateForm(emptyForm());
    setCreateSlugTouched(false);
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(cat: ProductCategory) {
    setEditTarget(cat);
    setEditForm(mapCategoryToForm(cat));
    setEditSlugTouched(false);
    setError(null);
    setEditOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditTarget(null);
  }

  function validateForm(form: FormState) {
    if (!form.name.trim()) return "Name is required";
    const slug = normalizeSlug(form.slug || form.name);
    if (!slug) return "Invalid slug";
    if (form.parent_id && form.parent_id.trim() === "") return "Invalid parent";
    if (Number.isNaN(Number(form.display_order))) return "display_order invalid";
    return null;
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validateForm(createForm);
    if (v) return setError(v);

    setBusy(true);
    try {
      await productService.adminCreateCategory({
        name: createForm.name.trim(),
        slug: normalizeSlug(createForm.slug || createForm.name),
        description: createForm.description.trim() || null,
        image_url: createForm.image_url.trim() || null,
        display_order: Number(createForm.display_order) || 0,
        parent_id: createForm.parent_id ? createForm.parent_id : null,
      });

      closeCreate();
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;

    setError(null);
    const v = validateForm(editForm);
    if (v) return setError(v);

    // Prevent self parent on client side too
    if (editForm.parent_id && editForm.parent_id === (editTarget as any).id) {
      return setError("parent_id cannot be same as id");
    }

    setBusy(true);
    try {
      await productService.adminUpdateCategory((editTarget as any).id, {
        name: editForm.name.trim(),
        slug: normalizeSlug(editForm.slug || editForm.name),
        description: editForm.description.trim() || null,
        image_url: editForm.image_url.trim() || null,
        display_order: Number(editForm.display_order) || 0,
        parent_id: editForm.parent_id ? editForm.parent_id : null,
      });

      closeEdit();
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(cat: ProductCategory) {
    const name = (cat as any).name || "this category";
    const ok = window.confirm(
      `Delete "${name}"?\n\nIf this category is linked to products, the API will refuse.`
    );
    if (!ok) return;

    setError(null);
    setBusy(true);
    try {
      await productService.adminDeleteCategory((cat as any).id);
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleCategoryImageUpload(file: File | null, target: "create" | "edit") {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      return setError("Format non supporté. Utilisez PNG, JPG ou WEBP.");
    }
    if (file.size > 4 * 1024 * 1024) {
      return setError("Image trop volumineuse. Maximum 4MB.");
    }

    setError(null);
    setImageBusy(true);
    try {
      const { url } = await productService.uploadProductImage(file);
      if (target === "create") {
        setCreateForm((f) => ({ ...f, image_url: url }));
      } else {
        setEditForm((f) => ({ ...f, image_url: url }));
      }
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setImageBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Catégory de produit
          </h1>
          <p className="text-gray-600">
            Add, edit, or delete product categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
            disabled={loading || busy}
          >
            Refresh
          </button>

          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
            disabled={busy}
          >
            + Add category
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-medium text-gray-900">
            Categories ({sortedCategories.length})
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
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-left px-4 py-3">Parent</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Image</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={6}>
                    Loading categories...
                  </td>
                </tr>
              ) : sortedCategories.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={6}>
                    No categories yet. Click “Add category”.
                  </td>
                </tr>
              ) : (
                sortedCategories.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {c.name}
                      {c.description ? (
                        <div className="text-xs text-gray-500 line-clamp-1">
                          {c.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.slug}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {getParentName(sortedCategories, c.parent_id)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {Number(c.display_order ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {c.image_url ? (
                        <a
                          href={c.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                          disabled={busy}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
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

      {/* ---------- Create Modal ---------- */}
      {createOpen && (
        <Modal title="Add category" onClose={closeCreate}>
          <form className="space-y-4" onSubmit={submitCreate}>
            <FormFields
              form={createForm}
              setForm={setCreateForm}
              parentOptions={parentOptions}
              excludeId={null}
              onSlugTouched={() => setCreateSlugTouched(true)}
              busy={busy}
              imageBusy={imageBusy}
              onUploadImage={(file) => handleCategoryImageUpload(file, "create")}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeCreate}
                className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
                disabled={busy}
              >
                {busy ? "Saving..." : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ---------- Edit Modal ---------- */}
      {editOpen && editTarget && (
        <Modal title="Edit category" onClose={closeEdit}>
          <form className="space-y-4" onSubmit={submitEdit}>
            <FormFields
              form={editForm}
              setForm={setEditForm}
              parentOptions={parentOptions}
              excludeId={(editTarget as any).id}
              onSlugTouched={() => setEditSlugTouched(true)}
              busy={busy}
              imageBusy={imageBusy}
              onUploadImage={(file) => handleCategoryImageUpload(file, "edit")}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeEdit}
                className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
                disabled={busy}
              >
                {busy ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ----------------- Reusable UI ----------------- */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="font-semibold text-gray-900">{title}</div>
            <button
              onClick={onClose}
              className="px-2 py-1 rounded-lg hover:bg-gray-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FormFields({
  form,
  setForm,
  parentOptions,
  excludeId,
  onSlugTouched,
  busy,
  imageBusy,
  onUploadImage,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  parentOptions: { id: string; name: string }[];
  excludeId: string | null;
  onSlugTouched: () => void;
  busy: boolean;
  imageBusy: boolean;
  onUploadImage: (file: File | null) => void;
}) {
  const filteredParents = useMemo(() => {
    if (!excludeId) return parentOptions;
    return parentOptions.filter((p) => p.id !== excludeId);
  }, [parentOptions, excludeId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Name *">
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
          placeholder="e.g. Skin care"
          disabled={busy}
        />
      </Field>

      <Field label="Slug *">
        <input
          value={form.slug}
          onChange={(e) => {
            onSlugTouched();
            setForm((f) => ({ ...f, slug: e.target.value }));
          }}
          className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
          placeholder="e.g. skin-care"
          disabled={busy}
        />
        <div className="text-xs text-gray-500 mt-1">
          Tip: leave it, it will auto-generate from name.
        </div>
      </Field>

      <Field label="Parent category">
        <select
          value={form.parent_id}
          onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
          disabled={busy}
        >
          <option value="">— None —</option>
          {filteredParents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Display order">
        <input
          type="number"
          value={form.display_order}
          onChange={(e) =>
            setForm((f) => ({ ...f, display_order: Number(e.target.value) || 0 }))
          }
          className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
          placeholder="0"
          disabled={busy}
        />
      </Field>

      <div className="md:col-span-2">
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-lg border min-h-[90px] focus:outline-none focus:ring-2 focus:ring-black/20"
            placeholder="Optional..."
            disabled={busy}
          />
        </Field>
      </div>

      <div className="md:col-span-2">
        <Field label="Image de la catégorie">
          <div className="space-y-3">
            {form.image_url ? (
              <div className="relative overflow-hidden rounded-xl border bg-gray-50">
                <img
                  src={form.image_url}
                  alt=""
                  className="h-44 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                  className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-600 shadow hover:bg-red-50"
                  disabled={busy || imageBusy}
                  aria-label="Retirer l'image"
                >
                  <X size={18} />
                </button>
              </div>
            ) : null}

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 transition hover:border-black hover:bg-white">
              <UploadCloud size={18} />
              {imageBusy ? "Envoi en cours..." : "Ajouter une image"}
              <input
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => onUploadImage(e.target.files?.[0] ?? null)}
                disabled={busy || imageBusy}
              />
            </label>

            <input
              value={form.image_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, image_url: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Ou coller une URL d'image"
              disabled={busy || imageBusy}
            />
          </div>
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-800 mb-1">{label}</div>
      {children}
    </label>
  );
}
