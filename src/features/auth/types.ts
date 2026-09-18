import type { Partner } from "@/features/partner/types";

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; isAdmin: boolean };
  partner: Partner;
}
