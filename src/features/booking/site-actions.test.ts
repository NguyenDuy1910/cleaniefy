import { afterEach, describe, expect, it, vi } from "vitest";
import type { PartnerSiteState } from "@/lib/types";
import { siteActions } from "./site-actions";

const serviceId = "00000000-0000-4000-8000-000000000001";
const site: PartnerSiteState = {
  partner: { businessName: "Example Cleaning", serviceCategory: "Home Cleaner", slug: "example", tagline: "", serviceArea: "", profileImageUrl: null, heroImageUrl: null, about: null },
  site: { template: "clean", theme: { primaryColor: "#26573d", backgroundTone: "light", fontPreset: "modern", buttonStyle: "soft" }, sections: { services: true, portfolio: true, reviews: true, about: true } },
  services: [{ id: serviceId, name: "Home cleaning", description: "", priceCents: 12000, priceMode: "fixed", durationMinutes: 60, active: true, sortOrder: 0 }],
  portfolio: [],
  reviews: [],
  availability: { weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: "09:00", endTime: "17:00", slotIntervalMinutes: 60 },
  booking: { ctaLabel: "Book now", requiredFields: { name: true, phone: false, email: false, address: false, notes: false }, paymentMode: "none", confirmationMessage: "See you soon." },
  metrics: { rating: 0, reviewCount: 0, completedJobs: 0, views: 0 },
};

afterEach(() => vi.restoreAllMocks());

describe("preview booking boundary", () => {
  it("reads occupied slots and confirms a preview without creating a booking", async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const slot = `${future}T09:00:00.000Z`;
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({ date: future, slots: [slot] }) } as Response);
    const slots = await siteActions("preview").getAvailability(site, future, site.services[0], new AbortController().signal);
    expect(slots).toEqual([slot]);
    await expect(siteActions("preview").createBooking(site, {
      serviceId,
      scheduledStart: slots[0],
      customerName: "Preview Customer",
    })).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls.every(([path]) => path === "/api/preview/availability")).toBe(true);
  });
});
