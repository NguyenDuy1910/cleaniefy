import { and, eq, gt, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { availabilityRules, bookings, partners, services } from "@/db/schema";
import { PartnerNotFoundError, ServiceNotFoundError } from "@/lib/errors";
import { publishedPartnerCondition } from "@/features/partner/conditions";
import { dayBounds, slotStarts } from "./service";

async function getPublishedPartner(slug: string) {
  const [partner] = await db().select().from(partners).where(publishedPartnerCondition(slug));
  if (!partner) throw new PartnerNotFoundError();
  return partner;
}

export async function getPublicAvailability(slug: string, date: string, serviceId?: string) {
  const partner = await getPublishedPartner(slug);
  const client = db();
  const [rule] = await client
    .select()
    .from(availabilityRules)
    .where(eq(availabilityRules.partnerId, partner.id));
  if (!rule) throw new PartnerNotFoundError("This Cleanie page has incomplete booking settings.");

  let duration = rule.slotIntervalMinutes;
  if (serviceId) {
    const [service] = await client
      .select()
      .from(services)
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.partnerId, partner.id),
          eq(services.active, true),
        ),
      );
    if (!service) throw new ServiceNotFoundError();
    duration = service.durationMinutes;
  }

  const { start, end } = dayBounds(date);
  const occupied = await client
    .select({ scheduledStart: bookings.scheduledStart, scheduledEnd: bookings.scheduledEnd })
    .from(bookings)
    .where(
      and(
        eq(bookings.partnerId, partner.id),
        ne(bookings.status, "cancelled"),
        lt(bookings.scheduledStart, end),
        gt(bookings.scheduledEnd, start),
      ),
    );
  return {
    date,
    slots: slotStarts(rule, date, duration, occupied).map((slot) => slot.toISOString()),
  };
}
