import type { Booking, BookingPayload } from "@/lib/types";

export class PublicApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new PublicApiError(body?.error ?? "Something went wrong. Please try again.", response.status);
  }
  return response.json() as Promise<T>;
}

export function getAvailability(slug: string, date: string, serviceId?: string) {
  const query = new URLSearchParams({ date });
  if (serviceId) query.set("serviceId", serviceId);
  return request<{ date: string; slots: string[] }>(`/api/public/${encodeURIComponent(slug)}/availability?${query}`);
}

export function createBooking(slug: string, payload: BookingPayload) {
  return request<Booking>(`/api/public/${encodeURIComponent(slug)}/bookings`, { method: "POST", body: JSON.stringify(payload) });
}
