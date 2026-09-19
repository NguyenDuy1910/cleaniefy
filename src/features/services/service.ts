import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";
import { ServiceNotFoundError } from "@/lib/errors";
import { ServiceCreateSchema, ServiceUpdateSchema } from "./schema";
import { serializeService } from "@/features/partner/serializers";
import { ownedServiceCondition } from "@/features/partner/conditions";

export async function createPartnerService(partnerId: string, input: unknown) {
  const data = ServiceCreateSchema.parse(input);
  const [{ currentOrder }] = await db()
    .select({ currentOrder: max(services.sortOrder) })
    .from(services)
    .where(eq(services.partnerId, partnerId));
  const [service] = await db()
    .insert(services)
    .values({ ...data, partnerId, sortOrder: (currentOrder ?? -1) + 1 })
    .returning();
  return serializeService(service);
}

export async function updatePartnerService(partnerId: string, serviceId: string, input: unknown) {
  const updates = ServiceUpdateSchema.parse(input);
  const [service] = await db()
    .update(services)
    .set(updates)
    .where(ownedServiceCondition(partnerId, serviceId))
    .returning();
  if (!service) throw new ServiceNotFoundError("That item was not found.");
  return serializeService(service);
}

export async function deletePartnerService(partnerId: string, serviceId: string) {
  const [service] = await db()
    .delete(services)
    .where(ownedServiceCondition(partnerId, serviceId))
    .returning({ id: services.id });
  if (!service) throw new ServiceNotFoundError("That item was not found.");
}
