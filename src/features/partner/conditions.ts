import { and, eq } from "drizzle-orm";
import { partners, services } from "@/db/schema";

export function publishedPartnerCondition(slug: string) {
  return and(eq(partners.slug, slug), eq(partners.status, "published"))!;
}

export function ownedServiceCondition(partnerId: string, serviceId: string) {
  return and(eq(services.id, serviceId), eq(services.partnerId, partnerId))!;
}
