"use client";

import { useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PortfolioItem } from "@/features/portfolio/types";
import { SiteImage } from "./site-image";

function ImagePair({ item }: { item: PortfolioItem }) {
  return (
    <figure>
      <div><SiteImage src={item.beforeImageUrl} alt={`Before: ${item.caption || "cleaning work"}`} /><span>Before</span></div>
      <div><SiteImage src={item.afterImageUrl} alt={`After: ${item.caption || "cleaning work"}`} /><span>After</span></div>
    </figure>
  );
}

export function ProofGallery({ portfolio, compact = false }: { portfolio: PortfolioItem[]; compact?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const titleId = useId();
  if (!portfolio.length) return null;
  const selected = portfolio[Math.min(selectedIndex, portfolio.length - 1)];

  return (
    <section className={`site-proof ${compact ? "service-proof" : ""}`} aria-labelledby={titleId}>
      {compact ? <h4 id={titleId}>Recent result</h4> : <h2 className="visually-hidden" id={titleId}>Work gallery</h2>}
      <ImagePair item={portfolio[0]} />
      {portfolio[0].caption && <p>{portfolio[0].caption}</p>}
      <button className="site-gallery-open" type="button" onClick={() => { setSelectedIndex(0); dialogRef.current?.showModal(); }}>
        {compact ? "View work" : "Open gallery"}{portfolio.length > 1 ? ` · ${portfolio.length} projects` : ""}
      </button>
      <dialog className="site-gallery-dialog" ref={dialogRef} aria-label="Before and after gallery">
        <div className="site-gallery-dialog-header">
          <span>{selectedIndex + 1} of {portfolio.length}</span>
          <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close gallery"><X size={18} /></button>
        </div>
        <ImagePair item={selected} />
        {selected.caption && <p>{selected.caption}</p>}
        {portfolio.length > 1 && <div className="site-gallery-controls">
          <button type="button" onClick={() => setSelectedIndex((index) => (index - 1 + portfolio.length) % portfolio.length)}><ChevronLeft size={17} /> Previous</button>
          <button type="button" onClick={() => setSelectedIndex((index) => (index + 1) % portfolio.length)}>Next <ChevronRight size={17} /></button>
        </div>}
      </dialog>
    </section>
  );
}
