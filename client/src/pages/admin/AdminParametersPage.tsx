// client/src/pages/admin/AdminParametersPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { parameterService } from "../../services/parameterService";

type FormState = {
  promotional_text: string;

  home_text: string;
  story: string;
  mission: string;
  vision: string;
  expertise: string;

  name: string;
  email: string;
  address: string;
  phone: string;
  enterprise_number: string;

  facebook_link: string;
  instagram_link: string;
  tiktok_link: string;
  twitter_link: string;
  whatsapp_link: string;

  // ✅ new
  logo_navbar: string;
  logo_footer: string;
};

const emptyForm = (): FormState => ({
  promotional_text: "",

  home_text: "",
  story: "",
  mission: "",
  vision: "",
  expertise: "",

  name: "",
  email: "",
  address: "",
  phone: "",
  enterprise_number: "",

  facebook_link: "",
  instagram_link: "",
  tiktok_link: "",
  twitter_link: "",
  whatsapp_link: "",

  logo_navbar: "",
  logo_footer: "",
});

const toText = (v: any) => (v === null || v === undefined ? "" : String(v));
const toNull = (v: string) => (v.trim() === "" ? null : v.trim());

function isHttpUrl(v: string) {
  const s = String(v || "").trim();
  if (!s) return true;
  return /^https?:\/\/.+/i.test(s);
}

function isEmail(v: string) {
  const s = String(v || "").trim();
  if (!s) return true;
  return /^\S+@\S+\.\S+$/.test(s);
}

