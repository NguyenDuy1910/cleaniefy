import { Editor } from "@/components/partner/editor";
import { requirePartner } from "@/lib/auth/context";
import { getPartnerOverview } from "@/features/partner/queries";

export default async function EditorPage() {
  const partner = await requirePartner();
  return <Editor initialOverview={await getPartnerOverview(partner.id)} />;
}
