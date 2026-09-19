import { Editor } from "@/components/partner/editor";
import { DashboardLoading } from "@/components/ui/loading-states";
import { Suspense } from "react";
import { requirePartner } from "@/lib/auth/context";
import { getPartnerOverview } from "@/features/partner/queries";

export default function EditorPage() {
  return <Suspense fallback={<DashboardLoading editor />}><EditorContent /></Suspense>;
}

async function EditorContent() {
  const partner = await requirePartner();
  return <Editor initialOverview={await getPartnerOverview(partner.id)} />;
}
