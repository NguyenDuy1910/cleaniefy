"use client";

import { upload } from "@vercel/blob/client";
import { preparePartnerMediaAction } from "@/features/partner/actions";
import { mediaUrl, type MediaPurpose } from "./paths";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadPartnerMedia(file: File, purpose: MediaPurpose) {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error("Upload a JPEG, PNG, or WebP image.");
  }
  if (!file.size || file.size > MAX_IMAGE_BYTES) {
    throw new Error("Images must be smaller than 4 MB.");
  }
  const prepared = await preparePartnerMediaAction(purpose);
  if (prepared.error || !prepared.data) throw new Error(prepared.error ?? "Could not prepare this upload.");
  const blob = await upload(prepared.data.pathname, file, {
    access: "private",
    handleUploadUrl: "/api/uploads",
  });
  return { url: mediaUrl(blob.pathname) };
}
