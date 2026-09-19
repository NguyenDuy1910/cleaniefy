import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Palette,
  Share2,
  Sparkles,
} from "lucide-react";

const steps = [
  [
    "01",
    "Choose your service",
    "Tell us what you offer and where you work.",
    Palette,
  ],
  [
    "02",
    "Add the essentials",
    "Select services and prices, set your hours, and upload your best work.",
    Sparkles,
  ],
  [
    "03",
    "Publish one link",
    "Your polished booking page is ready to share in minutes—not weeks.",
    Share2,
  ],
  [
    "04",
    "Get booked",
    "Customers choose a service and a time while you see exactly where, when, and how much.",
    CalendarDays,
  ],
] as const;

export default function HomePage() {
  return (
    <main className="landing">
      <nav className="marketing-nav" aria-label="Primary navigation">
        <Link className="wordmark" href="/">
          cleanie
        </Link>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Log in</Link>
          <Link className="button small" href="/signup">
            Create your page
          </Link>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">A better way to get booked</div>
            <h1>
              Your cleaning business deserves a page that works as hard as you
              do.
            </h1>
            <p>
              Create a beautiful, trustworthy booking page in minutes. No
              website project, no complicated setup—just one link your customers
              can use to book you.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/signup">
                Create your Cleanie page <ArrowRight size={16} />
              </Link>
              <Link className="button secondary" href="/jessica">
                See a live example
              </Link>
            </div>
            <div className="hero-note">
              Start simple. Publish whenever you’re ready.
            </div>
          </div>
          <div className="hero-phone" aria-label="Example Cleanie booking page">
            <div className="phone-top">
              <img
                className="phone-avatar"
                src="/demo/jessica.png"
                alt="Jessica's Home Care"
              />
              <div className="phone-title">Jessica&apos;s Home Care</div>
              <div className="phone-rating">★★★★★ 4.9 · 126 Google reviews</div>
            </div>
            <div className="phone-list">
              <a className="phone-cta" href="/jessica#book">
                Book a cleaning
              </a>
              <h3>Popular services</h3>
              <div>
                <span>Deep Cleaning</span>
                <b>$180+</b>
              </div>
              <div>
                <span>Standard Cleaning</span>
                <b>$120+</b>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section" id="how-it-works">
        <div className="eyebrow">Simple by design</div>
        <h2>From “I need a website” to “I&apos;m taking bookings.”</h2>
        <p>
          Cleanie keeps your setup focused on the few things customers actually
          need to decide.
        </p>
        <div className="steps">
          {steps.map(([number, title, description, Icon]) => (
            <article className="step" key={number}>
              <span>{number}</span>
              <Icon color="#26573d" size={22} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section" id="templates">
        <div className="templates-promo"><div><div className="eyebrow">One polished page</div><h2>Your services make it yours.</h2><p>Cleanie turns your business information, photos, reviews, and hours into a page customers can trust and book.</p><Link className="button" href="/signup">Create your page <ArrowRight size={16} /></Link></div></div>
      </section>
      <footer className="footer">
        © {new Date().getFullYear()} Cleanie. One page. More bookings.
      </footer>
    </main>
  );
}
