"use server";

import { actionResult } from "@/lib/utils/actions";
import { requirePartner } from "@/lib/auth/context";
import { revalidatePartnerSite } from "@/lib/utils/revalidation";
import { deletePartnerMedia } from "@/lib/blob/server";
import { createPortfolioItem, deletePortfolioItem } from "./service";

export async function createPortfolioItemAction(input: unknown) {
  return actionResult(async () => {
    const partner = await requirePartner();
    const item = await createPortfolioItem(partner.id, input);
    revalidatePartnerSite(partner.slug);
    return item;
  });
}

export async function deletePortfolioItemAction(itemId: string) {
  return actionResult(async () => {
    const partner = await requirePartner();
    const item = await deletePortfolioItem(partner.id, itemId);
    await Promise.all([
      deletePartnerMedia(item.beforeImageUrl, partner.id),
      deletePartnerMedia(item.afterImageUrl, partner.id),
    ]);
    revalidatePartnerSite(partner.slug);
  });
}
