import { AdminView } from "@/components/partner/admin-view";
import { DashboardLoading } from "@/components/ui/loading-states";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/context";
import { getAdminOverview } from "@/features/admin/queries";
import { getSession } from "@/lib/auth/session";

export default function AdminPage() {
  return <Suspense fallback={<DashboardLoading />}><AdminContent /></Suspense>;
}

async function AdminContent() {
  if (!await getSession()) redirect("/login");
  await requireAdmin();
  return <AdminView {...await getAdminOverview()} />;
}
