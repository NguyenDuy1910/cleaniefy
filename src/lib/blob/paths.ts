const MEDIA_PURPOSES = ["profile", "hero", "before", "after"] as const;

export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export function isMediaPurpose(value: unknown): value is MediaPurpose {
  return typeof value === "string" && MEDIA_PURPOSES.includes(value as MediaPurpose);
}

export function createPartnerMediaPath(partnerId: string, purpose: MediaPurpose) {
  return `partners/${partnerId}/${purpose}/${crypto.randomUUID()}`;
}

export function parsePartnerMediaPath(pathname: string) {
  const segments = pathname.split("/");
  if (segments.length !== 4 || segments[0] !== "partners") return null;
  const [, partnerId, purpose, filename] = segments;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partnerId)) return null;
  if (!isMediaPurpose(purpose)) return null;
  if (filename.length < 1 || filename.length > 255 || filename.includes("..")) return null;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(filename)) return null;
  return { partnerId, purpose, filename };
}

export function isPartnerMediaPath(pathname: string, partnerId?: string) {
  const parsed = parsePartnerMediaPath(pathname);
  return parsed !== null && (!partnerId || parsed.partnerId === partnerId);
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
