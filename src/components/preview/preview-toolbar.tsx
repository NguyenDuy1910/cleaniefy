"use client";

import { ExternalLink, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

export const previewWidths: Record<PreviewDevice, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

const devices = [
  { key: "desktop", label: "Desktop", Icon: Monitor },
  { key: "tablet", label: "Tablet", Icon: Tablet },
  { key: "mobile", label: "Mobile", Icon: Smartphone },
] as const;

export function PreviewToolbar({
  device,
  onDeviceChange,
  onRestart,
  onFullPreview,
}: {
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  onRestart: () => void;
  onFullPreview: () => void;
}) {
  return (
    <div className="preview-heading">
      <span>LIVE PREVIEW</span>
      <div className="preview-toolbar-actions">
        <div className="preview-devices" aria-label="Preview viewport">
          {devices.map(({ key, label, Icon }) => (
            <button
              aria-label={`${label} preview, ${previewWidths[key]} pixels wide`}
              aria-pressed={device === key}
              className={device === key ? "active" : ""}
              key={key}
              onClick={() => onDeviceChange(key)}
              title={`${label} · ${previewWidths[key]}px`}
              type="button"
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
        <button className="preview-tool-button" type="button" onClick={onRestart} title="Restart preview" aria-label="Restart preview interactions">
          <RotateCcw size={15} /> <span>Restart</span>
        </button>
        <button className="preview-tool-button" type="button" onClick={onFullPreview} title="Open full preview" aria-label="Open full preview in a new tab">
          <ExternalLink size={15} /> <span>Full preview</span>
        </button>
      </div>
    </div>
  );
}
