// client/src/services/contactService.ts
import { apiEndpoints } from "./apiEndpoints";
import { http } from "./http";

export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export const contactService = {
  send(payload: ContactPayload) {
    return http<{ success: true; message: string }>(apiEndpoints.contact.send, {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false, // ✅ page publique
    });
  },
};
