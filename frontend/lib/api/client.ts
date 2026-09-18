import type { AuthResponse, Availability, Booking, BookingConfig, BookingPayload, Overview, Partner, PortfolioItem, PublicSite, Review, SectionConfig, Service, TemplateKey, ThemeConfig } from "@/lib/types";

const browserBase = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
const backendOrigin = (process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const serverBase = `${backendOrigin}/api/v1`;

export class ApiError extends Error { constructor(message: string, public status: number, public detail?: unknown) { super(message); } }

async function request<T>(path: string, options: RequestInit = {}, server = false): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("cleanie_token") : null;
  const response = await fetch(`${server ? serverBase : browserBase}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    cache: options.cache ?? "no-store",
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { detail?: string } | null;
    throw new ApiError(detail?.detail || "Something went wrong. Please try again.", response.status, detail);
  }
  return response.json() as Promise<T>;
}

export const getPublicPartner = (slug: string) => request<PublicSite>(`/public/partners/${encodeURIComponent(slug)}`, { next: { revalidate: 60 } }, true);
export const getAvailability = (slug: string, date: string, serviceId?: string) => request<{ date: string; slots: string[] }>(`/public/partners/${encodeURIComponent(slug)}/availability?date=${date}${serviceId ? `&service_id=${encodeURIComponent(serviceId)}` : ""}`);
export const createBooking = (slug: string, payload: BookingPayload) => request<Booking>(`/public/partners/${encodeURIComponent(slug)}/bookings`, { method: "POST", body: JSON.stringify(payload) });
export const getSlugAvailability = (slug: string) => request<{ slug: string; available: boolean; reason?: string }>(`/partners/slug-availability?slug=${encodeURIComponent(slug)}`);
export const login = (email: string, password: string) => request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const signUp = (email: string, password: string, businessName: string) => request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify({ email, password, businessName }) });
export const getPartnerOverview = () => request<Overview>("/partners/me");
export const updatePartnerProfile = (body: Partial<Pick<Partner, "businessName" | "slug" | "tagline" | "serviceArea" | "profileImageUrl" | "heroImageUrl" | "about">>) => request<Partner>("/partners/me", { method: "PATCH", body: JSON.stringify(body) });
export const updateTheme = (body: { template?: TemplateKey; theme?: Partial<ThemeConfig> }) => request<Overview["site"]>("/partners/me/theme", { method: "PUT", body: JSON.stringify(body) });
export const updateSections = (body: SectionConfig) => request<SectionConfig>("/partners/me/sections", { method: "PUT", body: JSON.stringify(body) });
export const createService = (body: Omit<Service, "id" | "sortOrder">) => request<Service>("/partners/me/services", { method: "POST", body: JSON.stringify(body) });
export const updateService = (id: string, body: Partial<Omit<Service, "id">>) => request<Service>(`/partners/me/services/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const deleteService = (id: string) => request<void>(`/partners/me/services/${id}`, { method: "DELETE" });
export const createPortfolioItem = (body: Omit<PortfolioItem, "id" | "sortOrder">) => request<PortfolioItem>("/partners/me/portfolio", { method: "POST", body: JSON.stringify(body) });
export const deletePortfolioItem = (id: string) => request<void>(`/partners/me/portfolio/${id}`, { method: "DELETE" });
export const createReview = (body: Omit<Review, "id">) => request<Review>("/partners/me/reviews", { method: "POST", body: JSON.stringify(body) });
export const deleteReview = (id: string) => request<void>(`/partners/me/reviews/${id}`, { method: "DELETE" });
export const updateAvailability = (body: Availability) => request<Availability>("/partners/me/availability", { method: "PUT", body: JSON.stringify(body) });
export const updateBookingConfig = (body: BookingConfig) => request<BookingConfig>("/partners/me/booking-config", { method: "PUT", body: JSON.stringify(body) });
export const publishPartner = () => request<Partner>("/partners/me/publish", { method: "POST" });
export const getBookings = () => request<Booking[]>("/partners/me/bookings");
export const getAdminPartners = () => request<Partner[]>("/admin/partners");
export const getAdminBookings = () => request<Booking[]>("/admin/bookings");
export const uploadMedia = async (file: File, purpose: "profile" | "hero" | "before" | "after") => {
  const token = localStorage.getItem("cleanie_token");
  const form = new FormData(); form.append("file", file); form.append("purpose", purpose);
  const response = await fetch(`${browserBase}/partners/me/media`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new ApiError(body?.detail || "Image upload failed.", response.status); }
  return response.json() as Promise<{ url: string }>;
};
