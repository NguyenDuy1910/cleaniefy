"use server";

import { actionResult } from "@/lib/utils/actions";
import { requirePartner } from "@/lib/auth/context";
import { revalidatePartnerSite } from "@/lib/utils/revalidation";
import { createPartnerService, deletePartnerService, updatePartnerService } from "./service";

export async function createServiceAction(input: unknown) {
  return actionResult(async () => {
    const partner = await requirePartner();
    const service = await createPartnerService(partner.id, input);
    revalidatePartnerSite(partner.slug);
    return service;
  });
}

export async function updateServiceAction(serviceId: string, input: unknown) {
  return actionResult(async () => {
    const partner = await requirePartner();
    const service = await updatePartnerService(partner.id, serviceId, input);
    revalidatePartnerSite(partner.slug);
    return service;
  });
}

export async function deleteServiceAction(serviceId: string) {
  return actionResult(async () => {
    const partner = await requirePartner();
    await deletePartnerService(partner.id, serviceId);
    revalidatePartnerSite(partner.slug);
  });
}
