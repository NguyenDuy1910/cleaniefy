import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, partners, services } from "@/db/schema";
import { serializeBooking, serializePartner, serializeService } from "@/features/partner/serializers";

export async function getAdminOverview() {
  const [partnerRows, bookingRows] = await Promise.all([
    db().select().from(partners).orderBy(desc(partners.createdAt)),
    db()
      .select({ booking: bookings, service: services })
      .from(bookings)
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .orderBy(desc(bookings.createdAt))
      .limit(200),
  ]);
  return {
    partners: partnerRows.map(serializePartner),
    bookings: bookingRows.map(({ booking, service }) => serializeBooking(booking, service ? serializeService(service) : null)),
  };
}
