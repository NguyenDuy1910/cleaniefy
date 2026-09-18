import { AdminView } from "@/components/partner/admin-view";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/context";
import { getAdminOverview } from "@/features/admin/queries";
import { getSession } from "@/lib/auth/session";

export default async function AdminPage() {
  if (!await getSession()) redirect("/login");
  await requireAdmin();
  return <AdminView {...await getAdminOverview()} />;
}
