// client/src/services/userService.ts
import { apiEndpoints } from "./apiEndpoints";
import { http } from "./http";

export type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_admin: boolean;
  created_at?: string;
};

export const userService = {
  getProfile() {
    return http<{ user: UserProfile }>(apiEndpoints.auth.profile, {
      method: "GET",
      auth: true,
    });
  },

  updateProfile(payload: { firstName?: string; lastName?: string; phone?: string }) {
    return http<{ message: string; user: UserProfile }>(apiEndpoints.auth.profile, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    });
  },
};