import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { DomainError } from "@/lib/errors";
import { getPartnerOverview } from "@/features/partner/queries";
import { serializePartner } from "@/features/partner/serializers";

export async function publishPartnerPage(partnerId: string) {
  const overview = await getPartnerOverview(partnerId);
  if (!overview.publishReadiness.ready) {
    const missing = overview.publishReadiness.requirements
      .filter((item) => !item.complete)
      .map((item) => item.label);
    throw new DomainError(`Complete setup before publishing: ${missing.join(", ")}.`, 422);
  }

  const [partner] = await db()
    .update(partners)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(partners.id, partnerId), eq(partners.status, "draft")))
    .returning();
  if (partner) return serializePartner(partner);

  const [existing] = await db().select().from(partners).where(eq(partners.id, partnerId));
  if (!existing) throw new DomainError("This Cleanie page was not found.", 404);
  return serializePartner(existing);
}
