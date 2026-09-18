"use client";

import { useEffect, useState } from "react";
import type { PartnerSiteState } from "@/features/partner/types";
import { SiteRenderer } from "@/templates/renderer";
import { parsePreviewMessage, type PreviewEvent } from "./preview-messages";

export function PreviewRuntime({ initialSite }: { initialSite: PartnerSiteState }) {
  const [site, setSite] = useState(initialSite);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const sender = window.parent !== window ? window.parent : window.opener;
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== sender) return;
      const message = parsePreviewMessage(event.data);
      if (!message) return;
      if (message.type === "CLEANIE_PREVIEW_STATE") setSite(message.payload);
      else {
        setResetKey((value) => value + 1);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("message", receive);
    if (sender) sender.postMessage({ type: "CLEANIE_PREVIEW_READY" } satisfies PreviewEvent, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);

  return (
    <>
      <SiteRenderer site={site} mode="preview" resetKey={resetKey} />
      <span className="preview-mode-badge">Preview mode</span>
    </>
  );
}
