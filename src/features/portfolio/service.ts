import { and, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { portfolioItems, services } from "@/db/schema";
import { DomainError } from "@/lib/errors";
import { serializePortfolio } from "@/features/partner/serializers";
import { PortfolioCreateSchema } from "./schema";

export async function createPortfolioItem(partnerId: string, input: unknown) {
  const data = PortfolioCreateSchema.parse(input);
  const [ownedService] = await db()
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.id, data.serviceId), eq(services.partnerId, partnerId)));
  if (!ownedService) throw new DomainError("That service was not found.", 404);
  const [{ currentOrder }] = await db()
    .select({ currentOrder: max(portfolioItems.sortOrder) })
    .from(portfolioItems)
    .where(and(eq(portfolioItems.partnerId, partnerId), eq(portfolioItems.serviceId, data.serviceId)));
  const [item] = await db()
    .insert(portfolioItems)
    .values({ ...data, partnerId, sortOrder: (currentOrder ?? -1) + 1 })
    .returning();
  return serializePortfolio(item);
}

export async function deletePortfolioItem(partnerId: string, itemId: string) {
  const [item] = await db()
    .delete(portfolioItems)
    .where(and(eq(portfolioItems.id, itemId), eq(portfolioItems.partnerId, partnerId)))
    .returning();
  if (!item) throw new DomainError("That item was not found.", 404);
  return item;
}