export default function AdminParametersPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());

  // ✅ upload states
  const [logoNavbarBusy, setLogoNavbarBusy] = useState(false);
  const [logoFooterBusy, setLogoFooterBusy] = useState(false);

  const somethingUploading = logoNavbarBusy || logoFooterBusy;

  const canSubmit = useMemo(() => !busy && !somethingUploading, [busy, somethingUploading]);

  async function load() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const { parameters } = await parameterService.get();

      if (!parameters) {
        setForm(emptyForm());
        return;
      }

      setForm({
        promotional_text: toText((parameters as any).promotional_text),

        home_text: toText((parameters as any).home_text),
        story: toText((parameters as any).story),
        mission: toText((parameters as any).mission),
        vision: toText((parameters as any).vision),
        expertise: toText((parameters as any).expertise),

        name: toText((parameters as any).name),
        email: toText((parameters as any).email),
        address: toText((parameters as any).address),
        phone: toText((parameters as any).phone),
        enterprise_number: toText((parameters as any).enterprise_number),

        facebook_link: toText((parameters as any).facebook_link),
        instagram_link: toText((parameters as any).instagram_link),
        tiktok_link: toText((parameters as any).tiktok_link),
        twitter_link: toText((parameters as any).twitter_link),
        whatsapp_link: toText((parameters as any).whatsapp_link),

        // ✅ new
        logo_navbar: toText((parameters as any).logo_navbar),
        logo_footer: toText((parameters as any).logo_footer),
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load website parameters");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function validate(): string | null {
    if (!isEmail(form.email)) return "Invalid email format";

    const urlFields: Array<{ value: string; label: string }> = [
      { value: form.facebook_link, label: "Facebook link" },
      { value: form.instagram_link, label: "Instagram link" },
      { value: form.tiktok_link, label: "TikTok link" },
      { value: form.twitter_link, label: "Twitter link" },
      { value: form.whatsapp_link, label: "WhatsApp link" },
      { value: form.logo_navbar, label: "Logo navbar URL" },
      { value: form.logo_footer, label: "Logo footer URL" },
    ];

    for (const f of urlFields) {
      if (!isHttpUrl(f.value)) return `${f.label} must start with http:// or https://`;
    }

    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setBusy(true);
    try {
      await parameterService.upsert({
        promotional_text: toNull(form.promotional_text),

        home_text: toNull(form.home_text),
        story: toNull(form.story),
        mission: toNull(form.mission),
        vision: toNull(form.vision),
        expertise: toNull(form.expertise),

        name: toNull(form.name),
        email: toNull(form.email),
        address: toNull(form.address),
        phone: toNull(form.phone),
        enterprise_number: toNull(form.enterprise_number),

        facebook_link: toNull(form.facebook_link),
        instagram_link: toNull(form.instagram_link),
        tiktok_link: toNull(form.tiktok_link),
        twitter_link: toNull(form.twitter_link),
        whatsapp_link: toNull(form.whatsapp_link),

        // ✅ new
        logo_navbar: toNull(form.logo_navbar),
        logo_footer: toNull(form.logo_footer),
      });

      setSuccess("Saved successfully ✅");
      await load();
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadLogo(kind: "navbar" | "footer", file: File | null) {
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Unsupported image type. Use PNG, JPG, JPEG, or WEBP.");
      return;
    }

    // Optional: 2MB limit
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError("Image is too large. Please choose an image under 2MB.");
      return;
    }

    setError(null);
    if (kind === "navbar") setLogoNavbarBusy(true);
    else setLogoFooterBusy(true);

    try {
      const { url } = await parameterService.uploadProductImage(file);

      if (!url || !/^https?:\/\/.+/i.test(url)) {
        throw new Error("Upload succeeded but server did not return a valid URL");
      }

      setForm((f) =>
        kind === "navbar" ? { ...f, logo_navbar: url } : { ...f, logo_footer: url }
      );
      setSuccess("Image uploaded ✅");
    } catch (e: any) {
      setError(e?.message || "Image upload failed");
    } finally {
      if (kind === "navbar") setLogoNavbarBusy(false);
      else setLogoFooterBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-xl p-6 text-gray-600">
        Loading parameters...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Paramètres du site</h1>
          <p className="text-gray-600">
            Mettez à jour ou changer les textes (et/ou) paramètres du site
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          disabled={busy || somethingUploading}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white border rounded-xl p-5 space-y-6">
        <Section title="Accueil & à propos">
          <Field label="Texte Promotionel (top bar)">
            <textarea
              value={form.promotional_text}
              onChange={(e) => setForm((f) => ({ ...f, promotional_text: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border min-h-[90px] focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Livraison gratuite en Belgique à partir de 65€..."
              disabled={busy || somethingUploading}
            />
          </Field>
          <Field label="Mère nature">
            <textarea
              value={form.home_text}
              onChange={(e) => setForm((f) => ({ ...f, home_text: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border min-h-[90px] focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Chez Novéden, nous remettons la nature au cœur de la beauté..."
              disabled={busy || somethingUploading}
            />
          </Field>
          <Field label="Notre Histoire">
            <textarea
              value={form.story}
              onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border min-h-[90px] focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="L’aventure Novéden commence avec moi..."
              disabled={busy || somethingUploading}
            />
          </Field>
          <Field label="Notre mission">
            <textarea
              value={form.mission}
              onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border min-h-[90px] focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Créer des soins naturels, respectueux de chaque type..."
              disabled={busy || somethingUploading}
            />
          </Field>
          <Field label="Notre Vision">
            <textarea
              value={form.vision}
              onChange={(e) => setForm((f) => ({ ...f, vision: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border min-h-[90px] focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Un retour à une beauté naturelle, pure, authentique et globale..."
              disabled={busy || somethingUploading}
            />
          </Field>
          <Field label="Notre expertise">
            <textarea
              value={form.expertise}
              onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border min-h-[90px] focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Chaque formule s’appuie sur des actifs végétaux rigoureusement..."
              disabled={busy || somethingUploading}
            />
          </Field>
        </Section>

        <Section title="Logos">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Navbar logo */}
            <Field label="Logo navbar">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                  {form.logo_navbar ? (
                    <img
                      src={form.logo_navbar}
                      alt="Logo navbar"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-xs text-gray-400">No logo</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      disabled={busy || logoNavbarBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        e.currentTarget.value = "";
                        uploadLogo("navbar", file);
                      }}
                    />
                    {logoNavbarBusy
                      ? "Uploading..."
                      : form.logo_navbar
                      ? "Changer"
                      : "Choisir"}
                  </label>

                  {form.logo_navbar && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, logo_navbar: "" }))}
                      className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      disabled={busy || logoNavbarBusy}
                    >
                      Rétirer
                    </button>
                  )}
                </div>
              </div>

              {form.logo_navbar && (
                <div className="text-xs text-gray-500 mt-2 break-all">
                  {form.logo_navbar}
                </div>
              )}
            </Field>

            {/* Footer logo */}
            <Field label="Logo footer">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                  {form.logo_footer ? (
                    <img
                      src={form.logo_footer}
                      alt="Logo footer"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-xs text-gray-400">No logo</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      disabled={busy || logoFooterBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        e.currentTarget.value = "";
                        uploadLogo("footer", file);
                      }}
                    />
                    {logoFooterBusy
                      ? "Uploading..."
                      : form.logo_footer
                      ? "Changer"
                      : "Choisir"}
                  </label>

                  {form.logo_footer && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, logo_footer: "" }))}
                      className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      disabled={busy || logoFooterBusy}
                    >
                      Rétirer
                    </button>
                  )}
                </div>
              </div>

              {form.logo_footer && (
                <div className="text-xs text-gray-500 mt-2 break-all">
                  {form.logo_footer}
                </div>
              )}
            </Field>
          </div>

          <div className="text-xs text-gray-500">
            Tip: after uploading, the URL is stored in the database (https://...).
          </div>
        </Section>

        <Section title="Information de l'entreprise">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nom de l'entreprise">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={!canSubmit}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={!canSubmit}
                placeholder="contact@domain.com"
              />
            </Field>

            <Field label="Téléphone (GSM)">
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={!canSubmit}
                placeholder="+32..."
              />
            </Field>

            <Field label="Numéro d'enterprise">
              <input
                value={form.enterprise_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enterprise_number: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={!canSubmit}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Adresse">
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={!canSubmit}
                  placeholder="Street, City, Country"
                />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Liens sociaux">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Lien Facebook">
              <input
                value={form.facebook_link}
                onChange={(e) => setForm((f) => ({ ...f, facebook_link: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={!canSubmit}
                placeholder="https://facebook.com/..."
              />
            </Field>

            <Field label="Lien Instagram">
              <input
                value={form.instagram_link}
                onChange={(e) =>
                  setForm((f) => ({ ...f, instagram_link: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={!canSubmit}
                placeholder="https://instagram.com/..."
              />
            </Field>

            <Field label="Lien TikTok">
              <input
                value={form.tiktok_link}
                onChange={(e) => setForm((f) => ({ ...f, tiktok_link: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={!canSubmit}
                placeholder="https://www.tiktok.com/@..."
              />
            </Field>

            <Field label="Lien Twitter/X">
              <input
                value={form.twitter_link}
                onChange={(e) => setForm((f) => ({ ...f, twitter_link: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={!canSubmit}
                placeholder="https://x.com/..."
              />
            </Field>

            <Field label="Lien WhatsApp">
              <input
                value={form.whatsapp_link}
                onChange={(e) =>
                  setForm((f) => ({ ...f, whatsapp_link: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={!canSubmit}
                placeholder="https://wa.me/..."
              />
            </Field>
          </div>
        </Section>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setForm(emptyForm())}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
            disabled={!canSubmit}
          >
            Vider
          </button>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
            disabled={!canSubmit}
          >
            {busy ? "Saving..." : "Sauvegarder"}
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
