import type { CSSProperties } from "react";
import { BadgeCheck, MapPin, ShieldCheck, Star } from "lucide-react";
import type { TemplateDefinition } from "@/templates/catalog";
import type { PartnerSiteState } from "@/features/partner/types";
import type { Service } from "@/features/services/types";
import { BookingFlow } from "@/components/booking/booking-flow";
import type { SiteRuntimeMode } from "@/features/booking/site-actions";
import { SiteImage } from "@/components/public-site/site-image";
import { ProofGallery } from "@/components/public-site/proof-gallery";
import { ReviewSection } from "@/components/public-site/review-section";

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
const duration = (minutes: number) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)}–${Math.ceil(minutes / 60) + 1} hr`
    : `${minutes} min`;

function Rating({
  site,
  short = false,
}: {
  site: PartnerSiteState;
  short?: boolean;
}) {
  return (
    <div className="site-rating">
      <Star size={short ? 13 : 15} fill="currentColor" />
      <span>
        {site.metrics.rating.toFixed(1)}{" "}
        {short ? "Google" : `· ${site.metrics.reviewCount} Google reviews`}
      </span>
    </div>
  );
}

function HeroAction({
  cta,
  interactive,
}: {
  cta: string;
  interactive: boolean;
}) {
  return interactive ? (
    <a className="site-button" href="#book">
      {cta}
    </a>
  ) : (
    <span className="site-button">{cta}</span>
  );
}

function Services({
  services,
  definition,
}: {
  services: Service[];
  definition: TemplateDefinition;
}) {
  const pricePrefix = definition.layout === "warm" ? "from " : "";
  return (
    <section
      className={`site-services ${definition.layout}`}
      aria-labelledby="services-title"
    >
      <h2 id="services-title">{definition.servicesTitle}</h2>
      <div className="service-grid">
        {services
          .filter((service) => service.active)
          .map((service) => (
            <article className="site-service" key={service.id}>
              <div>
                <h3>{service.name}</h3>
                <p>
                  {service.description || duration(service.durationMinutes)}
                </p>
              </div>
              <strong>
                {pricePrefix}
                {money(service.priceCents)}+
              </strong>
            </article>
          ))}
      </div>
    </section>
  );
}

function About({ site }: { site: PartnerSiteState }) {
  if (!site.partner.about) return null;
  return (
    <section className="site-about">
      <h2>About {site.partner.businessName}</h2>
      <p>{site.partner.about}</p>
    </section>
  );
}

function SiteHero({
  site,
  definition,
  interactive,
}: {
  site: PartnerSiteState;
  definition: TemplateDefinition;
  interactive: boolean;
}) {
  const hero = site.partner.heroImageUrl || site.partner.profileImageUrl;
  const cta = site.booking.ctaLabel || "Book your cleaning";
  const business = site.partner.businessName;

  if (definition.layout === "warm")
    return (
      <header className="site-hero warm">
        <p className="hero-eyebrow">{definition.eyebrow}</p>
        <h1>{business}</h1>
        <p className="hero-tagline">{site.partner.tagline}</p>
        <div className="hero-image">
          <SiteImage src={hero} alt={`${business} team`} />
          <Rating site={site} short />
        </div>
        <h2>{definition.heroHeadline}</h2>
        <p className="area">
          <MapPin size={13} />
          {site.partner.serviceArea}
        </p>
        <HeroAction cta={cta} interactive={interactive} />
      </header>
    );

  if (definition.layout === "pro")
    return (
      <header className="site-hero pro">
        <SiteImage className="hero-background" src={hero} alt="" />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="verified">
            <BadgeCheck size={13} />
            {definition.eyebrow}
          </span>
          <h1>{business}</h1>
          <p>{site.partner.tagline}</p>
          <Rating site={site} />
        </div>
        <HeroAction cta={cta} interactive={interactive} />
      </header>
    );

  if (definition.layout === "split")
    return (
      <header className="site-hero split">
        <div className="split-copy">
          <p className="hero-eyebrow">{definition.eyebrow}</p>
          <h1>{business}</h1>
          <p>{site.partner.tagline}</p>
          <Rating site={site} />
          <HeroAction cta={cta} interactive={interactive} />
        </div>
        <div className="split-media">
          <SiteImage src={hero} alt={`${business} team`} />
          <span>{definition.heroHeadline}</span>
        </div>
      </header>
    );

  if (definition.layout === "editorial")
    return (
      <header className="site-hero editorial">
        <div className="editorial-copy">
          <p className="hero-eyebrow">{definition.eyebrow}</p>
          <h1>{business}</h1>
          <p>{site.partner.tagline}</p>
          <Rating site={site} />
        </div>
        <div className="editorial-media">
          <SiteImage src={hero} alt={`${business} team`} />
          <div>
            <span>{definition.heroHeadline}</span>
            <HeroAction cta={cta} interactive={interactive} />
          </div>
        </div>
      </header>
    );

  return (
    <header className="site-hero clean">
      <SiteImage className="hero-background" src={hero} alt="" />
      <div className="hero-shade" />
      <div className="hero-content">
        <p className="hero-eyebrow">{definition.eyebrow}</p>
        <h1>{business}</h1>
        <Rating site={site} />
      </div>
      <p className="clean-tagline">
        {site.partner.tagline}
        <span>
          <MapPin size={13} />
          {site.partner.serviceArea}
        </span>
      </p>
      <HeroAction cta={cta} interactive={interactive} />
    </header>
  );
}

function Metrics({ site }: { site: PartnerSiteState }) {
  return (
    <section className="pro-metrics">
      <div>
        <b>{site.metrics.reviewCount}</b>
        <span>reviews</span>
      </div>
      <div>
        <b>{site.partner.serviceArea || "Local"}</b>
        <span>service area</span>
      </div>
      <div>
        <b>{site.availability.weekdays.length} days</b>
        <span>available</span>
      </div>
    </section>
  );
}

export function TemplateShell({
  site,
  definition,
  compact = false,
  interactive = true,
  mode = "published",
}: {
  site: PartnerSiteState;
  definition: TemplateDefinition;
  compact?: boolean;
  interactive?: boolean;
  mode?: SiteRuntimeMode;
}) {
  const background =
    site.site.theme.backgroundTone === "warm"
      ? "#fcf6eb"
      : site.site.theme.backgroundTone === "cool"
        ? "#f4f6fb"
        : "#f9faf7";
  const style = {
    "--brand-primary": site.site.theme.primaryColor,
    "--button-radius":
      site.site.theme.buttonStyle === "pill" ? "999px" : "14px",
    "--site-bg": background,
    "--site-font":
      site.site.theme.fontPreset === "soft"
        ? "var(--font-lora)"
        : "var(--font-manrope)",
  } as CSSProperties;

  return (
    <main
      className={`public-site template-${definition.key} layout-${definition.layout} ${compact ? "site-compact" : ""}`}
      style={style}
    >
      <SiteHero site={site} definition={definition} interactive={interactive} />
      <div className="site-content">
        {definition.intro && <p className="intro-line">{definition.intro}</p>}
        {site.site.sections.services && (
          <Services services={site.services} definition={definition} />
        )}
        {definition.layout === "pro" && <Metrics site={site} />}
        {site.site.sections.portfolio && <ProofGallery portfolio={site.portfolio} />}
        {site.site.sections.reviews && (
          <ReviewSection reviews={site.reviews} title={definition.reviewTitle} />
        )}
        {site.site.sections.about && <About site={site} />}
        {!compact && <BookingFlow site={site} interactive={interactive} mode={mode} />}
      </div>
      {!compact && (
        <footer className="site-footer">
          <ShieldCheck size={14} /> Powered by Cleanie
        </footer>
      )}
    </main>
  );
}
