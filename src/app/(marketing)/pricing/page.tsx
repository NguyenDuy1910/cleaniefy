import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export const metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <main className="landing">
      <nav className="marketing-nav" aria-label="Primary navigation">
        <Link className="wordmark" href="/">cleanie</Link>
        <div className="nav-links">
          <Link href="/login">Log in</Link>
          <Link className="button small" href="/signup">Create your page</Link>
        </div>
      </nav>
      <section className="section">
        <div className="eyebrow">Simple by design</div>
        <h1>Start with a booking page that is ready to work.</h1>
        <p>Cleanie keeps setup focused on what customers need to see and choose. Create an account to build your page while launch pricing is finalized.</p>
        <div className="steps">
          {[
            "A branded public page and shareable link",
            "Services, reviews, portfolio, and availability controls",
            "A customer booking flow and partner dashboard",
          ].map((feature, index) => (
            <article className="step" key={feature}>
              <span>0{index + 1}</span>
              <Check color="#26573d" size={22} />
              <h3>{feature}</h3>
            </article>
          ))}
        </div>
        <p><Link className="button" href="/signup">Create your Cleanie page <ArrowRight size={16} /></Link></p>
      </section>
    </main>
  );
}
