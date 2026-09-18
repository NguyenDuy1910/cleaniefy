import type { Availability, Booking, BookingConfig } from "@/features/booking/types";
import type { PortfolioItem } from "@/features/portfolio/types";
import type { Review } from "@/features/reviews/types";
import type { Service } from "@/features/services/types";

export const TEMPLATE_KEYS = [
  "clean",
  "warm-home",
  "pro",
  "fresh-start",
  "signature",
  "eco-calm",
  "move-ready",
  "bright-home",
  "studio-luxe",
  "neighborly",
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
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

export interface PartnerSiteState {
  partner: Pick<Partner, "businessName" | "slug" | "tagline" | "serviceArea" | "profileImageUrl" | "heroImageUrl" | "about">;
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

export interface PublicSite extends PartnerSiteState {
  partner: Partner;
}

export interface PublishRequirement {
  key: "businessName" | "slug" | "service";
  label: string;
  complete: boolean;
}

export interface PublishReadiness {
  ready: boolean;
  requirements: PublishRequirement[];
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
  publishReadiness: PublishReadiness;
}
