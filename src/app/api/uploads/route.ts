import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requirePartner } from "@/lib/auth/context";
import { isPartnerMediaPath } from "@/lib/blob/paths";
import { errorMessage } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const partner = await requirePartner();
        if (!isPartnerMediaPath(pathname, partner.id)) {
          throw new Error("This upload path is not allowed.");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 4 * 1024 * 1024,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ partnerId: partner.id, pathname }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = tokenPayload ? JSON.parse(tokenPayload) as { partnerId?: string; pathname?: string } : {};
        if (!payload.partnerId || payload.pathname !== blob.pathname || !isPartnerMediaPath(blob.pathname, payload.partnerId)) {
          throw new Error("Blob upload callback could not be verified.");
        }
        console.info("Partner media uploaded", { partnerId: payload.partnerId, pathname: blob.pathname });
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
  }
}
