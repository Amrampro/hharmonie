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
  id: string;
  service_id: string;
  service_name: string;
  available_date: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "blocked";
};

export type Appointment = {
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

  book(payload: {
    service_id: string;
    slot_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    message?: string;
  }) {
    return http<{ appointment_number: string }>(apiEndpoints.appointments.book, {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    });
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

