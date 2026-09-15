// client/src/pages/admin/AdminFaqsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { faqsService, type Faq } from "../../services/faqsService";

type FormState = {
  id?: string; // when set => edit
  question: string;
  answer: string;
  category: string;
  display_order: string; // keep as string for input
};

const emptyForm = (): FormState => ({
  id: undefined,
  question: "",
  answer: "",
  category: "",
  display_order: "0",
});

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // list filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // form
  const [form, setForm] = useState<FormState>(emptyForm());

  const isEdit = Boolean(form.id);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const { faqs } = await faqsService.listFaqs({
        search: search.trim() || undefined,
        category: categoryFilter.trim() || undefined,
        limit: 500,
        offset: 0,
      });
      setFaqs(faqs || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const f of faqs) {
      const c = String(f.category ?? "").trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [faqs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cat = categoryFilter.trim().toLowerCase();

    return faqs.filter((f) => {
      const matchesSearch =
        !q ||
        String(f.question ?? "").toLowerCase().includes(q) ||
        String(f.answer ?? "").toLowerCase().includes(q) ||
        String(f.category ?? "").toLowerCase().includes(q);

      const matchesCategory =
        !cat || String(f.category ?? "").toLowerCase() === cat;

      return matchesSearch && matchesCategory;
    });
  }, [faqs, search, categoryFilter]);

  function startCreate() {
    setError(null);
    setForm(emptyForm());
  }

  function startEdit(f: Faq) {
    setError(null);
    setForm({
      id: f.id,
      question: String(f.question ?? ""),
      answer: String(f.answer ?? ""),
      category: String(f.category ?? ""),
      display_order: String((f as any).display_order ?? 0),
    });
  }

  function validate(): string | null {
    if (!form.question.trim()) return "Question is required";
    if (!form.answer.trim()) return "Answer is required";
    const n = Number(form.display_order);
    if (!Number.isFinite(n) || n < 0) return "Display order must be a number >= 0";
    if (form.question.trim().length > 500) return "Question must be <= 500 chars";
    if (form.category.trim().length > 100) return "Category must be <= 100 chars";
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
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category.trim() ? form.category.trim() : null,
        display_order: Number(form.display_order) || 0,
      };

      if (isEdit && form.id) {
        await faqsService.adminUpdateFaq(form.id, payload);
      } else {
        await faqsService.adminCreateFaq(payload as any);
      }

      await refresh();
      startCreate();
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(f: Faq) {
    const ok = window.confirm(
      `Delete this FAQ?\n\nQuestion:\n${String(f.question ?? "").slice(0, 120)}\n\nThis action is irreversible.`
    );
    if (!ok) return;

    setError(null);
    setBusy(true);
    try {
      await faqsService.adminDeleteFaq(f.id);
      // if deleting currently edited FAQ, reset form
      if (form.id === f.id) startCreate();
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
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">FAQs</h1>
          <p className="text-gray-600">Create, edit and delete frequently asked questions.</p>
        </div>

        <button
          onClick={startCreate}
          className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
          disabled={busy}
        >
          + New FAQ
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4">
        <form onSubmit={onSubmitFilters} className="flex flex-col md:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question, answer, category..."
            className="flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
            disabled={busy}
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
            disabled={busy}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

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

      {/* Two-column layout: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={onSubmit} className="bg-white border rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="font-semibold text-gray-900">
                {isEdit ? "Edit FAQ" : "Create FAQ"}
              </div>
              {isEdit && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="text-sm px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                  disabled={busy}
                >
                  Cancel edit
                </button>
              )}
            </div>

            <Field label="Question *">
              <input
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                maxLength={500}
                disabled={busy}
              />
              <div className="text-xs text-gray-500 mt-1">{form.question.length}/500</div>
            </Field>

            <Field label="Answer *">
              <textarea
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border min-h-[140px] focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={busy}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Category">
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                  maxLength={100}
                  placeholder="Example: Shipping"
                  disabled={busy}
                />
              </Field>

              <Field label="Display order">
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                  min={0}
                  disabled={busy}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={startCreate}
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
                {busy ? "Saving..." : isEdit ? "Save changes" : "Create"}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-3 bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-medium text-gray-900">
              FAQs ({filtered.length})
            </div>
            {loading && <div className="text-sm text-gray-500">Loading...</div>}
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="p-4 text-gray-600">Loading FAQs...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-gray-600">No FAQs found.</div>
            ) : (
              filtered.map((f) => (
                <div key={f.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">
                        {f.question || "(no question)"}
                      </div>

                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                        {f.category ? (
                          <span className="px-2 py-0.5 rounded-full border bg-white">
                            {f.category}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full border bg-white text-gray-400">
                            No category
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full border bg-white">
                          Order: {(f as any).display_order ?? 0}
                        </span>
                      </div>

                      {f.answer ? (
                        <div className="text-sm text-gray-700 mt-2 line-clamp-3">
                          {f.answer}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(f)}
                        className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
                        disabled={busy}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(f)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small UI helper ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-800 mb-1">{label}</div>
      {children}
    </label>
  );
}
