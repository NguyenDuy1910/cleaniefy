"use server";

import { actionResult } from "@/lib/utils/actions";
import { requirePartner } from "@/lib/auth/context";
import { createPartnerMediaPath, isMediaPurpose, mediaPathFromUrl } from "@/lib/blob/paths";
import { deletePartnerMedia } from "@/lib/blob/server";
import { revalidatePartnerSite } from "@/lib/utils/revalidation";
import { publishPartnerPage } from "@/features/publishing/service";
import { updatePartnerProfile, updatePartnerSections, updatePartnerTheme } from "./service";

export async function updatePartnerProfileAction(input: unknown) {
  return actionResult(async () => {
    const partner = await requirePartner();
    const updated = await updatePartnerProfile(partner.id, input);
    if (mediaPathFromUrl(updated.profileImageUrl) !== mediaPathFromUrl(partner.profileImageUrl)) {
      await deletePartnerMedia(partner.profileImageUrl, partner.id);
    }
    if (mediaPathFromUrl(updated.heroImageUrl) !== mediaPathFromUrl(partner.heroImageUrl)) {
      await deletePartnerMedia(partner.heroImageUrl, partner.id);
    }
    revalidatePartnerSite(partner.slug);
    if (updated.slug !== partner.slug) revalidatePartnerSite(updated.slug);
    return updated;
  });
}

export async function updateThemeAction(input: unknown) {
  return actionResult(async () => {
    const partner = await requirePartner();
    const site = await updatePartnerTheme(partner.id, input);
    revalidatePartnerSite(partner.slug);
    return site;
  });
}

export async function updateSectionsAction(input: unknown) {
  return actionResult(async () => {
    const partner = await requirePartner();
    const sections = await updatePartnerSections(partner.id, input);
    revalidatePartnerSite(partner.slug);
    return sections;
  });
}

export async function publishPartnerAction() {
  return actionResult(async () => {
    const partner = await requirePartner();
    const updated = await publishPartnerPage(partner.id);
    revalidatePartnerSite(updated.slug);
    return updated;
  });
}

export async function preparePartnerMediaAction(purpose: unknown) {
  return actionResult(async () => {
    if (!isMediaPurpose(purpose)) throw new Error("Unknown media purpose.");
    const partner = await requirePartner();
    return { pathname: createPartnerMediaPath(partner.id, purpose) };
  });
}
