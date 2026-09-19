import type { Metadata } from "next";
import { requirePartner } from "@/lib/auth/context";
import { getPartnerPreviewSite } from "@/features/partner/queries";
import { PreviewRuntime } from "@/components/preview/preview-runtime";

export const metadata: Metadata = { title: "Page preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PartnerPreviewPage({ searchParams }: { searchParams: Promise<{ embedded?: string }> }) {
  const partner = await requirePartner();
  const { embedded } = await searchParams;
  return <PreviewRuntime initialSite={embedded === "1" ? null : await getPartnerPreviewSite(partner.id)} />;
}
