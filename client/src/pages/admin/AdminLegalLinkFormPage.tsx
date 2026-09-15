import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { legalLinksService } from "../../services/legalLinksService";

type FormState = {
  name: string;
  file: string;
  is_active: boolean;
  display_order: string;
};

const emptyForm = (): FormState => ({
  name: "",
  file: "",
  is_active: true,
  display_order: "0",
});

export default function AdminLegalLinkFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());

  async function loadAll() {
    setError(null);
    setLoading(true);
    try {
      if (isEdit && id) {
        const { link } = await legalLinksService.getLegalLinkById(id);
        setForm({
          name: (link as any).name ?? "",
          file: (link as any).file ?? "",
          is_active: Boolean((link as any).is_active),
          display_order: String((link as any).display_order ?? 0),
        });
      } else {
        setForm(emptyForm());
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load legal link");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function validate(): string | null {
    if (!form.name.trim()) return "Name is required";
    if (!form.file.trim()) return "File/URL is required";
    const n = Number(form.display_order);
    if (!Number.isFinite(n) || n < 0) return "display_order must be a number >= 0";
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
        name: form.name.trim(),
        file: form.file.trim(),
        is_active: form.is_active,
        display_order: Number(form.display_order || 0),
      };

      if (isEdit && id) {
        await legalLinksService.adminUpdateLegalLink(id, payload);
      } else {
        await legalLinksService.adminCreateLegalLink(payload);
      }

      navigate("/admin/legal-links");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setBusy(false);
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
            {isEdit ? "Edit legal link" : "Create legal link"}
          </h1>
          <p className="text-gray-600">
            {isEdit ? "Update legal link details." : "Add a new legal document link."}
          </p>
        </div>

        <Link
          to="/admin/legal-links"
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
        <Section title="Info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name *">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={busy}
              />
            </Field>

            <Field label="Display order">
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={busy}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="File / URL *">
                <input
                  value={form.file}
                  onChange={(e) => setForm((f) => ({ ...f, file: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="https://... or /uploads/legal/..."
                  disabled={busy}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Active">
                <label className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    disabled={busy}
                  />
                  Enabled
                </label>
              </Field>
            </div>
          </div>
        </Section>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            to="/admin/legal-links"
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
            disabled={busy}
          >
            {busy ? "Saving..." : isEdit ? "Save changes" : "Create link"}
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
