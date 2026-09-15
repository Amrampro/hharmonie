import { apiEndpoints } from "./apiEndpoints";
import { http } from "./http";

export type RelayPoint = {
  id: string;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  distance?: string | null;
};

export type RelayPointsResponse = {
  points: RelayPoint[];
};

export const mondialRelayService = {
  listPoints(params: { country: string; postcode: string; city?: string; limit?: number }) {
    const qs = new URLSearchParams();
    qs.set("country", params.country);
    qs.set("postcode", params.postcode);
    if (params.city) qs.set("city", params.city);
    if (params.limit) qs.set("limit", String(params.limit));

    return http<RelayPointsResponse>(
      `${apiEndpoints.base}/mondial-relay/points?${qs.toString()}`,
      { method: "GET", auth: false }
    );
  },
};
