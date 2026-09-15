// client/src/pages/admin/AdminBlogPostFormPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { blogService, BlogCategory } from "../../services/blogService";
import { RichTextEditor } from "../../components/RichTextEditor";


type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;

  image_url: string; // MUST be https://... (returned by upload endpoint)
  reading_time: string; // input as string
  is_published: boolean;

  category_ids: string[];
};

const emptyForm = (): FormState => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image_url: "",
  reading_time: "5",
  is_published: false,
  category_ids: [],
});

function normalizeSlug(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


export default function AdminBlogPostFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);

  // upload state
  const [imageBusy, setImageBusy] = useState(false);
  const [imageMeta, setImageMeta] = useState<{
    name?: string;
    sizeKb?: number;
  } | null>(null);

  const categoryOptions = useMemo(() => {
    const sorted = [...categories];
    sorted.sort((a, b) => {
      const ao = Number(a.display_order ?? 0);
      const bo = Number(b.display_order ?? 0);
      if (ao !== bo) return ao - bo;
      return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });
    return sorted;
  }, [categories]);

  // auto slug from title
  useEffect(() => {
    if (slugTouched) return;
    setForm((f) => ({ ...f, slug: normalizeSlug(f.title) }));
  }, [form.title, slugTouched]);

  async function loadAll() {
    setError(null);
    setLoading(true);
    try {
      const cats = await blogService.listCategories();
      setCategories(cats.categories || []);

      if (isEdit && id) {
        const { post } = await blogService.adminGetPostById(id);

        const catIds = Array.isArray((post as any).categories)
          ? (post as any).categories.map((c: any) => c.id)
          : [];

        setForm({
          title: (post as any).title ?? "",
          slug: (post as any).slug ?? "",
          excerpt: (post as any).excerpt ?? "",
          content: (post as any).content ?? "",
          image_url: (post as any).image_url ?? "",
          reading_time: String((post as any).reading_time ?? 5),
          is_published: Boolean((post as any).published_at),
          category_ids: catIds,
        });

        setSlugTouched(true);
      } else {
        setForm(emptyForm());
        setSlugTouched(false);
        setImageMeta(null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load form data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function toggleCategory(catId: string) {
    setForm((f) => {
      const exists = f.category_ids.includes(catId);
      return {
        ...f,
        category_ids: exists
          ? f.category_ids.filter((x) => x !== catId)
          : [...f.category_ids, catId],
      };
    });
  }

  function validate(): string | null {
    if (!form.title.trim()) return "Title is required";
    const finalSlug = normalizeSlug(form.slug || form.title);
    if (!finalSlug) return "Invalid slug";

    if (!form.content.trim()) return "Content is required";

    const rt = Number(form.reading_time);
    if (!Number.isFinite(rt) || rt <= 0)
      return "Reading time must be a number > 0";

    // image_url should be https://... OR empty
    if (form.image_url && !/^https?:\/\//i.test(form.image_url)) {
      return "Image URL must be a valid http(s) URL (it is returned by upload).";
    }

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
        title: form.title.trim(),
        slug: normalizeSlug(form.slug || form.title),
        excerpt: form.excerpt.trim() || null,
        content: form.content.trim(),
        image_url: form.image_url.trim() || null, // https://... from upload
        reading_time: Number(form.reading_time) || 5,
        published_at: form.is_published
          ? new Date().toISOString().slice(0, 19).replace("T", " ")
          : null,
        category_ids: form.category_ids,
      };

      if (isEdit && id) {
        await blogService.adminUpdatePost(id, payload as any);
      } else {
        await blogService.adminCreatePost(payload as any);
      }

      navigate("/admin/blog-posts");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePickImage(file: File | null) {
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Unsupported image type. Use PNG, JPG, JPEG, or WEBP.");
      return;
    }

    const maxBytes = 3 * 1024 * 1024; // 3MB
    if (file.size > maxBytes) {
      setError("Image is too large. Please choose an image under 3MB.");
      return;
    }

    setError(null);
    setImageBusy(true);
    try {
      // ✅ upload to your API => returns https://your-domain/uploads/...
      const { url } = await blogService.uploadBlogImage(file);

      setForm((f) => ({ ...f, image_url: url }));
      setImageMeta({ name: file.name, sizeKb: Math.round(file.size / 1024) });
    } catch (e: any) {
      setError(e?.message || "Image upload failed");
    } finally {
      setImageBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-6 text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEdit ? "Edit post" : "Create post"}
          </h1>
          <p className="text-gray-600">
            {isEdit
              ? "Update post details."
              : "Fill the form to create a new post."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/blog"
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Back to list
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="bg-white border rounded-xl p-5 space-y-5"
      >
        <Section title="Basic information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title *">
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
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
                Auto-generated from title unless edited.
              </div>
            </Field>

            <div className="md:col-span-2">
              <Field label="Excerpt">
                <textarea
                  value={form.excerpt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, excerpt: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border min-h-[80px] focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={busy}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              {/* <Field label="Content *">
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border min-h-[220px] focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={busy}
                />
              </Field> */}
              <Field label="Content *">
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                  disabled={busy}
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Image">
          <Field label="Featured image (choose from device → upload → store URL)">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt="Selected"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="text-xs text-gray-400">No image</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    disabled={busy || imageBusy}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      e.currentTarget.value = "";
                      handlePickImage(file);
                    }}
                  />
                  {imageBusy
                    ? "Uploading..."
                    : form.image_url
                    ? "Change image"
                    : "Choose image"}
                </label>

                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, image_url: "" }));
                      setImageMeta(null);
                    }}
                    className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    disabled={busy || imageBusy}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {imageMeta && (
              <div className="text-xs text-gray-500 mt-2">
                {imageMeta.name} • {imageMeta.sizeKb} KB
              </div>
            )}

            {form.image_url && (
              <div className="text-[11px] text-gray-400 mt-1">
                Stored in DB as URL:{" "}
                <span className="break-all">{form.image_url}</span>
              </div>
            )}
          </Field>
        </Section>

        <Section title="Meta">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Reading time (minutes)">
              <input
                type="number"
                min={1}
                step={1}
                value={form.reading_time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reading_time: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={busy}
              />
            </Field>

            <Field label="Status">
              <label className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_published: e.target.checked }))
                  }
                  disabled={busy}
                />
                Published
              </label>
              <div className="text-xs text-gray-500 mt-1">
                If checked, we send a published_at value (you can still
                publish/unpublish from list page too).
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Categories">
          {categoryOptions.length === 0 ? (
            <div className="text-sm text-gray-600">
              No categories found. Create categories first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {categoryOptions.map((c) => {
                const checked = form.category_ids.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={[
                      "flex items-center gap-2 p-3 rounded-lg border cursor-pointer",
                      checked
                        ? "bg-gray-50 border-gray-300"
                        : "bg-white hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(c.id)}
                      disabled={busy}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {c.name}
                      </div>
                      <div className="text-xs text-gray-500">{c.slug}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </Section>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            to="/admin/blog"
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
            disabled={busy || imageBusy}
          >
            {busy ? "Saving..." : isEdit ? "Save changes" : "Create post"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ----------- UI helpers ----------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="font-semibold text-gray-900">{title}</div>
      <div>{children}</div>
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
