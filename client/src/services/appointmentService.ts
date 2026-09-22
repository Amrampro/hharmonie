import { apiEndpoints } from "./apiEndpoints";
import { http } from "./http";

export type AppointmentService = {
  id: string;
  name: string;
  short_description: string | null;
  description: string | null;
  duration_minutes: number;
  price: number;
  meeting_type: "online" | "physical" | "phone" | "hybrid";
  is_active: boolean;
  display_order: number;
};

export type AppointmentSlot = {
  price: number;
  id: string;
  service_id: string;
  service_name: string;
  available_date: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "blocked";
};

export type Appointment = {
  amount_cents: number | null;
  payment_status: "free" | "pending" | "paid" | "expired" | null;
  id: string;
  appointment_number: string;
  service_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  available_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  gender: "female" | "male" | null;
  age: number | null;
  baby_project: number | boolean | null;
  main_concern: string | null;
  consulted_professional: number | boolean | null;
  exams_description: string | null;
  has_diagnosis: number | boolean | null;
  diagnosis_details: string | null;
  consultation_reasons: string[];
  consultation_reason_other: string | null;
  documents: AppointmentDocument[];
};

export type AppointmentDocument = { id: string; original_name: string; content_type: string; size_bytes: number };
export const consultationReasonLabels: Record<string, string> = {
  medical_followup: "Compléter mon suivi médical",
  natural_approach: "Approche naturelle complémentaire",
  lifestyle: "Hygiène de vie",
  baby_project: "Projet bébé",
  other: "Autre",
};

export type ConsultationPayload = {
  service_id: string; slot_id: string; first_name: string; last_name: string; email: string; phone: string;
  gender: string; age: number; baby_project: boolean; main_concern: string;
  consulted_professional: boolean; exams_description: string; has_diagnosis: boolean;
  diagnosis_details: string; consultation_reasons: string[]; consultation_reason_other: string;
};

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    sp.set(key, String(value));
  });
  const value = sp.toString();
  return value ? `?${value}` : "";
}

export const appointmentService = {
  listServices() {
    return http<{ services: AppointmentService[] }>(apiEndpoints.appointments.services, { auth: false });
  },

  listSlots(params: { serviceId?: string } = {}) {
    return http<{ slots: AppointmentSlot[] }>(`${apiEndpoints.appointments.slots}${qs(params)}`, { auth: false });
  },

  async book(payload: ConsultationPayload, documents: File[] = []): Promise<{ appointment_number: string; checkout_url: string | null; payment_status: string }> {
    const body = new FormData();
    body.append("data", JSON.stringify(payload));
    documents.forEach((file) => body.append("documents", file));
    const response = await fetch(apiEndpoints.appointments.book, {
      method: "POST",
      body,
    });
    const data = response.headers.get("content-type")?.includes("application/json") ? await response.json() : null;
    if (!response.ok) throw new Error(data?.error || (response.status === 413 ? "Les documents dépassent la taille autorisée par le serveur." : "Impossible d’enregistrer le rendez-vous."));
    return data;
  },

  paymentStatus(sessionId: string) {
    return http<{ appointment_number: string; status: string; payment_status: string; checkout_url: string | null }>(`${apiEndpoints.appointments.book.replace(/\/book$/, "")}/payment/${encodeURIComponent(sessionId)}`, { auth: false });
  },

  async adminDownloadDocument(document: AppointmentDocument) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${apiEndpoints.appointments.admin.list}/documents/${encodeURIComponent(document.id)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!response.ok) throw new Error("Impossible de télécharger le document. Vérifiez votre connexion administrateur.");
    const url = URL.createObjectURL(await response.blob());
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.original_name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  adminListAppointments() {
    return http<{ appointments: Appointment[] }>(apiEndpoints.appointments.admin.list);
  },

  adminListServices() {
    return http<{ services: AppointmentService[] }>(apiEndpoints.appointments.admin.services);
  },

  adminCreateService(payload: Partial<AppointmentService>) {
    return http<{ service: AppointmentService }>(apiEndpoints.appointments.admin.services, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  adminCreateSlot(payload: {
    service_id: string;
    available_date: string;
    start_time: string;
    end_time: string;
    status?: string;
    price: number;
  }) {
    return http<{ slot: AppointmentSlot }>(apiEndpoints.appointments.admin.slots, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  adminUpdateSlot(id: string, payload: Partial<AppointmentSlot>) {
    return http<{ slot: AppointmentSlot }>(apiEndpoints.appointments.admin.slot(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  adminDeleteSlot(id: string) {
    return http<{ success: true }>(apiEndpoints.appointments.admin.slot(id), {
      method: "DELETE",
    });
  },
};
