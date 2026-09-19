import { del } from "@vercel/blob";
import { isPartnerMediaPath, mediaPathFromUrl } from "./paths";

export async function deletePartnerMedia(url: string | null | undefined, partnerId: string) {
  const pathname = mediaPathFromUrl(url);
  if (!pathname || !isPartnerMediaPath(pathname, partnerId)) return;
  try {
    await del(pathname);
  } catch (error) {
    // Blob deletion is best effort after the database reference is gone. A
    // failed cleanup cannot restore the prior UI state, but it is observable.
    console.error("Partner media cleanup failed", { partnerId, pathname, error });
  }
}
