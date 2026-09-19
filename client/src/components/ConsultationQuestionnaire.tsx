import type { Dispatch, SetStateAction } from "react";
import { consultationReasonLabels } from "../services/appointmentService";

export const emptyConsultationForm = () => ({
  first_name: "", last_name: "", email: "", phone: "",
  gender: "", age: "", baby_project: "", main_concern: "", consulted_professional: "",
  exams_description: "", has_diagnosis: "", diagnosis_details: "",
  consultation_reasons: [] as string[], consultation_reason_other: "",
});
type Form = ReturnType<typeof emptyConsultationForm>;

export function ConsultationQuestionnaire({ form, setForm, documents, setDocuments, onError }: {
  form: Form;
  setForm: Dispatch<SetStateAction<Form>>;
  documents: File[];
  setDocuments: Dispatch<SetStateAction<File[]>>;
  onError: (message: string) => void;
}) {
  const change = (field: keyof Form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const yesNo = (field: "baby_project" | "consulted_professional" | "has_diagnosis") => (
    <div className="consultation-choices">
      {[["yes", "Oui"], ["no", "Non"]].map(([value, label]) => (
        <label key={value}><input required type="radio" name={field} value={value} checked={form[field] === value} onChange={() => setForm((current) => ({ ...current, [field]: value, ...(field === "has_diagnosis" && value === "no" ? { diagnosis_details: "" } : {}) }))} />{label}</label>
      ))}
    </div>
  );
  return <div className="consultation-questionnaire">
    <p>Les champs marqués d’un astérisque (*) sont obligatoires. Les documents d’examens sont facultatifs.</p>
    <fieldset><legend>1. Vous êtes : *</legend>
      <div className="consultation-choices">{[["female", "Femme"], ["male", "Homme"]].map(([value, label]) => (
        <label key={value}><input required type="radio" name="gender" value={value} checked={form.gender === value} onChange={() => change("gender", value)} />{label}</label>
      ))}</div>
    </fieldset>
    <label className="consultation-question">2. Quel âge avez-vous ? *
      <input required type="number" min="1" max="120" step="1" value={form.age} onChange={(e) => change("age", e.target.value)} />
    </label>
    <fieldset><legend>3. Êtes-vous actuellement en projet bébé ? *</legend>{yesNo("baby_project")}</fieldset>
    <label className="consultation-question">4. Quelle est votre principale préoccupation ? *
      <textarea required rows={5} maxLength={10000} value={form.main_concern} onChange={(e) => change("main_concern", e.target.value)} />
    </label>
    <fieldset><legend>5. Avez-vous déjà consulté un gynécologue, urologue ou autre professionnel de santé ? *</legend>{yesNo("consulted_professional")}</fieldset>
    <div className="consultation-question">
      <label>6. Quels examens avez-vous déjà réalisés ?
        <textarea rows={4} maxLength={10000} placeholder="Précisez les examens réalisés, ou indiquez « Aucun »." value={form.exams_description} onChange={(e) => change("exams_description", e.target.value)} />
      </label>
      <label>Joindre vos résultats d’examens (facultatif)
        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-describedby="consultation-document-help" onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (documents.length + picked.length > 3) return onError("Vous pouvez joindre au maximum 3 documents.");
          if (picked.some((file) => !["application/pdf", "image/jpeg", "image/png"].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024)) return onError("Choisissez des documents PDF, JPG ou PNG non vides de 5 Mo maximum chacun.");
          setDocuments((current) => [...current, ...picked]);
          onError("");
        }} />
      </label>
      <small id="consultation-document-help">3 documents maximum, 5 Mo par document. Accessibles uniquement à l’administration H&H.</small>
      <ul className="consultation-documents">{documents.map((file, index) => <li key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" onClick={() => setDocuments((current) => current.filter((_, position) => position !== index))} aria-label={`Retirer ${file.name}`}>Retirer</button></li>)}</ul>
    </div>
    <fieldset><legend>7. Avez-vous reçu un diagnostic ? *</legend>{yesNo("has_diagnosis")}
      {form.has_diagnosis === "yes" && <label className="consultation-question">Précisez le diagnostic *<textarea required rows={3} maxLength={10000} value={form.diagnosis_details} onChange={(e) => change("diagnosis_details", e.target.value)} /></label>}
    </fieldset>
    <fieldset><legend>8. Pourquoi souhaitez-vous une consultation en naturopathie ? *</legend>
      <small>Plusieurs réponses possibles.</small>
      <div className="consultation-reasons">{Object.entries(consultationReasonLabels).map(([value, label]) => <label key={value}>
        <input type="checkbox" checked={form.consultation_reasons.includes(value)} onChange={(e) => setForm((current) => ({ ...current,
          consultation_reasons: e.target.checked ? [...current.consultation_reasons, value] : current.consultation_reasons.filter((reason) => reason !== value),
          ...(value === "other" && !e.target.checked ? { consultation_reason_other: "" } : {}),
        }))} />{label}
      </label>)}</div>
      {form.consultation_reasons.includes("other") && <label className="consultation-question">Précisez votre autre motif *<textarea required rows={3} maxLength={2000} value={form.consultation_reason_other} onChange={(e) => change("consultation_reason_other", e.target.value)} /></label>}
    </fieldset>
  </div>;
}
