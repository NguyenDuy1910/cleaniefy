"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Palette,
  Share2,
} from "lucide-react";
import { formatBookingTime } from "@/features/booking/format";
import type { Overview } from "@/lib/types";

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function DashboardHome({ overview }: { overview: Overview }) {
  const [copied, setCopied] = useState(false);
  const published = overview.partner.status === "published";

  const copy = async () => {
    if (!overview) return;
    await navigator.clipboard.writeText(
      `${location.origin}/${overview.partner.slug}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const url = `${location.host}/${overview.partner.slug}`;
  return (
    <DashboardFrame active="overview" partnerSlug={overview.partner.slug} published={published}>
      <header className="dashboard-heading">
        <div>
          <h1>Good morning</h1>
          <p>
            {overview.partner.status === "published"
              ? "Your page is live and ready to share."
              : "Your draft is ready to make your own."}
          </p>
        </div>
        <Link className="button" href="/dashboard/page">
          <Palette size={16} /> Edit page
        </Link>
      </header>
      <section className="current-page-card">
        <div>
          <span>YOUR PAGE</span>
          <a
            href={published ? `/${overview.partner.slug}` : "/dashboard/page/preview"}
            target="_blank"
            rel="noreferrer"
          >
            {published ? url : "Preview your draft"}
            <ExternalLink size={13} />
          </a>
          <p>
            {published
              ? `${overview.metrics.views} views · ${overview.metrics.bookingCount} bookings · ${overview.metrics.rating.toFixed(1)} rating`
              : "Publish your page before sharing it with customers."}
          </p>
        </div>
        <div className="page-actions">
          <Link className="button secondary small" href="/dashboard/page">
            Edit page
          </Link>
          {published && <button className="button small" onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
            {copied ? "Copied" : "Share page"}
          </button>}
        </div>
      </section>
      <section className="dashboard-section today">
        <div className="section-title">
          <div>
            <h2>Today&apos;s bookings</h2>
            <p>Where, when, and how much—nothing extra.</p>
          </div>
          <CalendarDays size={21} />
        </div>
        {overview.todayBookings.length ? (
          <div className="today-list">
            {overview.todayBookings.map((booking) => (
              <article key={booking.id}>
                <time>
                  {formatBookingTime(booking.scheduledStart)}
                </time>
                <div>
                  <b>{booking.customerName}</b>
                  <span>
                    {booking.service?.name} ·{" "}
                    {booking.customerAddress || "Address to confirm"}
                  </span>
                </div>
                <strong>{money(booking.priceCents)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-bookings">
            No bookings scheduled today. Share your page to get the next one in.
          </div>
        )}
      </section>
    </DashboardFrame>
  );
}

export function DashboardFrame({
  children,
  active = "",
  partnerSlug,
  published,
  wide = false,
}: {
  children: React.ReactNode;
  active?: string;
  partnerSlug: string;
  published: boolean;
  wide?: boolean;
}) {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link className="wordmark" href="/dashboard">
          cleanie
        </Link>
        <nav>
          <Link
            className={active === "overview" ? "active" : ""}
            href="/dashboard"
          >
            Overview
          </Link>
          <Link
            className={active === "editor" ? "active" : ""}
            href="/dashboard/page"
          >
            Page
          </Link>
          <Link
            className={active === "bookings" ? "active" : ""}
            href="/dashboard/bookings"
          >
            Bookings
          </Link>
          <Link href="/dashboard/settings">Settings</Link>
        </nav>
        <Link className="sidebar-view" href={published ? `/${partnerSlug}` : "/dashboard/page/preview"} target="_blank">
          <Share2 size={14} /> {published ? "View live page" : "Preview draft"}
        </Link>
      </aside>
      <main className={`dashboard-main ${wide ? "dashboard-main-wide" : ""}`}>{children}</main>
    </div>
  );
}
