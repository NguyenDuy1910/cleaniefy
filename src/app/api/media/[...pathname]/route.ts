import { get } from "@vercel/blob";
import { and, eq, like, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { partners, portfolioItems } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { isPartnerMediaPath } from "@/lib/blob/paths";

export const runtime = "nodejs";

type Context = { params: Promise<{ pathname: string[] }> };

async function canReadMedia(pathname: string) {
  const session = await getSession();
  if (session) {
    const [ownedPartner] = await db()
      .select({ id: partners.id })
      .from(partners)
      .where(eq(partners.ownerUserId, session.userId));
    if (ownedPartner && isPartnerMediaPath(pathname, ownedPartner.id)) return { allowed: true, public: false };
  }

  const suffix = `%/${pathname}`;
  const [profile] = await db()
    .select({ id: partners.id })
    .from(partners)
    .where(and(eq(partners.status, "published"), or(like(partners.profileImageUrl, suffix), like(partners.heroImageUrl, suffix))))
    .limit(1);
  if (profile) return { allowed: true, public: true };
  const [portfolio] = await db()
    .select({ id: portfolioItems.id })
    .from(portfolioItems)
    .innerJoin(partners, eq(portfolioItems.partnerId, partners.id))
    .where(and(eq(partners.status, "published"), or(like(portfolioItems.beforeImageUrl, suffix), like(portfolioItems.afterImageUrl, suffix))))
    .limit(1);
  return { allowed: Boolean(portfolio), public: Boolean(portfolio) };
}

export async function GET(request: Request, { params }: Context) {
  const { pathname: segments } = await params;
  const pathname = segments.join("/");
  if (!isPartnerMediaPath(pathname)) return new NextResponse("Not found", { status: 404 });
  const access = await canReadMedia(pathname);
  if (!access.allowed) return new NextResponse("Not found", { status: 404 });
  const result = await get(pathname, {
    access: "private",
    ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
  });
  if (!result) return new NextResponse("Not found", { status: 404 });
  const cacheControl = access.public ? "public, max-age=0, must-revalidate" : "private, no-cache";
  if (result.statusCode === 304) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: result.blob.etag, "Cache-Control": cacheControl },
    });
  }
  if (result.statusCode !== 200) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      ETag: result.blob.etag,
      "Cache-Control": cacheControl,
    },
  });
}
