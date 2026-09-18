const MEDIA_PURPOSES = ["profile", "hero", "before", "after"] as const;

export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export function isMediaPurpose(value: unknown): value is MediaPurpose {
  return typeof value === "string" && MEDIA_PURPOSES.includes(value as MediaPurpose);
}

export function createPartnerMediaPath(partnerId: string, purpose: MediaPurpose) {
  return `partners/${partnerId}/${purpose}/${crypto.randomUUID()}`;
}

export function isPartnerMediaPath(pathname: string, partnerId?: string) {
  const prefix = partnerId ? `partners/${partnerId}/` : "partners/";
  return new RegExp(`^${prefix}(profile|hero|before|after)/[0-9a-f-]+(?:\\.[A-Za-z0-9]+)?$`).test(pathname);
}

export function mediaUrl(pathname: string) {
  return `/api/media/${pathname}`;
}

export function mediaPathFromUrl(url: string | null | undefined) {
  if (!url) return null;
  const oldPrefix = "/api/v1/media/";
  const currentPrefix = "/api/media/";
  if (url.startsWith(oldPrefix)) return url.slice(oldPrefix.length);
  if (url.startsWith(currentPrefix)) return url.slice(currentPrefix.length);
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith(".private.blob.vercel-storage.com")) {
      return parsed.pathname.replace(/^\//, "");
    }
  } catch {
    // Local demo and relative URLs are intentionally passed through unchanged.
  }
  return null;
}

export function normalizeMediaUrl(url: string | null | undefined) {
  const pathname = mediaPathFromUrl(url);
  return pathname ? mediaUrl(pathname) : url;
}
