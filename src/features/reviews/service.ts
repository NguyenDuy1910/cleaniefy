import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { DomainError } from "@/lib/errors";
import { serializeReview } from "@/features/partner/serializers";
import { ReviewCreateSchema } from "./schema";

export async function createPartnerReview(partnerId: string, input: unknown) {
  const data = ReviewCreateSchema.parse(input);
  return db().transaction(async (tx) => {
    if (data.featured) {
      await tx.update(reviews).set({ featured: false }).where(eq(reviews.partnerId, partnerId));
    }
    const [review] = await tx.insert(reviews).values({ ...data, partnerId }).returning();
    return serializeReview(review);
  });
}

export async function deletePartnerReview(partnerId: string, reviewId: string) {
  const [review] = await db()
    .delete(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.partnerId, partnerId)))
    .returning({ id: reviews.id });
  if (!review) throw new DomainError("That item was not found.", 404);
}
