import { and, eq, gt, lt, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { AvailabilitySchema } from "@/features/booking/schema";
import { dayBounds, slotStarts } from "@/features/booking/slots";
import { requirePartner } from "@/lib/auth/context";
import { errorMessage, errorStatus } from "@/lib/errors";

const PreviewAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.number().int().min(15).max(1440),
  availability: AvailabilitySchema,
});

export async function POST(request: Request) {
  try {
    const partner = await requirePartner();
    const input = PreviewAvailabilitySchema.parse(await request.json());
    const { start, end } = dayBounds(input.date);
    const occupied = await db().select({ scheduledStart: bookings.scheduledStart, scheduledEnd: bookings.scheduledEnd })
      .from(bookings)
      .where(and(eq(bookings.partnerId, partner.id), ne(bookings.status, "cancelled"), lt(bookings.scheduledStart, end), gt(bookings.scheduledEnd, start)));
    return NextResponse.json({ date: input.date, slots: slotStarts(input.availability, input.date, input.durationMinutes, occupied).map((slot) => slot.toISOString()) });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: errorStatus(error) });
  }
}
