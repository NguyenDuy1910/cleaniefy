import { and, eq, gt, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  availabilityRules,
  bookingConfig,
  bookings,
  partners,
  services,
} from "@/db/schema";
import {
  BookingConflictError,
  DomainError,
  PartnerNotFoundError,
  ServiceNotFoundError,
  isUniqueViolation,
} from "@/lib/errors";
import { serializeAvailability, serializeBooking, serializeBookingConfig, serializeService } from "@/features/partner/serializers";
import { AvailabilitySchema, BookingConfigSchema, CreatePublicBookingSchema } from "./schema";

export type AvailabilityRule = {
  weekdays: number[];
  startTime: string;
  endTime: string;
  slotIntervalMinutes: number;
};

export function dayBounds(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function atTime(day: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hours, minutes));
}

export function slotStarts(
  rule: AvailabilityRule,
  date: string,
  durationMinutes: number,
  occupied: Array<{ scheduledStart: Date; scheduledEnd: Date }>,
  now = new Date(),
) {
  const { start: day } = dayBounds(date);
  if (!rule.weekdays.includes(day.getUTCDay())) return [];
  const opens = atTime(day, rule.startTime);
  const closes = atTime(day, rule.endTime);
  const slots: Date[] = [];
  for (let candidate = opens; candidate.getTime() + durationMinutes * 60_000 <= closes.getTime(); candidate = new Date(candidate.getTime() + rule.slotIntervalMinutes * 60_000)) {
    const candidateEnd = new Date(candidate.getTime() + durationMinutes * 60_000);
    const conflicts = occupied.some(({ scheduledStart, scheduledEnd }) => candidate < scheduledEnd && candidateEnd > scheduledStart);
    if (candidate >= now && !conflicts) slots.push(candidate);
  }
  return slots;
}

export async function createPublicBooking(slug: string, input: unknown) {
  const data = CreatePublicBookingSchema.parse(input);
  try {
    return await db().transaction(async (tx) => {
      const [partner] = await tx
        .select()
        .from(partners)
        .where(and(eq(partners.slug, slug), eq(partners.status, "published")))
        .for("update");
      if (!partner) throw new PartnerNotFoundError();
      const [[service], [rule], [config]] = await Promise.all([
        tx.select().from(services).where(and(eq(services.id, data.serviceId), eq(services.partnerId, partner.id), eq(services.active, true))),
        tx.select().from(availabilityRules).where(eq(availabilityRules.partnerId, partner.id)),
        tx.select().from(bookingConfig).where(eq(bookingConfig.partnerId, partner.id)),
      ]);
      if (!service) throw new ServiceNotFoundError();
      if (!rule || !config) throw new PartnerNotFoundError("This Cleanie page has incomplete booking settings.");
      const requiredValues = {
        phone: data.customerPhone,
        email: data.customerEmail,
        address: data.customerAddress,
        notes: data.notes,
      };
      for (const [field, value] of Object.entries(requiredValues)) {
        if (config.requiredFields[field as keyof typeof requiredValues] && !value) {
          throw new DomainError(`${field[0]?.toUpperCase()}${field.slice(1)} is required for this booking.`, 422);
        }
      }
      const start = new Date(data.scheduledStart);
      const date = start.toISOString().slice(0, 10);
      const { start: dayStart, end: dayEnd } = dayBounds(date);
      const occupied = await tx
        .select({ scheduledStart: bookings.scheduledStart, scheduledEnd: bookings.scheduledEnd })
        .from(bookings)
        .where(and(eq(bookings.partnerId, partner.id), ne(bookings.status, "cancelled"), lt(bookings.scheduledStart, dayEnd), gt(bookings.scheduledEnd, dayStart)));
      const validSlot = slotStarts(rule, date, service.durationMinutes, occupied).some((slot) => slot.getTime() === start.getTime());
      if (!validSlot) throw new BookingConflictError();
      const [booking] = await tx
        .insert(bookings)
        .values({
          partnerId: partner.id,
          serviceId: service.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone || null,
          customerEmail: data.customerEmail || null,
          customerAddress: data.customerAddress || null,
          notes: data.notes || null,
          scheduledStart: start,
          scheduledEnd: new Date(start.getTime() + service.durationMinutes * 60_000),
          priceCents: service.priceCents,
        })
        .returning();
      return serializeBooking(booking, serializeService(service));
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new BookingConflictError();
    throw error;
  }
}

export async function updatePartnerAvailability(partnerId: string, input: unknown) {
  const data = AvailabilitySchema.parse(input);
  const [rule] = await db()
    .update(availabilityRules)
    .set(data)
    .where(eq(availabilityRules.partnerId, partnerId))
    .returning();
  if (!rule) throw new DomainError("This Cleanie page has incomplete booking settings.", 409);
  return serializeAvailability(rule);
}

export async function updatePartnerBookingConfig(partnerId: string, input: unknown) {
  const data = BookingConfigSchema.parse(input);
  const [config] = await db()
    .update(bookingConfig)
    .set(data)
    .where(eq(bookingConfig.partnerId, partnerId))
    .returning();
  if (!config) throw new DomainError("This Cleanie page has incomplete booking settings.", 409);
  return serializeBookingConfig(config);
}
