import type {
  Availability,
  Booking,
  BookingConfig,
  Partner,
  PortfolioItem,
  Review,
  SectionConfig,
  Service,
  ThemeConfig,
} from "@/lib/types";
import { normalizeMediaUrl } from "@/lib/blob/paths";
import type {
  availabilityRules,
  bookingConfig,
  partnerSiteConfig,
  partners,
  portfolioItems,
  reviews,
  services,
} from "@/db/schema";

export function serializePartner(row: typeof partners.$inferSelect): Partner {
  return {
    id: row.id,
    businessName: row.businessName,
    serviceCategory: row.serviceCategory,
    slug: row.slug,
    tagline: row.tagline,
    serviceArea: row.serviceArea,
    profileImageUrl: normalizeMediaUrl(row.profileImageUrl),
    heroImageUrl: normalizeMediaUrl(row.heroImageUrl),
    instagramUrl: row.instagramUrl,
    about: row.about,
    status: row.status as Partner["status"],
    publishedAt: row.publishedAt?.toISOString() ?? null,
  };
}

export function serializeService(row: typeof services.$inferSelect): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    priceMode: row.priceMode as Service["priceMode"],
    durationMinutes: row.durationMinutes,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}

export function serializePortfolio(row: typeof portfolioItems.$inferSelect): PortfolioItem {
  return {
    id: row.id,
    serviceId: row.serviceId,
    beforeImageUrl: normalizeMediaUrl(row.beforeImageUrl) ?? row.beforeImageUrl,
    afterImageUrl: normalizeMediaUrl(row.afterImageUrl) ?? row.afterImageUrl,
    caption: row.caption,
    sortOrder: row.sortOrder,
  };
}

export function serializeReview(row: typeof reviews.$inferSelect): Review {
  return {
    id: row.id,
    author: row.author,
    rating: row.rating,
    text: row.text,
    source: row.source as Review["source"],
    sourceUrl: row.sourceUrl,
    featured: row.featured,
  };
}

export function serializeAvailability(row: typeof availabilityRules.$inferSelect): Availability {
  return {
    weekdays: row.weekdays,
    startTime: row.startTime,
    endTime: row.endTime,
    slotIntervalMinutes: row.slotIntervalMinutes,
  };
}

export function serializeBookingConfig(row: typeof bookingConfig.$inferSelect): BookingConfig {
  return {
    ctaLabel: row.ctaLabel,
    requiredFields: row.requiredFields,
    paymentMode: row.paymentMode as BookingConfig["paymentMode"],
    confirmationMessage: row.confirmationMessage,
  };
}

export function serializeSiteConfig(row: typeof partnerSiteConfig.$inferSelect) {
  return {
    template: row.template as import("@/lib/types").TemplateKey,
    theme: row.themeConfig as ThemeConfig,
    sections: row.sectionsConfig as SectionConfig,
  };
}

export function serializeBooking(
  row: {
    id: string;
    customerName: string;
    customerPhone: string | null;
    customerEmail: string | null;
    customerAddress: string | null;
    notes: string | null;
    scheduledStart: Date;
    scheduledEnd: Date;
    priceCents: number;
    status: string;
  },
  service?: Service | null,
): Booking {
  return {
    id: row.id,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    customerAddress: row.customerAddress,
    notes: row.notes,
    scheduledStart: row.scheduledStart.toISOString(),
    scheduledEnd: row.scheduledEnd.toISOString(),
    priceCents: row.priceCents,
    status: row.status,
    service,
  };
}
