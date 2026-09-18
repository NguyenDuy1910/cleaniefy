"use server";

import { actionResult } from "@/lib/utils/actions";
import { requirePartner } from "@/lib/auth/context";
import { revalidatePartnerSite } from "@/lib/utils/revalidation";
import { updatePartnerAvailability, updatePartnerBookingConfig } from "./service";

export async function updateAvailabilityAction(input: unknown) {
  return actionResult(async () => {
    const partner = await requirePartner();
    const availability = await updatePartnerAvailability(partner.id, input);
    revalidatePartnerSite(partner.slug);
    return availability;
  });
}

export async function updateBookingConfigAction(input: unknown) {
  return actionResult(async () => {
    const partner = await requirePartner();
    const config = await updatePartnerBookingConfig(partner.id, input);
    revalidatePartnerSite(partner.slug);
    return config;
  });
}
