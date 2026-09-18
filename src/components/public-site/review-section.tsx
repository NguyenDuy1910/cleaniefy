"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Review } from "@/features/reviews/types";

export function ReviewSection({ reviews, title }: { reviews: Review[]; title: string }) {
  const [index, setIndex] = useState(0);
  if (!reviews.length) return null;
  const ordered = [...reviews].sort((a, b) => Number(b.featured) - Number(a.featured));
  const current = ordered[Math.min(index, ordered.length - 1)];
  return (
    <section className="site-review" aria-labelledby="review-title">
      <h2 id="review-title">{title}</h2>
      <article>
        <div className="review-stars" aria-label={`${current.rating} out of 5 stars`}>{"★".repeat(current.rating)}</div>
        <blockquote>“{current.text}”</blockquote>
        <cite>— {current.author} · {current.source === "google" ? "Google" : "Customer"}</cite>
      </article>
      {ordered.length > 1 && <div className="site-review-controls">
        <button type="button" onClick={() => setIndex((value) => (value - 1 + ordered.length) % ordered.length)} aria-label="Previous review"><ChevronLeft size={17} /></button>
        <span>{Math.min(index, ordered.length - 1) + 1} / {ordered.length}</span>
        <button type="button" onClick={() => setIndex((value) => (value + 1) % ordered.length)} aria-label="Next review"><ChevronRight size={17} /></button>
      </div>}
    </section>
  );
}
