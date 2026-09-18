import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  availabilityRules,
  bookingConfig,
  partners,
  partnerSiteConfig,
  users,
} from "@/db/schema";
import { DomainError, ForbiddenError, isUniqueViolation } from "@/lib/errors";
import { getTemplateDefinition } from "@/templates/catalog";
import { LoginSchema, SignUpSchema } from "@/features/partner/schema";
import { suggestPartnerSlug } from "@/features/partner/slugs";
import { serializePartner } from "@/features/partner/serializers";

const DEFAULT_SECTIONS = { services: true, portfolio: true, reviews: true, about: true };
const DEFAULT_REQUIRED_FIELDS = { name: true, phone: true, email: false, address: true, notes: false };
const SCRYPT_OPTIONS = { N: 2 ** 14, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, 64, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string) {
  try {
    const [algorithm, encodedSalt, encodedDigest] = stored.split("$");
    if (algorithm !== "scrypt" || !encodedSalt || !encodedDigest) return false;
    const expected = Buffer.from(encodedDigest, "base64url");
    const actual = scryptSync(password, Buffer.from(encodedSalt, "base64url"), expected.length, SCRYPT_OPTIONS);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function createAccount(input: unknown) {
  const data = SignUpSchema.parse(input);
  const email = data.email.toLowerCase();
  const slugBase = suggestPartnerSlug(data.businessName);
  try {
    return await db().transaction(async (tx) => {
      const [existing] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email));
      if (existing) throw new DomainError("An account with that email already exists.", 409);

      let slug = slugBase;
      let index = 2;
      while (true) {
        const [taken] = await tx.select({ id: partners.id }).from(partners).where(eq(partners.slug, slug));
        if (!taken) break;
        const suffix = `-${index}`;
        slug = `${slugBase.slice(0, 40 - suffix.length).replace(/-+$/g, "")}${suffix}`;
        index += 1;
      }

      const [user] = await tx
        .insert(users)
        .values({ email, passwordHash: hashPassword(data.password) })
        .returning();
      const [partner] = await tx
        .insert(partners)
        .values({ ownerUserId: user.id, businessName: data.businessName, slug })
        .returning();
      const template = getTemplateDefinition("clean");
      await tx.insert(partnerSiteConfig).values({
        partnerId: partner.id,
        template: "clean",
        themeConfig: template.theme,
        sectionsConfig: DEFAULT_SECTIONS,
      });
      await tx.insert(availabilityRules).values({
        partnerId: partner.id,
        weekdays: [1, 2, 3, 4, 5],
        startTime: "09:00",
        endTime: "17:00",
        slotIntervalMinutes: 60,
      });
      await tx.insert(bookingConfig).values({
        partnerId: partner.id,
        ctaLabel: "Book a cleaning",
        requiredFields: DEFAULT_REQUIRED_FIELDS,
        paymentMode: "none",
        confirmationMessage: "Your request is in. We’ll be in touch shortly.",
      });
      return { user: { id: user.id, email: user.email, isAdmin: user.isAdmin }, partner: serializePartner(partner) };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new DomainError("An account with that email or Cleanie link already exists.", 409);
    throw error;
  }
}

export async function authenticate(input: unknown) {
  const data = LoginSchema.parse(input);
  const [user] = await db().select().from(users).where(eq(users.email, data.email.toLowerCase()));
  if (!user || !verifyPassword(data.password, user.passwordHash)) {
    throw new DomainError("Incorrect email or password.", 401);
  }
  const [partner] = await db().select().from(partners).where(eq(partners.ownerUserId, user.id));
  if (!partner) throw new ForbiddenError("This account does not own a Cleanie page.");
  return { user: { id: user.id, email: user.email, isAdmin: user.isAdmin }, partner: serializePartner(partner) };
}
