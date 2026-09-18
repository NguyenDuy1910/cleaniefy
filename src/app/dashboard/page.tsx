import { DashboardHome } from "@/components/partner/dashboard-home";
import { requirePartner } from "@/lib/auth/context";
import { getPartnerOverview } from "@/features/partner/queries";

export default async function DashboardPage() {
  const partner = await requirePartner();
  return <DashboardHome overview={await getPartnerOverview(partner.id)} />;
}
