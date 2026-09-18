import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  availabilityRules,
  bookingConfig,
  bookings,
  partners,
  partnerSiteConfig,
  portfolioItems,
  reviews,
  services,
} from "@/db/schema";
import { PartnerNotFoundError } from "@/lib/errors";
import type { Overview, PartnerSiteState, PublicSite } from "@/lib/types";
import { toPartnerSiteState } from "@/components/preview/preview-messages";
import {
  serializeAvailability,
  serializeBooking,
  serializeBookingConfig,
  serializePartner,
  serializePortfolio,
  serializeReview,
  serializeService,
  serializeSiteConfig,
} from "./serializers";
import { publishedPartnerCondition } from "./conditions";

type SiteRelations = Pick<PublicSite, "site" | "services" | "portfolio" | "reviews" | "availability" | "booking">;

async function getSiteRelations(partnerId: string, includeInactiveServices: boolean): Promise<SiteRelations> {
  const client = db();
  const [configRows, availabilityRows, bookingRows, serviceRows, portfolioRows, reviewRows] = await Promise.all([
    client.select().from(partnerSiteConfig).where(eq(partnerSiteConfig.partnerId, partnerId)),
    client.select().from(availabilityRules).where(eq(availabilityRules.partnerId, partnerId)),
    client.select().from(bookingConfig).where(eq(bookingConfig.partnerId, partnerId)),
    client
      .select()
      .from(services)
      .where(includeInactiveServices ? eq(services.partnerId, partnerId) : and(eq(services.partnerId, partnerId), eq(services.active, true)))
      .orderBy(asc(services.sortOrder), asc(services.name)),
    client.select().from(portfolioItems).where(eq(portfolioItems.partnerId, partnerId)).orderBy(asc(portfolioItems.sortOrder)),
    client.select().from(reviews).where(eq(reviews.partnerId, partnerId)).orderBy(desc(reviews.featured), asc(reviews.id)),
  ]);
  const config = configRows[0];
  const availability = availabilityRows[0];
  const booking = bookingRows[0];
  if (!config || !availability || !booking) {
    throw new PartnerNotFoundError("This Cleanie page has incomplete setup data.");
  }
  return {
    site: serializeSiteConfig(config),
    services: serviceRows.map(serializeService),
    portfolio: portfolioRows.map(serializePortfolio),
    reviews: reviewRows.map(serializeReview),
    availability: serializeAvailability(availability),
    booking: serializeBookingConfig(booking),
  };
}

export async function getPublicPartnerSite(slug: string): Promise<PublicSite> {
  const [partner] = await db()
    .select()
    .from(partners)
    .where(publishedPartnerCondition(slug));
  if (!partner) throw new PartnerNotFoundError();

  const relations = await getSiteRelations(partner.id, false);
  const rating = relations.reviews.length
    ? relations.reviews.reduce((sum, review) => sum + review.rating, 0) / relations.reviews.length
    : 5;
  return {
    partner: serializePartner(partner),
    ...relations,
    metrics: {
      rating: Math.round(rating * 10) / 10,
      reviewCount: relations.reviews.length,
      completedJobs: 0,
      views: 0,
    },
  };
}

export async function getPartnerPreviewSite(partnerId: string): Promise<PartnerSiteState> {
  const [partner] = await db().select().from(partners).where(eq(partners.id, partnerId));
  if (!partner) throw new PartnerNotFoundError();
  const relations = await getSiteRelations(partnerId, true);
  const rating = relations.reviews.length
    ? relations.reviews.reduce((sum, review) => sum + review.rating, 0) / relations.reviews.length
    : 5;
  return toPartnerSiteState({
    partner: serializePartner(partner),
    ...relations,
    metrics: { rating: Math.round(rating * 10) / 10, reviewCount: relations.reviews.length, completedJobs: 0, views: 0 },
  });
}

export async function getPartnerOverview(partnerId: string): Promise<Overview> {
  const client = db();
  const [partner] = await client.select().from(partners).where(eq(partners.id, partnerId));
  if (!partner) throw new PartnerNotFoundError();
  const [relations, bookingCountRows] = await Promise.all([
    getSiteRelations(partner.id, true),
    client.select({ value: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.partnerId, partner.id)),
  ]);
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);
  const todayRows = await client
    .select({ booking: bookings, service: services })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.partnerId, partner.id), gte(bookings.scheduledStart, startOfToday), lt(bookings.scheduledStart, startOfTomorrow)))
    .orderBy(asc(bookings.scheduledStart));
  const activeService = relations.services.some((service) => service.active);
  const rating = relations.reviews.length
    ? relations.reviews.reduce((sum, review) => sum + review.rating, 0) / relations.reviews.length
    : 5;
  return {
    partner: serializePartner(partner),
    ...relations,
    metrics: {
      views: 0,
      bookingCount: bookingCountRows[0]?.value ?? 0,
      rating: Math.round(rating * 10) / 10,
    },
    todayBookings: todayRows.map(({ booking, service }) => serializeBooking(booking, service ? serializeService(service) : null)),
    publishReadiness: {
      ready: Boolean(partner.businessName.trim()) && Boolean(partner.slug) && activeService,
      requirements: [
        { key: "businessName", label: "Business name", complete: Boolean(partner.businessName.trim()) },
        { key: "slug", label: "Cleanie link", complete: Boolean(partner.slug) },
        { key: "service", label: "One visible service", complete: activeService },
      ],
    },
  };
}

export async function getPartnerBookings(partnerId: string) {
  const rows = await db()
    .select({ booking: bookings, service: services })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.partnerId, partnerId))
    .orderBy(desc(bookings.scheduledStart));
  return rows.map(({ booking, service }) => serializeBooking(booking, service ? serializeService(service) : null));
}
