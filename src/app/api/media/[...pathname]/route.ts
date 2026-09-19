import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { partners, portfolioItems } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { mediaPathFromUrl, parsePartnerMediaPath } from "@/lib/blob/paths";

export const runtime = "nodejs";

type Context = { params: Promise<{ pathname: string[] }> };

async function canReadMedia(pathname: string) {
  const media = parsePartnerMediaPath(pathname);
  if (!media) return { allowed: false, public: false };
  const session = await getSession();
  const [partner] = await db()
    .select({
      ownerUserId: partners.ownerUserId,
      status: partners.status,
      profileImageUrl: partners.profileImageUrl,
      heroImageUrl: partners.heroImageUrl,
    })
    .from(partners)
    .where(eq(partners.id, media.partnerId))
    .limit(1);
  if (!partner) return { allowed: false, public: false };
  if (session?.userId === partner.ownerUserId) return { allowed: true, public: false };
  if (partner.status !== "published") return { allowed: false, public: false };
  if ([partner.profileImageUrl, partner.heroImageUrl].some((url) => mediaPathFromUrl(url) === pathname)) {
    return { allowed: true, public: true };
  }
  const portfolio = await db()
    .select({ beforeImageUrl: portfolioItems.beforeImageUrl, afterImageUrl: portfolioItems.afterImageUrl })
    .from(portfolioItems)
    .where(eq(portfolioItems.partnerId, media.partnerId));
  const referenced = portfolio.some((item) =>
    mediaPathFromUrl(item.beforeImageUrl) === pathname || mediaPathFromUrl(item.afterImageUrl) === pathname,
  );
  return { allowed: referenced, public: referenced };
}

export async function GET(request: Request, { params }: Context) {
  const { pathname: segments } = await params;
  const pathname = segments.join("/");
  if (!parsePartnerMediaPath(pathname)) return new NextResponse("Not found", { status: 404 });
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
