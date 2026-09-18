"use client";

import { useEffect, useRef, useState } from "react";
import type { PartnerSiteState } from "@/features/partner/types";
import { type PreviewEvent, type PreviewMessage } from "./preview-messages";
import { PreviewToolbar, previewWidths, type PreviewDevice } from "./preview-toolbar";

const previewPath = "/dashboard/page/preview";

export function PreviewFrame({ site, open }: { site: PartnerSiteState; open: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const fullPreviewRef = useRef<Window | null>(null);
  const siteRef = useRef(site);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ width: 480, height: 640 });
  siteRef.current = site;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize((current) => {
        const width = Math.round(entry.contentRect.width);
        const height = Math.round(entry.contentRect.height);
        return current.width === width && current.height === height ? current : { width, height };
      });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if ((event.data as PreviewEvent | null)?.type !== "CLEANIE_PREVIEW_READY") return;
      const embedded = frameRef.current?.contentWindow;
      const full = fullPreviewRef.current;
      if (event.source === embedded) {
        setReady(true);
        embedded?.postMessage({ type: "CLEANIE_PREVIEW_STATE", payload: siteRef.current } satisfies PreviewMessage, window.location.origin);
      } else if (full && event.source === full) {
        full.postMessage({ type: "CLEANIE_PREVIEW_STATE", payload: siteRef.current } satisfies PreviewMessage, window.location.origin);
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    if (ready) frameRef.current?.contentWindow?.postMessage(
      { type: "CLEANIE_PREVIEW_STATE", payload: site } satisfies PreviewMessage,
      window.location.origin,
    );
    if (fullPreviewRef.current && !fullPreviewRef.current.closed) fullPreviewRef.current.postMessage(
      { type: "CLEANIE_PREVIEW_STATE", payload: site } satisfies PreviewMessage,
      window.location.origin,
    );
  }, [site, ready]);

  useEffect(() => {
    if (open && window.matchMedia("(max-width: 700px)").matches) {
      requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [open]);

  const restart = () => {
    const message: PreviewMessage = { type: "CLEANIE_PREVIEW_RESET" };
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
    if (fullPreviewRef.current && !fullPreviewRef.current.closed) fullPreviewRef.current.postMessage(message, window.location.origin);
  };
  const fullPreview = () => {
    const opened = window.open(previewPath, "cleanie-full-preview");
    if (opened) {
      fullPreviewRef.current = opened;
      opened.focus();
    }
  };

  const viewportWidth = previewWidths[device];
  const scale = Math.min(1, Math.max(0.1, (size.width - 24) / viewportWidth));
  const visualWidth = viewportWidth * scale;
  const frameHeight = Math.max(400, Math.floor((size.height - 24) / scale));

  return (
    <aside className={`editor-preview ${open ? "mobile-preview-open" : ""}`} aria-label="Interactive page preview" id="live-preview" ref={rootRef}>
      <PreviewToolbar device={device} onDeviceChange={setDevice} onRestart={restart} onFullPreview={fullPreview} />
      <div className="preview-stage" ref={stageRef}>
        {!ready && (
          <div className="preview-frame-loading" aria-label="Loading page preview" aria-busy="true">
            <div className="skeleton preview-loading-hero" />
            <div className="skeleton preview-loading-title" />
            <div className="skeleton preview-loading-button" />
            <div className="skeleton preview-loading-card" />
            <div className="skeleton preview-loading-card" />
          </div>
        )}
        <iframe
          ref={frameRef}
          title={`${device} interactive page preview`}
          src={previewPath}
          className="preview-iframe"
          style={{
            width: viewportWidth,
            height: frameHeight,
            left: (size.width - visualWidth) / 2,
            transform: `scale(${scale})`,
            visibility: ready ? "visible" : "hidden",
          }}
          onLoad={() => {
            setReady(false);
            frameRef.current?.contentWindow?.postMessage(
              { type: "CLEANIE_PREVIEW_STATE", payload: siteRef.current } satisfies PreviewMessage,
              window.location.origin,
            );
          }}
        />
      </div>
    </aside>
  );
}
