import { DashboardHome } from "@/components/partner/dashboard-home";
import { DashboardLoading } from "@/components/ui/loading-states";
import { Suspense } from "react";
import { requirePartner } from "@/lib/auth/context";
import { getPartnerOverview } from "@/features/partner/queries";

export default function DashboardPage() {
  return <Suspense fallback={<DashboardLoading />}><DashboardContent /></Suspense>;
}

async function DashboardContent() {
  const partner = await requirePartner();
  return <DashboardHome overview={await getPartnerOverview(partner.id)} />;
}
