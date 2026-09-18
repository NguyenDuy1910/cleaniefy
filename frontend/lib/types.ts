export type TemplateKey =
  | "clean"
  | "warm-home"
  | "pro"
  | "fresh-start"
  | "signature"
  | "eco-calm"
  | "move-ready"
  | "bright-home"
  | "studio-luxe"
  | "neighborly";
export type FontPreset = "modern" | "soft";
export type ButtonStyle = "soft" | "pill";

export interface ThemeConfig {
  primaryColor: string;
  backgroundTone: "light" | "warm" | "cool";
  fontPreset: FontPreset;
  buttonStyle: ButtonStyle;
}
export interface SectionConfig {
  services: boolean;
  portfolio: boolean;
  reviews: boolean;
  about: boolean;
}
export interface Partner {
  id: string;
  businessName: string;
  slug: string;
  tagline: string;
  serviceArea: string;
  profileImageUrl?: string | null;
  heroImageUrl?: string | null;
  about?: string | null;
  status: "draft" | "published" | "suspended";
  publishedAt?: string | null;
}
export interface Service {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  durationMinutes: number;
  active: boolean;
  sortOrder: number;
}
export interface PortfolioItem {
  id: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  caption?: string | null;
  sortOrder: number;
}
export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  source: "google" | "manual";
  sourceUrl?: string | null;
  featured: boolean;
}
export interface Availability {
  weekdays: number[];
  startTime: string;
  endTime: string;
  slotIntervalMinutes: number;
}
export interface BookingConfig {
  ctaLabel: string;
  requiredFields: {
    name: boolean;
    phone: boolean;
    email: boolean;
    address: boolean;
    notes: boolean;
  };
  paymentMode: "none" | "deposit" | "full";
  confirmationMessage: string;
}
export interface PublicSite {
  partner: Partner;
  site: { template: TemplateKey; theme: ThemeConfig; sections: SectionConfig };
  services: Service[];
  portfolio: PortfolioItem[];
  reviews: Review[];
  availability: Availability;
  booking: BookingConfig;
  metrics: {
    rating: number;
    reviewCount: number;
    completedJobs: number;
    views: number;
  };
}
export interface Overview {
  partner: Partner;
  site: { template: TemplateKey; theme: ThemeConfig; sections: SectionConfig };
  services: Service[];
  portfolio: PortfolioItem[];
  reviews: Review[];
  availability: Availability;
  booking: BookingConfig;
  metrics: { views: number; bookingCount: number; rating: number };
  todayBookings: Booking[];
}
export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  priceCents: number;
  status: string;
  service?: Service | null;
}
export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; isAdmin: boolean };
  partner: Partner;
}
export interface BookingPayload {
  serviceId: string;
  scheduledStart: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
}
