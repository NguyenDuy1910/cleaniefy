import { notFound } from "next/navigation";
import { SiteRenderer } from "@/components/public-site/site-renderer";
import { ApiError, getPublicPartner } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export default async function PartnerPage({ params }: { params: Promise<{ partnerSlug: string }> }) {
  const { partnerSlug } = await params;
  try { return <SiteRenderer site={await getPublicPartner(partnerSlug)} />; }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
}
