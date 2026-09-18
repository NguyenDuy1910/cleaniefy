import type { CSSProperties } from "react";
import { BadgeCheck, MapPin, ShieldCheck, Star } from "lucide-react";
import type { TemplateDefinition } from "@/templates/catalog";
import type { PublicSite } from "@/features/partner/types";
import type { Service } from "@/features/services/types";
import { BookingFlow } from "@/components/booking/booking-flow";

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
const firstReview = (site: PublicSite) =>
  site.reviews.find((review) => review.featured) ?? site.reviews[0];

function Rating({
  site,
  short = false,
}: {
  site: PublicSite;
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

function Proof({ site }: { site: PublicSite }) {
  const portfolio = site.portfolio[0];
  if (!portfolio) return null;
  return (
    <section className="site-proof" aria-labelledby="proof-title">
      <h2 id="proof-title">Work you can see</h2>
      <figure>
        <div>
          <img
            src={portfolio.beforeImageUrl}
            alt={`Before: ${portfolio.caption || "cleaning work"}`}
          />
          <span>Before</span>
        </div>
        <div>
          <img
            src={portfolio.afterImageUrl}
            alt={`After: ${portfolio.caption || "cleaning work"}`}
          />
          <span>After</span>
        </div>
      </figure>
      {portfolio.caption && <p>{portfolio.caption}</p>}
    </section>
  );
}

function ReviewCard({
  site,
  definition,
}: {
  site: PublicSite;
  definition: TemplateDefinition;
}) {
  const review = firstReview(site);
  if (!review) return null;
  return (
    <section className="site-review" aria-labelledby="review-title">
      <h2 id="review-title">{definition.reviewTitle}</h2>
      <article>
        <div className="review-stars">★★★★★</div>
        <blockquote>“{review.text}”</blockquote>
        <cite>
          — {review.author} ·{" "}
          {review.source === "google" ? "Google" : "Customer"}
        </cite>
      </article>
    </section>
  );
}

function About({ site }: { site: PublicSite }) {
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
  site: PublicSite;
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
          {hero && <img src={hero} alt={`${business} team`} />}
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
        {hero && <img className="hero-background" src={hero} alt="" />}
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
          {hero && <img src={hero} alt={`${business} team`} />}
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
          {hero && <img src={hero} alt={`${business} team`} />}
          <div>
            <span>{definition.heroHeadline}</span>
            <HeroAction cta={cta} interactive={interactive} />
          </div>
        </div>
      </header>
    );

  return (
    <header className="site-hero clean">
      {hero && <img className="hero-background" src={hero} alt="" />}
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

function Metrics({ site }: { site: PublicSite }) {
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
}: {
  site: PublicSite;
  definition: TemplateDefinition;
  compact?: boolean;
  interactive?: boolean;
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
        {site.site.sections.portfolio && <Proof site={site} />}
        {site.site.sections.reviews && (
          <ReviewCard site={site} definition={definition} />
        )}
        {site.site.sections.about && <About site={site} />}
        {!compact && <BookingFlow site={site} interactive={interactive} />}
      </div>
      {!compact && (
        <footer className="site-footer">
          <ShieldCheck size={14} /> Powered by Cleanie
        </footer>
      )}
    </main>
  );
}
