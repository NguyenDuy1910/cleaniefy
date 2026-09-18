import { BookingsView } from "@/components/partner/bookings";
import { DashboardLoading } from "@/components/ui/loading-states";
import { Suspense } from "react";
import { requirePartner } from "@/lib/auth/context";
import { getPartnerBookings } from "@/features/partner/queries";

export default function BookingsPage() {
  return <Suspense fallback={<DashboardLoading />}><BookingsContent /></Suspense>;
}

async function BookingsContent() {
  const partner = await requirePartner();
  return <BookingsView partnerSlug={partner.slug} bookings={await getPartnerBookings(partner.id)} />;
}
