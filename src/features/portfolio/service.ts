import { and, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { portfolioItems } from "@/db/schema";
import { DomainError } from "@/lib/errors";
import { serializePortfolio } from "@/features/partner/serializers";
import { PortfolioCreateSchema } from "./schema";

export async function createPortfolioItem(partnerId: string, input: unknown) {
  const data = PortfolioCreateSchema.parse(input);
  const [{ currentOrder }] = await db()
    .select({ currentOrder: max(portfolioItems.sortOrder) })
    .from(portfolioItems)
    .where(eq(portfolioItems.partnerId, partnerId));
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
