"use client";

import { ExternalLink, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

export const previewWidths: Record<PreviewDevice, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

export const previewHeights: Record<PreviewDevice, number> = {
  desktop: 800,
  tablet: 1024,
  mobile: 844,
};

const devices = [
  { key: "desktop", label: "MacBook", device: "MacBook Pro", Icon: Monitor },
  { key: "tablet", label: "iPad", device: "iPad Pro", Icon: Tablet },
  { key: "mobile", label: "iPhone", device: "iPhone 15", Icon: Smartphone },
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
          {devices.map(({ key, label, device: deviceName, Icon }) => (
            <button
              aria-label={`${deviceName} preview, ${previewWidths[key]} pixels wide`}
              aria-pressed={device === key}
              className={device === key ? "active" : ""}
              key={key}
              onClick={() => onDeviceChange(key)}
              title={`${deviceName} · ${previewWidths[key]}px`}
              type="button"
            >
              <Icon size={15} />
              <span>{label}</span>
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
