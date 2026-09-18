"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  LayoutTemplate,
  LoaderCircle,
  Palette,
  Share2,
} from "lucide-react";
import { ApiError, getPartnerOverview, updateTheme } from "@/lib/api/client";
import { TEMPLATE_CATALOG, type TemplateDefinition } from "@/lib/templates";
import type { Overview, PublicSite, TemplateKey } from "@/lib/types";
import { SiteRenderer } from "@/components/public-site/site-renderer";

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

function templatePreview(
  overview: Overview,
  template: TemplateDefinition,
): PublicSite {
  return {
    ...overview,
    site: { ...overview.site, template: template.key, theme: template.theme },
    metrics: {
      rating: overview.metrics.rating,
      reviewCount: overview.reviews.length,
      completedJobs: overview.metrics.bookingCount,
      views: overview.metrics.views,
    },
  };
}

function TemplatePreview({
  overview,
  template,
}: {
  overview: Overview;
  template: TemplateDefinition;
}) {
  return (
    <div className="template-preview" aria-hidden="true">
      <div className="template-preview-scale">
        <SiteRenderer
          site={templatePreview(overview, template)}
          compact
          interactive={false}
        />
      </div>
    </div>
  );
}

export function DashboardHome() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState<TemplateKey | null>(null);
  const load = () =>
    getPartnerOverview()
      .then(setOverview)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Unable to load your page.",
        ),
      );

  useEffect(() => {
    load();
  }, []);

  const copy = async () => {
    if (!overview) return;
    await navigator.clipboard.writeText(
      `${location.origin}/${overview.partner.slug}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const selectTemplate = async (template: TemplateDefinition) => {
    setSaving(template.key);
    try {
      await updateTheme({ template: template.key, theme: template.theme });
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn’t change template.",
      );
    } finally {
      setSaving(null);
    }
  };

  if (error)
    return (
      <DashboardFrame>
        <div className="dashboard-error">
          <h1>We couldn&apos;t open your dashboard.</h1>
          <p>{error}</p>
          <Link className="button" href="/login">
            Log in again
          </Link>
        </div>
      </DashboardFrame>
    );
  if (!overview)
    return (
      <DashboardFrame>
        <div className="dashboard-loading">
          <LoaderCircle className="spin" /> Loading your Cleanie page…
        </div>
      </DashboardFrame>
    );

  const url = `${typeof window === "undefined" ? "cleanie.app" : location.host}/${overview.partner.slug}`;
  return (
    <DashboardFrame active="overview" partnerSlug={overview.partner.slug}>
      <header className="dashboard-heading">
        <div>
          <h1>Good morning</h1>
          <p>
            {overview.partner.status === "published"
              ? "Your page is live and ready to share."
              : "Your draft is ready to make your own."}
          </p>
        </div>
        <Link className="button" href="/dashboard/editor">
          <Palette size={16} /> Edit page
        </Link>
      </header>
      <section className="current-page-card">
        <div>
          <span>YOUR PAGE</span>
          <a
            href={`/${overview.partner.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            {url}
            <ExternalLink size={13} />
          </a>
          <p>
            {overview.metrics.views} views · {overview.metrics.bookingCount}{" "}
            bookings · {overview.metrics.rating.toFixed(1)} rating
          </p>
        </div>
        <div className="page-actions">
          <Link className="button secondary small" href="/dashboard/editor">
            Edit page
          </Link>
          <button className="button small" onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
            {copied ? "Copied" : "Share page"}
          </button>
        </div>
      </section>
      <section className="dashboard-section">
        <div className="section-title">
          <div>
            <h2>Choose a starting point</h2>
            <p>
              All 10 templates render your saved services, proof, reviews, and
              booking flow. Switching changes the live page—not a mock preview.
            </p>
          </div>
          <LayoutTemplate size={21} />
        </div>
        <div className="template-cards">
          {TEMPLATE_CATALOG.map((template) => {
            const selected = overview.site.template === template.key;
            return (
              <article
                className={`template-card ${selected ? "selected" : ""}`}
                key={template.key}
              >
                <TemplatePreview overview={overview} template={template} />
                <div className="template-card-copy">
                  <span className="template-layout">
                    {template.layout} layout
                  </span>
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
                </div>
                <div className="template-card-actions">
                  {selected ? (
                    <a
                      href={`/${overview.partner.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View live <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span>Preview updates when selected</span>
                  )}
                  <button
                    disabled={saving === template.key || selected}
                    style={{ backgroundColor: template.theme.primaryColor }}
                    onClick={() => selectTemplate(template)}
                  >
                    {saving === template.key
                      ? "Saving…"
                      : selected
                        ? "Selected"
                        : "Use template"}
                  </button>
                </div>
              </article>
            );
          })}
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
                  {new Date(booking.scheduledStart).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
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
  partnerSlug = "jessica",
}: {
  children: React.ReactNode;
  active?: string;
  partnerSlug?: string;
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
            href="/dashboard/editor"
          >
            Page
          </Link>
          <Link
            className={active === "bookings" ? "active" : ""}
            href="/dashboard/bookings"
          >
            Bookings
          </Link>
          <Link href="/dashboard/editor?tab=booking">Settings</Link>
        </nav>
        <Link className="sidebar-view" href={`/${partnerSlug}`} target="_blank">
          <Share2 size={14} /> View live page
        </Link>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
