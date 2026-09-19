"use client";

import { ArrowUpRight, Clock3, MapPin, Star } from "lucide-react";
import type { PartnerSiteState } from "@/features/partner/types";
import { ProofGallery } from "./proof-gallery";
import { ReviewSection } from "./review-section";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
const duration = (minutes: number) => minutes < 60 ? `${minutes} min` : minutes % 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes / 60} hr`;

function clock(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2020, 0, 1, hour, minute)));
}

export function ProfileTabs({ site, interactive }: { site: PartnerSiteState; interactive: boolean }) {
  const services = site.services.filter((service) => service.active);
  const hasArea = Boolean(site.partner.serviceArea && site.partner.serviceArea !== "Your local area");
  const featuredReview = site.reviews.find((review) => review.featured) ?? site.reviews[0];
  const navItems = [
    { id: "profile-services", label: "Services", show: true },
    { id: "profile-work", label: "Work", show: site.portfolio.length > 0 },
    { id: "profile-reviews", label: "Reviews", show: site.reviews.length > 0 },
    { id: "profile-about", label: "About", show: true },
  ].filter((item) => item.show);

  return <>
    <nav className="profile-nav-wrap" aria-label="Profile sections">
      <div className="profile-nav">
        {navItems.map((item) => <a href={`#${item.id}`} key={item.id}>{item.label}</a>)}
      </div>
    </nav>

    {featuredReview && <section className="profile-trust-summary" aria-label="Customer rating">
      <div className="profile-rating-score"><Star size={20} fill="currentColor" /><strong>{site.metrics.rating.toFixed(1)}</strong><span>{site.metrics.reviewCount} {site.metrics.reviewCount === 1 ? "review" : "reviews"}</span></div>
      <blockquote>“{featuredReview.text}”</blockquote>
      <a href="#profile-reviews">Read reviews <ArrowUpRight size={14} /></a>
    </section>}

    <section className="profile-section profile-services" id="profile-services">
      <div className="profile-section-heading"><p>Choose what you need</p><h2>Services</h2></div>
      <div className="profile-service-grid">
        {services.length ? services.map((service) => {
          const portfolio = site.portfolio.filter((item) => item.serviceId === service.id);
          return <article className="profile-service-card" key={service.id}>
            <div className="profile-service-copy"><h3>{service.name}</h3>{service.description && <p>{service.description}</p>}</div>
            {portfolio.length > 0 && <ProofGallery compact portfolio={portfolio} />}
            <div className="profile-service-meta"><span><Clock3 size={15} /> {duration(service.durationMinutes)}</span><strong>{service.priceMode === "from" ? "From " : ""}{money(service.priceCents)}</strong></div>
            {interactive && <a className="profile-service-book" href="#book" data-booking-service={service.id}>Book <ArrowUpRight size={16} /></a>}
          </article>;
        }) : <p className="profile-empty">Services are being updated. Please check back soon.</p>}
      </div>
    </section>

    {site.portfolio.length > 0 && <section className="profile-section profile-work" id="profile-work">
      <div className="profile-section-heading"><p>Proof, not promises</p><h2>Recent work</h2></div>
      <ProofGallery portfolio={site.portfolio} />
    </section>}

    {site.reviews.length > 0 && <section className="profile-section profile-reviews" id="profile-reviews"><ReviewSection reviews={site.reviews} title="Customer reviews" /></section>}

    <section className="profile-section profile-about" id="profile-about">
      <div className="profile-about-copy">
        <div className="profile-section-heading"><p>Meet your provider</p><h2>About</h2></div>
        <p>{site.partner.about?.trim() || `${site.partner.businessName} provides reliable ${site.partner.serviceCategory.toLowerCase()} services${hasArea ? ` in ${site.partner.serviceArea}` : ""}.`}</p>
      </div>
      <div className="profile-details">
        {hasArea && <div><h3><MapPin size={17} /> Service area</h3><p>{site.partner.serviceArea}</p></div>}
        <div><h3><Clock3 size={17} /> Business hours</h3><dl className="profile-hours">{days.map((day, index) => <div key={day}><dt>{day}</dt><dd>{site.availability.weekdays.includes(index) ? `${clock(site.availability.startTime)} – ${clock(site.availability.endTime)}` : "Closed"}</dd></div>)}</dl></div>
      </div>
    </section>
  </>;
}
