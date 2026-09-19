import type { Booking, BookingPayload, PartnerSiteState, Service } from "@/lib/types";
import { createBooking, getAvailability, getPreviewAvailability } from "./client";
import { CreatePublicBookingSchema, requiredBookingFieldError } from "./schema";

export type SiteRuntimeMode = "preview" | "published";

export interface SiteActions {
  getAvailability(site: PartnerSiteState, date: string, service: Service | null, signal: AbortSignal): Promise<string[]>;
  createBooking(site: PartnerSiteState, input: BookingPayload): Promise<Booking | void>;
}

const publishedActions: SiteActions = {
  async getAvailability(site, date, service, signal) {
    const result = await getAvailability(site.partner.slug, date, service?.id, signal);
    return result.slots;
  },
  async createBooking(site, input) {
    return createBooking(site.partner.slug, input);
  },
};

const previewActions: SiteActions = {
  async getAvailability(site, date, service, signal) {
    if (!service) return [];
    const result = await getPreviewAvailability(date, site.availability, service.durationMinutes, signal);
    return result.slots;
  },
  async createBooking(site, input) {
    const result = CreatePublicBookingSchema.safeParse(input);
    if (!result.success) throw new Error(result.error.issues[0]?.message ?? "Check your booking details.");
    const requiredError = requiredBookingFieldError(site.booking, input);
    if (requiredError) throw new Error(requiredError);
    const service = site.services.find((item) => item.active && item.id === input.serviceId);
    if (!service) throw new Error("Choose an available service.");
    const selected = result.data.scheduledStart;
    const date = selected.toISOString().slice(0, 10);
    const available = await getPreviewAvailability(date, site.availability, service.durationMinutes);
    if (!available.slots.includes(selected.toISOString())) {
      throw new Error("That preview time is no longer available. Choose another time.");
    }
  },
};

export function siteActions(mode: SiteRuntimeMode): SiteActions {
  return mode === "preview" ? previewActions : publishedActions;
}
