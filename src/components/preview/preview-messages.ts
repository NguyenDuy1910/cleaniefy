import { z } from "zod";
import { TEMPLATE_KEYS, type Overview, type PartnerSiteState, type PublicSite } from "@/features/partner/types";

const previewSiteSchema = z.object({
  partner: z.object({
    businessName: z.string(),
    serviceCategory: z.string(),
    slug: z.string(),
    tagline: z.string(),
    serviceArea: z.string(),
    profileImageUrl: z.string().nullish(),
    heroImageUrl: z.string().nullish(),
    instagramUrl: z.string().nullish(),
    about: z.string().nullish(),
  }),
  site: z.object({
    template: z.enum(TEMPLATE_KEYS),
    theme: z.object({
      primaryColor: z.string(),
      backgroundTone: z.enum(["light", "warm", "cool"]),
      fontPreset: z.enum(["modern", "soft"]),
      buttonStyle: z.enum(["soft", "pill"]),
    }),
    sections: z.object({
      services: z.boolean(), portfolio: z.boolean(), reviews: z.boolean(), about: z.boolean(),
    }),
  }),
  services: z.array(z.object({
    id: z.string(), name: z.string(), description: z.string(), priceCents: z.number().finite(), priceMode: z.enum(["fixed", "from"]),
    durationMinutes: z.number().finite(), active: z.boolean(), sortOrder: z.number().finite(),
  })).max(100),
  portfolio: z.array(z.object({
    id: z.string(), serviceId: z.string().nullish(), beforeImageUrl: z.string(), afterImageUrl: z.string(),
    caption: z.string().nullish(), sortOrder: z.number().finite(),
  })).max(100),
  reviews: z.array(z.object({
    id: z.string(), author: z.string(), rating: z.number().finite(), text: z.string(),
    source: z.enum(["google", "manual"]), sourceUrl: z.string().nullish(), featured: z.boolean(),
  })).max(100),
  availability: z.object({
    weekdays: z.array(z.number().int().min(0).max(6)), startTime: z.string(),
    endTime: z.string(), slotIntervalMinutes: z.number().finite(),
  }),
  booking: z.object({
    ctaLabel: z.string(),
    requiredFields: z.object({
      name: z.boolean(), phone: z.boolean(), email: z.boolean(), address: z.boolean(), notes: z.boolean(),
    }),
    paymentMode: z.enum(["none", "deposit", "full"]),
    confirmationMessage: z.string(),
  }),
  metrics: z.object({
    rating: z.number().finite(), reviewCount: z.number().finite(),
    completedJobs: z.number().finite(), views: z.number().finite(),
  }),
});

export type PreviewMessage =
  | { type: "CLEANIE_PREVIEW_STATE"; payload: PartnerSiteState }
  | { type: "CLEANIE_PREVIEW_RESET" };
export type PreviewEvent = { type: "CLEANIE_PREVIEW_READY" };

export function parsePreviewMessage(value: unknown): PreviewMessage | null {
  if (!value || typeof value !== "object" || !("type" in value)) return null;
  if (value.type === "CLEANIE_PREVIEW_RESET") return { type: value.type };
  if (value.type !== "CLEANIE_PREVIEW_STATE" || !("payload" in value)) return null;
  const parsed = previewSiteSchema.safeParse(value.payload);
  return parsed.success ? { type: value.type, payload: parsed.data } : null;
}

export function toPartnerSiteState(source: Overview | PublicSite): PartnerSiteState {
  const { partner, site, services, portfolio, reviews, availability, booking, metrics } = source;
  return {
    partner: {
      businessName: partner.businessName, serviceCategory: partner.serviceCategory, slug: partner.slug, tagline: partner.tagline,
      serviceArea: partner.serviceArea, profileImageUrl: partner.profileImageUrl,
      heroImageUrl: partner.heroImageUrl, instagramUrl: partner.instagramUrl, about: partner.about,
    },
    site: {
      template: site.template,
      theme: { ...site.theme },
      sections: { ...site.sections },
    },
    services: services.map(({ id, name, description, priceCents, priceMode, durationMinutes, active, sortOrder }) =>
      ({ id, name, description, priceCents, priceMode, durationMinutes, active, sortOrder })),
    portfolio: portfolio.map(({ id, serviceId, beforeImageUrl, afterImageUrl, caption, sortOrder }) =>
      ({ id, serviceId, beforeImageUrl, afterImageUrl, caption, sortOrder })),
    reviews: reviews.map(({ id, author, rating, text, source: reviewSource, sourceUrl, featured }) =>
      ({ id, author, rating, text, source: reviewSource, sourceUrl, featured })),
    availability: { ...availability, weekdays: [...availability.weekdays] },
    booking: { ...booking, requiredFields: { ...booking.requiredFields } },
    metrics: {
      rating: metrics.rating,
      reviewCount: reviews.length,
      completedJobs: "bookingCount" in metrics ? metrics.bookingCount : metrics.completedJobs,
      views: metrics.views,
    },
  };
}
