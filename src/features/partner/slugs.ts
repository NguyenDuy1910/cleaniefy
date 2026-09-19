import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { DomainError, SlugUnavailableError } from "@/lib/errors";

export const RESERVED_PARTNER_SLUGS = new Set([
  "admin", "api", "dashboard", "login", "logout", "signup", "register",
  "pricing", "features", "templates", "settings", "bookings", "about",
  "support", "help", "privacy", "terms", "assets", "static", "robots",
  "sitemap", "favicon", "_next", "demo",
]);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function normalizePartnerSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validatePartnerSlug(value: string) {
  const slug = normalizePartnerSlug(value);
  if (!SLUG_PATTERN.test(slug)) {
    throw new DomainError("Use 3–40 lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.", 422);
  }
  if (RESERVED_PARTNER_SLUGS.has(slug)) {
    throw new DomainError("That Cleanie link is reserved.", 422);
  }
  return slug;
}

export async function assertSlugAvailable(slug: string, partnerId?: string) {
  const [existing] = await db().select({ id: partners.id }).from(partners).where(eq(partners.slug, slug));
  if (existing && existing.id !== partnerId) throw new SlugUnavailableError();
}

export function suggestPartnerSlug(value: string) {
  const base = normalizePartnerSlug(value).slice(0, 40).replace(/-+$/g, "") || "cleaner";
  return base.length >= 3 ? base : `${base}-cleaning`.slice(0, 40);
}
