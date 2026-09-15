// client/src/pages/admin/AdminProductFormPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  UploadCloud, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { productService } from "../../services/productService";
import type { ProductCategory } from "../../lib/types";

// --- Types ---
type StockStatus = "in_stock" | "limited" | "out_of_stock";

type FormState = {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price: string;
  compare_at_price: string;
  image_url: string;
  gallery: { image_url: string }[];
  stock_status: StockStatus;
  is_featured: boolean;
  is_new: boolean;
  ingredients: string;
  usage: string;
  suitability: string;
  formula_benefits: string;
  cure_duration: string;
  usage_advice: string;
  composition: string;
  precautions: string;
  benefitsText: string;
  category_ids: string[];
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  short_description: "",
  description: "",
  price: "",
  compare_at_price: "",
  image_url: "",
  gallery: [],
  stock_status: "in_stock",
  is_featured: false,
  is_new: false,
  ingredients: "",
  usage: "",
  suitability: "",
  formula_benefits: "",
  cure_duration: "",
  usage_advice: "",
  composition: "",
  precautions: "",
  benefitsText: "",
  category_ids: [],
});

// --- Helpers ---
function normalizeSlug(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function benefitsFromText(text: string): any[] {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines;
}

function benefitsToText(benefits: any): string {
  if (Array.isArray(benefits)) return benefits.map(String).join("\n");
  return "";
}

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);

  // Image upload state
  const [imageBusy, setImageBusy] = useState(false);

  const categoryOptions = useMemo(() => {
    const sorted = [...categories];
    sorted.sort((a: any, b: any) => {
      const ao = Number(a.display_order ?? 0);
      const bo = Number(b.display_order ?? 0);
      if (ao !== bo) return ao - bo;
      return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });
    return sorted;
  }, [categories]);

  // Auto-generate slug
  useEffect(() => {
    if (slugTouched) return;
    setForm((f) => ({ ...f, slug: normalizeSlug(f.name) }));
  }, [form.name, slugTouched]);

  // Load Data
  useEffect(() => {
    async function loadAll() {
      setError(null);
      setLoading(true);
      try {
        const cats = await productService.listCategories();
        setCategories(cats.categories || []);

        if (isEdit && id) {
          const { product } = await productService.adminGetProductById(id);
          const catIds = Array.isArray((product as any).categories)
            ? (product as any).categories.map((c: any) => c.id)
            : [];
          
          const existingGallery = Array.isArray(product.images)
            ? product.images.map((img) => ({ image_url: img.image_url }))
            : [];

          setForm({
            name: (product as any).name ?? "",
            slug: (product as any).slug ?? "",
            short_description: (product as any).short_description ?? "",
            description: (product as any).description ?? "",
            price: String((product as any).price ?? ""),
            compare_at_price: (product as any).compare_at_price == null ? "" : String((product as any).compare_at_price),
            image_url: (product as any).image_url ?? "",
            gallery: existingGallery,
            stock_status: ((product as any).stock_status ?? "in_stock") as StockStatus,
            is_featured: Boolean((product as any).is_featured),
            is_new: Boolean((product as any).is_new),
            ingredients: (product as any).ingredients ?? "",
            usage: (product as any).usage ?? "",
            suitability: (product as any).suitability ?? "",
            formula_benefits: (product as any).formula_benefits ?? "",
            cure_duration: (product as any).cure_duration ?? "",
            usage_advice: (product as any).usage_advice ?? "",
            composition: (product as any).composition ?? "",
            precautions: (product as any).precautions ?? "",
            benefitsText: benefitsToText((product as any).benefits),
            category_ids: catIds,
          });
          setSlugTouched(true);
        } else {
          setForm(emptyForm());
          setSlugTouched(false);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [id, isEdit]);

  // --- Handlers ---
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
    if (!form.name.trim()) return "Le nom du produit est requis";
    const finalSlug = normalizeSlug(form.slug || form.name);
    if (!finalSlug) return "Slug invalide";
    if (form.price.trim() === "") return "Le prix est requis";
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) return "Le prix doit être un nombre positif";
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
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        price: Number(form.price),
        compare_at_price: form.compare_at_price.trim() === "" ? null : Number(form.compare_at_price),
        image_url: form.image_url.trim() || null,
        images: form.gallery,
        stock_status: form.stock_status,
        is_featured: form.is_featured,
        is_new: form.is_new,
        ingredients: form.ingredients.trim() || null,
        usage: form.usage.trim() || null,
        suitability: form.suitability.trim() || null,
        formula_benefits: form.formula_benefits.trim() || null,
        cure_duration: form.cure_duration.trim() || null,
        usage_advice: form.usage_advice.trim() || null,
        composition: form.composition.trim() || null,
        precautions: form.precautions.trim() || null,
        benefits: benefitsFromText(form.benefitsText),
        category_ids: form.category_ids,
      };

      if (isEdit && id) {
        await productService.adminUpdateProduct(id, payload as any);
      } else {
        await productService.adminCreateProduct(payload as any);
      }
      navigate("/admin/products");
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la sauvegarde");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(file: File | null, isGallery = false) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      return setError("Format non supporté (PNG, JPG, WEBP).");
    }
    if (file.size > 4 * 1024 * 1024) return setError("Image trop volumineuse (> 4MB).");

    setError(null);
    setImageBusy(true);
    try {
      const { url } = await productService.uploadProductImage(file);
      if (isGallery) {
        setForm(f => ({ ...f, gallery: [...f.gallery, { image_url: url }] }));
      } else {
        setForm(f => ({ ...f, image_url: url }));
      }
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setImageBusy(false);
    }
  }

  // --- Render ---

  if (loading) return (
    <div className="flex h-96 w-full items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-20 z-10 bg-slate-50/90 backdrop-blur-sm py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-4">
          <Link to="/admin/products" className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEdit ? "Modifier le produit" : "Nouveau produit"}
            </h1>
            <p className="text-sm text-slate-500">
              {isEdit ? `Édition de ${form.name}` : "Remplissez les informations ci-dessous"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
            Annuler
          </Link>
          <button
            onClick={onSubmit}
            disabled={busy || imageBusy}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-full font-medium shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span>{isEdit ? "Mettre à jour" : "Enregistrer"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Informations générales</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du produit</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  placeholder="ex: Crème Hydratante Bio"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Slug URL</label>
                   <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-sm">/product/</span>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: e.target.value }); }}
                        className="w-full pl-20 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-mono text-slate-600 bg-slate-50 focus:bg-white"
                      />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Description courte</label>
                   <input
                     type="text"
                     value={form.short_description}
                     onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                     className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                     placeholder="Un résumé accrocheur..."
                   />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description complète</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-y"
                  placeholder="Détails du produit..."
                />
              </div>
            </div>
          </div>

          {/* Media Gallery Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Média</h3>
            
            {/* Cover Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Image de couverture</label>
              {form.image_url ? (
                <div className="relative group w-full h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={form.image_url} alt="Cover" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => setForm({...form, image_url: ""})} className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-indigo-100 transition-colors">
                       <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <p className="mb-1 text-sm text-slate-500 font-medium">Cliquer pour uploader la couverture</p>
                    <p className="text-xs text-slate-400">PNG, JPG, WEBP (Max 4MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0] ?? null, false)} />
                </label>
              )}
            </div>

            {/* Gallery Grid */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Galerie ({form.gallery.length})</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                 {form.gallery.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                       <img src={img.image_url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                       <button 
                         type="button" 
                         onClick={() => setForm(f => ({ ...f, gallery: f.gallery.filter((_, i) => i !== idx) }))}
                         className="absolute top-1 right-1 bg-white/90 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                       >
                         <X size={14} />
                       </button>
                    </div>
                 ))}
                 
                 {/* Upload Button for Gallery */}
                 <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all">
                    <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500 font-medium">Ajouter</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0] ?? null, true)} />
                 </label>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
             <h3 className="text-lg font-semibold text-slate-800">Détails techniques</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Ingrédients</label>
                   <textarea
                     value={form.ingredients}
                     onChange={(e) => setForm({...form, ingredients: e.target.value})}
                     className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm h-32"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Conseils d'utilisation</label>
                   <textarea
                     value={form.usage}
                     onChange={(e) => setForm({...form, usage: e.target.value})}
                     className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm h-32"
                   />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Bénéfices (Un par ligne)</label>
                   <textarea
                     value={form.benefitsText}
                     onChange={(e) => setForm({...form, benefitsText: e.target.value})}
                     placeholder={"Hydrate la peau\nRéduit les rides\n..."}
                     className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm h-32 font-mono"
                   />
                </div>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
             <h3 className="text-lg font-semibold text-slate-800">Sections de la fiche produit</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Est-ce fait pour vous ?</label>
                   <textarea
                     value={form.suitability}
                     onChange={(e) => setForm({...form, suitability: e.target.value})}
                     className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm h-36"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Ce que cette formule peut vous apporter</label>
                   <textarea
                     value={form.formula_benefits}
                     onChange={(e) => setForm({...form, formula_benefits: e.target.value})}
                     className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm h-36"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Durée de la cure</label>
                   <textarea
                     value={form.cure_duration}
                     onChange={(e) => setForm({...form, cure_duration: e.target.value})}
                     className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm h-32"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Conseils d'utilisation</label>
                   <textarea
                     value={form.usage_advice}
                     onChange={(e) => setForm({...form, usage_advice: e.target.value})}
                     className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm h-32"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Composition</label>
                   <textarea
                     value={form.composition}
                     onChange={(e) => setForm({...form, composition: e.target.value})}
                     className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm h-36"
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Précautions d'emploi</label>
                   <textarea
                     value={form.precautions}
                     onChange={(e) => setForm({...form, precautions: e.target.value})}
                     className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm h-36"
                   />
                </div>
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN (Sidebar) */}
        <div className="space-y-6">
          
          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Statut & Stock</h3>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Disponibilité</label>
                 <select
                    value={form.stock_status}
                    onChange={(e) => setForm({...form, stock_status: e.target.value as StockStatus})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                 >
                    <option value="in_stock">🟢 En stock</option>
                    <option value="limited">🟡 Stock limité</option>
                    <option value="out_of_stock">🔴 Rupture de stock</option>
                 </select>
               </div>

               <div className="space-y-2 pt-2">
                 <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${form.is_featured ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                       {form.is_featured && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={form.is_featured} onChange={(e) => setForm({...form, is_featured: e.target.checked})} />
                    <span className="text-sm font-medium text-slate-700">Mettre en avant</span>
                 </label>

                 <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${form.is_new ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                       {form.is_new && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={form.is_new} onChange={(e) => setForm({...form, is_new: e.target.checked})} />
                    <span className="text-sm font-medium text-slate-700">Marquer comme "Nouveau"</span>
                 </label>
               </div>
             </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Prix</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prix de vente</label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input
                     type="number"
                     step="0.01"
                     value={form.price}
                     onChange={(e) => setForm({...form, price: e.target.value})}
                     className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-lg font-semibold text-slate-800"
                     placeholder="0.00"
                   />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prix barré (Optionnel)</label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input
                     type="number"
                     step="0.01"
                     value={form.compare_at_price}
                     onChange={(e) => setForm({...form, compare_at_price: e.target.value})}
                     className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-slate-600"
                     placeholder="0.00"
                   />
                </div>
              </div>
            </div>
          </div>

          {/* Categories Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col h-auto">
             <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Catégories</h3>
                <Link to="/admin/product-categories" className="text-xs text-indigo-600 hover:underline">Gérer</Link>
             </div>
             
             <div className="max-h-64 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                {categoryOptions.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Aucune catégorie.</p>
                ) : (
                  categoryOptions.map((c: any) => {
                     const isChecked = form.category_ids.includes(c.id);
                     return (
                       <label key={c.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                             {isChecked && <CheckCircle2 size={10} className="text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleCategory(c.id)} />
                          <span className={`text-sm ${isChecked ? 'font-medium text-indigo-900' : 'text-slate-600'}`}>{c.name}</span>
                       </label>
                     );
                  })
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
