import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partners, partnerSiteConfig } from "@/db/schema";
import { DomainError, isUniqueViolation, SlugUnavailableError } from "@/lib/errors";
import { PartnerProfileSchema, SectionsConfigSchema, ThemeUpdateSchema } from "./schema";
import { serializePartner, serializeSiteConfig } from "./serializers";
import { validatePartnerSlug } from "./slugs";

export async function updatePartnerProfile(partnerId: string, input: unknown) {
  const data = PartnerProfileSchema.parse(input);
  const updates: Partial<typeof partners.$inferInsert> = { updatedAt: new Date() };
  if (data.businessName !== undefined) updates.businessName = data.businessName;
  if (data.serviceCategory !== undefined) updates.serviceCategory = data.serviceCategory;
  if (data.tagline !== undefined) updates.tagline = data.tagline;
  if (data.serviceArea !== undefined) updates.serviceArea = data.serviceArea;
  if (data.profileImageUrl !== undefined) updates.profileImageUrl = data.profileImageUrl;
  if (data.heroImageUrl !== undefined) updates.heroImageUrl = data.heroImageUrl;
  if (data.instagramUrl !== undefined) updates.instagramUrl = data.instagramUrl;
  if (data.about !== undefined) updates.about = data.about;
  if (data.slug === undefined) {
    const [partner] = await db().update(partners).set(updates).where(eq(partners.id, partnerId)).returning();
    if (!partner) throw new DomainError("This Cleanie page was not found.", 404);
    return serializePartner(partner);
  }

  const slug = validatePartnerSlug(data.slug);
  try {
    const [partner] = await db().transaction(async (tx) => {
      const [taken] = await tx.select({ id: partners.id }).from(partners).where(eq(partners.slug, slug));
      if (taken && taken.id !== partnerId) throw new SlugUnavailableError();
      return tx.update(partners).set({ ...updates, slug }).where(eq(partners.id, partnerId)).returning();
    });
    if (!partner) throw new DomainError("This Cleanie page was not found.", 404);
    return serializePartner(partner);
  } catch (error) {
    if (isUniqueViolation(error)) throw new SlugUnavailableError();
    throw error;
  }
}

export async function updatePartnerTheme(partnerId: string, input: unknown) {
  const data = ThemeUpdateSchema.parse(input);
  const [current] = await db().select().from(partnerSiteConfig).where(eq(partnerSiteConfig.partnerId, partnerId));
  if (!current) throw new DomainError("This Cleanie page has incomplete setup data.", 409);
  const [config] = await db()
    .update(partnerSiteConfig)
    .set({ themeConfig: data.theme, updatedAt: new Date() })
    .where(eq(partnerSiteConfig.partnerId, partnerId))
    .returning();
  return serializeSiteConfig(config);
}

export async function updatePartnerSections(partnerId: string, input: unknown) {
  const sections = SectionsConfigSchema.parse(input);
  const [config] = await db()
    .update(partnerSiteConfig)
    .set({ sectionsConfig: sections, updatedAt: new Date() })
    .where(eq(partnerSiteConfig.partnerId, partnerId))
    .returning();
  if (!config) throw new DomainError("This Cleanie page has incomplete setup data.", 409);
  return serializeSiteConfig(config).sections;
}
