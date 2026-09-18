"use client";

import { useEffect, useState } from "react";

export function SiteImage({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");
  useEffect(() => setStatus(src ? "loading" : "error"), [src]);

  return (
    <span className={`site-image-shell ${className}`}>
      {src && status !== "error" && (
        <img src={src} alt={alt} onLoad={() => setStatus("loaded")} onError={() => setStatus("error")} />
      )}
      {status === "loading" && <span className="site-image-placeholder skeleton" aria-hidden="true" />}
      {status === "error" && <span className="site-image-placeholder site-image-fallback" role="img" aria-label={alt || "Image unavailable"}>Image unavailable</span>}
    </span>
  );
}
