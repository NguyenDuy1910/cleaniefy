import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partners, users } from "@/db/schema";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getSession } from "./session";

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();

  const [user] = await db().select().from(users).where(eq(users.id, session.userId));
  if (!user) throw new UnauthorizedError("Your account no longer exists.");
  return user;
}

export async function requirePartner() {
  const user = await requireUser();
  const [partner] = await db()
    .select()
    .from(partners)
    .where(eq(partners.ownerUserId, user.id));
  if (!partner) throw new ForbiddenError("This account does not own a Cleanie page.");
  return partner;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) throw new ForbiddenError("Admin access is required.");
  return user;
}
