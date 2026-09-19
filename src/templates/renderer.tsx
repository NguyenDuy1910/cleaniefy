import type { CSSProperties } from "react";
import { ArrowUpRight, CalendarCheck2, Instagram, MapPin, ShieldCheck, Star } from "lucide-react";
import type { PartnerSiteState } from "@/features/partner/types";
import type { SiteRuntimeMode } from "@/features/booking/site-actions";
import { BookingExperience } from "@/components/booking/booking-experience";
import { SiteImage } from "@/components/public-site/site-image";
import { ProfileTabs } from "@/components/public-site/profile-tabs";

function intro(site: PartnerSiteState) {
  const tagline = site.partner.tagline?.trim();
  if (tagline && tagline !== "Thoughtful cleaning, made easy.") return tagline;
  const area = site.partner.serviceArea && site.partner.serviceArea !== "Your local area" ? ` in ${site.partner.serviceArea}` : "";
  return `Reliable cleaning${area}, with booking made simple.`;
}

function Profile({ site, interactive }: { site: PartnerSiteState; interactive: boolean }) {
  const services = site.services.filter((service) => service.active);
  const canBook = interactive && services.length > 0;
  const hasArea = Boolean(site.partner.serviceArea && site.partner.serviceArea !== "Your local area");
  const lowestPrice = services.length ? Math.min(...services.map((service) => service.priceCents)) : 0;
  const startingPrice = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(lowestPrice / 100);
  return <>
    <header className="profile-hero">
      <div className="profile-cover"><SiteImage src={site.partner.heroImageUrl || site.partner.profileImageUrl} alt={`${site.partner.businessName} cover`} /></div>
      <div className="profile-hero-inner">
        <div className="profile-avatar"><SiteImage src={site.partner.profileImageUrl} alt={`${site.partner.businessName} profile`} /></div>
        <div className="profile-heading">
          <p className="profile-kicker">{site.partner.serviceCategory}</p>
          <h1>{site.partner.businessName}</h1>
          <div className="profile-trust">
            {site.metrics.reviewCount > 0 && <span><Star size={15} fill="currentColor" /> {site.metrics.rating.toFixed(1)} · {site.metrics.reviewCount} {site.metrics.reviewCount === 1 ? "review" : "reviews"}</span>}
            {hasArea && <span><MapPin size={15} /> {site.partner.serviceArea}</span>}
          </div>
          <p className="profile-intro">{intro(site)}</p>
          <div className="profile-assurance"><span><ShieldCheck size={15} /> Secure booking</span><span><CalendarCheck2 size={15} /> Instant confirmation</span></div>
          {site.partner.instagramUrl && <a className="profile-social-link" href={site.partner.instagramUrl} target="_blank" rel="noopener noreferrer"><Instagram size={16} /> Instagram <ArrowUpRight size={14} /></a>}
        </div>
        {canBook && <aside className="profile-booking-card"><span>Services from</span><strong>{startingPrice}</strong><small>Choose a service and time in a few taps.</small><a className="site-button profile-hero-book" href="#book" data-start-booking>Book now <ArrowUpRight size={17} /></a></aside>}
      </div>
    </header>
    <div className="profile-body">
      <ProfileTabs site={site} interactive={canBook} />
    </div>
    <footer className="site-footer"><ShieldCheck size={15} /> Powered by Cleanie</footer>
    {canBook && <div className="profile-sticky-action"><div><small>Services from</small><strong>{startingPrice}</strong></div><a className="site-button" href="#book" data-start-booking>Book now <ArrowUpRight size={17} /></a></div>}
  </>;
}

export function SiteRenderer({ site, compact = false, interactive = true, mode = "published", resetKey = 0 }: {
  site: PartnerSiteState;
  compact?: boolean;
  interactive?: boolean;
  mode?: SiteRuntimeMode;
  resetKey?: number;
}) {
  const style = { "--brand-primary": site.site.theme.primaryColor } as CSSProperties;
  const profile = <Profile site={site} interactive={interactive} />;
  return <main className={`public-site public-profile ${compact ? "site-compact" : ""}`} style={style} key={resetKey}>
    {compact ? profile : <BookingExperience site={site} mode={mode} interactive={interactive} profile={profile} />}
  </main>;
}
