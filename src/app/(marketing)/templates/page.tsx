import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { TEMPLATE_CATALOG } from "@/templates/catalog";

export const metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <main className="landing">
      <nav className="marketing-nav" aria-label="Primary navigation">
        <Link className="wordmark" href="/">cleanie</Link>
        <div className="nav-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Log in</Link>
          <Link className="button small" href="/signup">Create your page</Link>
        </div>
      </nav>
      <section className="section">
        <div className="eyebrow">Templates</div>
        <h1>A focused page for every kind of clean.</h1>
        <p>Every direction uses the same services, proof, reviews, availability, and booking flow—only the presentation changes.</p>
        <div className="landing-template-grid">
          {TEMPLATE_CATALOG.map((template) => (
            <article
              className={`landing-template-card ${template.layout}`}
              key={template.key}
              style={{ "--template-color": template.theme.primaryColor } as CSSProperties}
            >
              <span>{template.layout}</span>
              <b>{template.title}</b>
              <i />
              <i />
            </article>
          ))}
        </div>
        <p><Link className="button" href="/signup">Create your Cleanie page <ArrowRight size={16} /></Link></p>
      </section>
    </main>
  );
}
