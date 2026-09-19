import { Buffer } from "node:buffer";

const reasons = new Set(["medical_followup", "natural_approach", "lifestyle", "baby_project", "other"]);
const invalid = (message) => { throw Object.assign(new Error(message), { statusCode: 400 }); };

export function validateConsultation(body, files = []) {
  const text = (key, label, max, required = false) => {
    const value = body[key] ?? "";
    if (typeof value !== "string" || value.trim().length > max) invalid(`${label} : texte invalide ou trop long (maximum ${max} caractères).`);
    if (required && !value.trim()) invalid(`${label} est obligatoire.`);
    return value.trim() || null;
  };
  const boolean = (key, label) => {
    if (body[key] === true || body[key] === 1) return 1;
    if (body[key] === false || body[key] === 0) return 0;
    invalid(`Répondez par oui ou non : ${label}.`);
  };
  const result = {
    service_id: text("service_id", "L’accompagnement", 36, true),
    slot_id: text("slot_id", "Le créneau", 36, true),
    first_name: text("first_name", "Le prénom", 100, true),
    last_name: text("last_name", "Le nom", 100, true),
    email: text("email", "L’e-mail", 190, true),
    phone: text("phone", "Le téléphone", 30),
    gender: body.gender,
    age: body.age,
    baby_project: boolean("baby_project", "projet bébé"),
    main_concern: text("main_concern", "La préoccupation principale", 10000, true),
    consulted_professional: boolean("consulted_professional", "consultation d’un professionnel de santé"),
    exams_description: text("exams_description", "Les examens réalisés", 10000),
    has_diagnosis: boolean("has_diagnosis", "diagnostic reçu"),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) invalid("L’adresse e-mail est invalide.");
  if (!["female", "male"].includes(result.gender)) invalid("Veuillez sélectionner Femme ou Homme.");
  if (!Number.isInteger(result.age) || result.age < 1 || result.age > 120) invalid("L’âge doit être un nombre entier compris entre 1 et 120.");
  result.diagnosis_details = result.has_diagnosis ? text("diagnosis_details", "Le diagnostic", 10000, true) : null;
  if (!Array.isArray(body.consultation_reasons) || !body.consultation_reasons.length || body.consultation_reasons.some((reason) => !reasons.has(reason))) {
    invalid("Sélectionnez au moins un motif de consultation parmi les choix proposés.");
  }
  result.consultation_reasons = [...new Set(body.consultation_reasons)];
  result.consultation_reason_other = result.consultation_reasons.includes("other") ? text("consultation_reason_other", "L’autre motif", 2000, true) : null;
  if (files.length > 3) invalid("Vous pouvez joindre au maximum 3 documents.");
  for (const file of files) {
    if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0 || file.buffer.length > 5 * 1024 * 1024) invalid("Chaque document doit faire entre 1 octet et 5 Mo.");
    const signature = file.buffer;
    const pdf = file.mimetype === "application/pdf" && signature.subarray(0, 5).toString() === "%PDF-";
    const jpg = file.mimetype === "image/jpeg" && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
    const png = file.mimetype === "image/png" && signature.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (!pdf && !jpg && !png) invalid("Les pièces jointes doivent être des fichiers PDF, JPG ou PNG valides.");
  }
  return result;
}
