import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { bannerService } from "../../services/bannerService";

type BannerPageName = "shop" | "home" | "about" | "faqs" | "contact" | "approach" | "consultation" | "events";

type FormState = {
  page_name: BannerPageName;
  title: string;
  subtitle: string;
  button: string;
  link: string;
  background_img: string; // URL returned by API upload
  is_active: boolean;
  display_order: string;
};

const emptyForm = (): FormState => ({
  page_name: "home",
  title: "",
  subtitle: "",
  button: "",
  link: "",
  background_img: "",
  is_active: true,
  display_order: "0",
});

export default function AdminBannerFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());

  // image upload states
  const [imageBusy, setImageBusy] = useState(false);
  const [imageMeta, setImageMeta] = useState<{ name?: string; sizeKb?: number } | null>(null);

  const pageOptions = useMemo<BannerPageName[]>(
    () => ["home", "shop", "approach", "about", "consultation", "events", "faqs", "contact"],
    []
  );

  async function loadAll() {
    setError(null);
    setLoading(true);
    try {
      if (isEdit && id) {
        const { banner } = await bannerService.getBannerById(id);
        setForm({
          page_name: (banner as any).page_name ?? "home",
          title: (banner as any).title ?? "",
          subtitle: (banner as any).subtitle ?? "",
          button: (banner as any).button ?? "",
          link: (banner as any).link ?? "",
          background_img: (banner as any).background_img ?? "",
          is_active: Boolean((banner as any).is_active),
          display_order: String((banner as any).display_order ?? 0),
        });
      } else {
        setForm(emptyForm());
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load banner");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function validate(): string | null {
    if (!form.page_name) return "page_name is required";
    if (!pageOptions.includes(form.page_name)) return "Invalid page_name";

    const n = Number(form.display_order);
    if (!Number.isFinite(n) || n < 0) return "display_order must be a number >= 0";

    // Optional:
    // if (!form.background_img) return "Please upload a background image";

    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) return setError(v);

    setBusy(true);
    try {
      const payload: any = {
        page_name: form.page_name,
        title: form.title.trim() || null,
        subtitle: form.subtitle.trim() || null,
        button: form.button.trim() || null,
        link: form.link.trim() || null,
        background_img: form.background_img.trim() || null,
        is_active: form.is_active,
        display_order: Number(form.display_order || 0),
      };

      if (isEdit && id) {
        await bannerService.adminUpdateBanner(id, payload);
      } else {
        await bannerService.adminCreateBanner(payload);
      }

      navigate("/admin/banners");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePickAndUpload(file: File | null) {
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Unsupported image type. Use PNG, JPG, JPEG, or WEBP.");
      return;
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      setError("Image is too large. Please choose an image under 5MB.");
      return;
    }

    setError(null);
    setImageBusy(true);
    try {
      // upload to your API => returns { url: "https://your-domain/uploads/..."}
      const { url } = await bannerService.uploadBannerImage(file);
      setForm((f) => ({ ...f, background_img: url }));
      setImageMeta({ name: file.name, sizeKb: Math.round(file.size / 1024) });
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setImageBusy(false);
    }
  }

  if (loading) {
    return <div className="bg-white border rounded-xl p-6 text-gray-600">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEdit ? "Edit banner" : "Create banner"}
          </h1>
          <p className="text-gray-600">
            {isEdit ? "Update banner content and image." : "Create a new banner for a page."}
          </p>
        </div>

        <Link
          to="/admin/banners"
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          Back to list
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white border rounded-xl p-5 space-y-5">
        <Section title="Placement & status">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Page *">
              <select
                value={form.page_name}
                onChange={(e) => setForm((f) => ({ ...f, page_name: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={busy || imageBusy}
              >
                {pageOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Display order">
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={busy || imageBusy}
              />
            </Field>

            <Field label="Active">
              <label className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  disabled={busy || imageBusy}
                />
                Enabled
              </label>
            </Field>
          </div>
        </Section>

        <Section title="Content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={busy || imageBusy}
              />
            </Field>

            <Field label="Button text">
              <input
                value={form.button}
                onChange={(e) => setForm((f) => ({ ...f, button: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={busy || imageBusy}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Subtitle">
                <textarea
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border min-h-[110px] focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={busy || imageBusy}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Button link URL">
                <input
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="https://..."
                  disabled={busy || imageBusy}
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Background image">
          <div className="flex items-center gap-4">
            <div className="w-28 h-20 rounded-xl overflow-hidden border bg-white flex items-center justify-center">
              {form.background_img ? (
                <img
                  src={form.background_img}
                  alt="Banner"
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

            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  disabled={busy || imageBusy}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    e.currentTarget.value = "";
                    handlePickAndUpload(file);
                  }}
                />
                {imageBusy ? "Uploading..." : form.background_img ? "Change image" : "Choose image"}
              </label>

              {form.background_img && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, background_img: "" }));
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

          {form.background_img && (
            <div className="text-[11px] text-gray-400 mt-1">
              Stored as URL: {form.background_img}
            </div>
          )}
        </Section>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            to="/admin/banners"
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
            disabled={busy || imageBusy}
          >
            {busy ? "Saving..." : isEdit ? "Save changes" : "Create banner"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ----------- UI helpers ----------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="font-semibold text-gray-900">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-800 mb-1">{label}</div>
      {children}
    </label>
  );
}
