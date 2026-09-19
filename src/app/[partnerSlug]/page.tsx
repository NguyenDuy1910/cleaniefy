import { notFound } from "next/navigation";
import { SiteRenderer } from "@/templates/renderer";
import { getPublicPartnerSite } from "@/features/partner/queries";
import { PartnerNotFoundError } from "@/lib/errors";

export const revalidate = 60;

export default async function PartnerPage({ params }: { params: Promise<{ partnerSlug: string }> }) {
  const { partnerSlug } = await params;
  try {
    // The persisted template and theme are queried on the server, so published
    // pages never flash a client-side default theme.
    return <SiteRenderer site={await getPublicPartnerSite(partnerSlug)} />;
  }
  catch (error) { if (error instanceof PartnerNotFoundError) notFound(); throw error; }
}
