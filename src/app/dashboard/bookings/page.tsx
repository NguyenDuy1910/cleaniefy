import { BookingsView } from "@/components/partner/bookings";
import { requirePartner } from "@/lib/auth/context";
import { getPartnerBookings } from "@/features/partner/queries";

export default async function BookingsPage() {
  const partner = await requirePartner();
  return <BookingsView partnerSlug={partner.slug} bookings={await getPartnerBookings(partner.id)} />;
}
