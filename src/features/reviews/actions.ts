"use server";

import { actionResult } from "@/lib/utils/actions";
import { requirePartner } from "@/lib/auth/context";
import { revalidatePartnerSite } from "@/lib/utils/revalidation";
import { createPartnerReview, deletePartnerReview } from "./service";

export async function createReviewAction(input: unknown) {
  return actionResult(async () => {
    const partner = await requirePartner();
    const review = await createPartnerReview(partner.id, input);
    revalidatePartnerSite(partner.slug);
    return review;
  });
}

export async function deleteReviewAction(reviewId: string) {
  return actionResult(async () => {
    const partner = await requirePartner();
    await deletePartnerReview(partner.id, reviewId);
    revalidatePartnerSite(partner.slug);
  });
}
