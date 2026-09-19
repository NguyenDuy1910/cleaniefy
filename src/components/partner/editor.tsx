"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ImagePlus,
  LoaderCircle,
  Monitor,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { updatePartnerProfileAction, updateThemeAction, publishPartnerAction } from "@/features/partner/actions";
import { createServiceAction, deleteServiceAction, updateServiceAction } from "@/features/services/actions";
import { createPortfolioItemAction, deletePortfolioItemAction } from "@/features/portfolio/actions";
import { createReviewAction, deleteReviewAction } from "@/features/reviews/actions";
import { updateAvailabilityAction } from "@/features/booking/actions";
import { uploadPartnerMedia } from "@/lib/blob/client";
import type { ActionResult } from "@/lib/utils/actions";
import type {
  Overview,
  PublicSite,
  Service,
  ThemeConfig,
} from "@/lib/types";
import { DashboardFrame } from "./dashboard-home";
import { PreviewFrame } from "@/components/preview/preview-frame";
import { toPartnerSiteState } from "@/components/preview/preview-messages";
import type { PartnerSiteState } from "@/features/partner/types";

type Tab =
  | "brand"
  | "theme"
  | "services"
  | "reviews"
  | "booking";
const tabs: [Tab, string][] = [
  ["brand", "Your profile"],
  ["services", "Services"],
  ["reviews", "Reviews"],
  ["booking", "Booking"],
  ["theme", "Look"],
];
const colors = ["#26573d", "#8f5733", "#243873", "#73385c", "#1f1f1f"];

type PreviewUpdate = {
  partner?: Partial<PartnerSiteState["partner"]>;
  site?: Partial<PartnerSiteState["site"]>;
  availability?: PartnerSiteState["availability"];
  booking?: PartnerSiteState["booking"];
  services?: PartnerSiteState["services"];
  portfolio?: PartnerSiteState["portfolio"];
  reviews?: PartnerSiteState["reviews"];
};
const tabForRequirement = {
  businessName: "brand",
  profileImage: "brand",
  serviceArea: "brand",
  service: "services",
  availability: "booking",
} as const satisfies Record<Overview["publishReadiness"]["requirements"][number]["key"], Tab>;
async function requireAction<T>(result: Promise<ActionResult<T>>) {
  const response = await result;
  if ("error" in response) throw new Error(response.error);
  return response.data;
}

export function Editor({ initialOverview }: { initialOverview: Overview }) {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview>(initialOverview);
  const [preview, setPreview] = useState<PartnerSiteState>(() => toPartnerSiteState(initialOverview));
  const [previewOpen, setPreviewOpen] = useState(false);
  const temporaryImageUrls = useRef(new Set<string>());
  const [tab, setTab] = useState<Tab>("brand");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setOverview(initialOverview);
  }, [initialOverview]);
  useEffect(() => () => {
    temporaryImageUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  useEffect(() => {
    const requestedValue = new URLSearchParams(location.search).get("tab");
    const requested = (requestedValue === "gallery" ? "services" : requestedValue) as Tab | null;
    if (requested && tabs.some(([value]) => value === requested))
      setTab(requested);
  }, []);
  const succeed = (message: string) => {
    setNotice(message);
    setError("");
    setTimeout(() => setNotice(""), 2500);
    router.refresh();
  };
  const run = async (message: string, action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      succeed(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t save that change. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const updatePreview = (update: PreviewUpdate) => {
    setPreview(
      (current) =>
        current && {
          ...current,
          partner: update.partner
            ? { ...current.partner, ...update.partner }
            : current.partner,
          site: update.site
            ? { ...current.site, ...update.site }
            : current.site,
          availability: update.availability ?? current.availability,
          booking: update.booking ?? current.booking,
          services: update.services ?? current.services,
          portfolio: update.portfolio ?? current.portfolio,
          reviews: update.reviews ?? current.reviews,
          metrics: update.reviews ? {
            ...current.metrics,
            reviewCount: update.reviews.length,
            rating: update.reviews.length
              ? Math.round(update.reviews.reduce((total, review) => total + review.rating, 0) / update.reviews.length * 10) / 10
              : 5,
          } : current.metrics,
        },
    );
  };
  const readiness = overview.publishReadiness;
  const firstIncomplete = readiness.requirements.find((item) => !item.complete);
  const focusRequirement = (key: Overview["publishReadiness"]["requirements"][number]["key"]) => {
    setTab(tabForRequirement[key]);
    setError("");
  };
  const publish = () => {
    if (firstIncomplete) {
      focusRequirement(firstIncomplete.key);
      setError(`Complete ${firstIncomplete.label.toLowerCase()} before publishing.`);
      return;
    }
    run("Your Cleanie page is live.", () => requireAction(publishPartnerAction()));
  };
  return (
    <DashboardFrame active="editor" partnerSlug={overview.partner.slug} published={overview.partner.status === "published"} wide>
      <div className="page-editor">
      <header className="editor-header">
        <div>
          <h1>Set up your page</h1>
          <p>Add the essentials. Cleanie handles the website.</p>
        </div>
        <div className="editor-top-actions">
          <span className={`publish-status ${overview.partner.status}`}>
            <i /> {overview.partner.status === "published" ? "Published" : "Draft"}
          </span>
          {overview.partner.status === "published" && <a
            className="button secondary small"
            href={`/${overview.partner.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            View live page
          </a>}
          <button
            aria-controls="live-preview"
            aria-expanded={previewOpen}
            className="button secondary small editor-preview-toggle"
            onClick={() => setPreviewOpen((open) => !open)}
            type="button"
          >
            <Monitor size={15} /> {previewOpen ? "Hide preview" : "Preview"}
          </button>
          {overview.partner.status !== "published" && (
            <button className="button small" onClick={publish} disabled={busy}>
              {readiness.ready ? "Publish page" : "Finish setup"}
            </button>
          )}
        </div>
      </header>
      <div className="editor-workspace">
        <section className={`editor-panel ${busy ? "is-saving" : ""}`} aria-busy={busy} id="editor-panel">
          <div className="editor-panel-header">
            <h2>Your business, in a few clicks</h2>
            <p>Choose a section to add or update your information.</p>
          </div>
          {busy && (
            <div className="editor-saving-overlay" role="status" aria-live="polite">
              <span><LoaderCircle className="spin" size={20} /></span>
              <div><b>Saving your changes</b><small>Your live preview stays in sync.</small></div>
            </div>
          )}
          {overview.partner.status !== "published" && (
            <section className="publish-readiness" aria-label="Publish checklist">
              <div>
                <span>READY TO PUBLISH</span>
                <h3>
                  {readiness.ready
                    ? "Everything essential is in place."
                    : "Complete the essentials, then go live."}
                </h3>
              </div>
              <div className="publish-checklist">
                {readiness.requirements.map((requirement) => (
                  <button
                    className={requirement.complete ? "complete" : ""}
                    key={requirement.key}
                    onClick={() => focusRequirement(requirement.key)}
                    type="button"
                  >
                    {requirement.complete ? <Check size={14} /> : <ArrowRight size={14} />}
                    <span>{requirement.label}</span>
                    <small>{requirement.complete ? "Ready" : "Finish"}</small>
                  </button>
                ))}
              </div>
            </section>
          )}
          {notice && (
            <p className="editor-notice">
              <Check size={15} />
              {notice}
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="editor-accordion-nav" aria-label="Setup sections">
            {tabs.map(([value, label]) => <button className={tab === value ? "active" : ""} key={value} type="button" onClick={() => setTab(value)} aria-expanded={tab === value}>{label}</button>)}
          </div>
          <div className="editor-active-section" hidden={tab !== "brand"}>
            <BrandEditor
              overview={overview}
              busy={busy}
              onPreview={(partner) => updatePreview({ partner })}
              onSave={(data) =>
                run("Brand saved.", () => requireAction(updatePartnerProfileAction(data)))
              }
              onUpload={(file, purpose) => {
                const temporaryUrl = URL.createObjectURL(file);
                temporaryImageUrls.current.add(temporaryUrl);
                updatePreview({
                  partner:
                    purpose === "profile"
                      ? { profileImageUrl: temporaryUrl }
                      : { heroImageUrl: temporaryUrl },
                });
                run("Image uploaded.", async () => {
                  const result = await uploadPartnerMedia(file, purpose);
                  await requireAction(updatePartnerProfileAction(
                    purpose === "profile"
                      ? { profileImageUrl: result.url }
                      : { heroImageUrl: result.url },
                  ));
                  updatePreview({ partner: purpose === "profile" ? { profileImageUrl: result.url } : { heroImageUrl: result.url } });
                  URL.revokeObjectURL(temporaryUrl);
                  temporaryImageUrls.current.delete(temporaryUrl);
                });
              }}
            />
          </div>
          <div className="editor-active-section" hidden={tab !== "theme"}>
            <ThemeEditor
              overview={overview}
              busy={busy}
              onPreview={(site) => updatePreview({ site })}
              onSave={(value) => run("Theme saved.", () => requireAction(updateThemeAction(value)))}
            />
          </div>
          <div className="editor-active-section" hidden={tab !== "services"}>
            <div className="editor-service-stack">
              <section className="editor-service-section" aria-labelledby="editor-services-heading">
                <header><span>1</span><div><h3 id="editor-services-heading">Services, pricing and results</h3><p>Each service keeps its own price, duration and before-and-after gallery.</p></div></header>
                <ServicesEditor overview={overview} busy={busy} run={run} previewServices={preview.services} previewPortfolio={preview.portfolio} onPreview={(services) => updatePreview({ services })} onPreviewPortfolio={(portfolio) => updatePreview({ portfolio })} />
              </section>
            </div>
          </div>
          <div className="editor-active-section" hidden={tab !== "reviews"}>
            <ReviewsEditor overview={overview} busy={busy} run={run} previewReviews={preview.reviews} onPreview={(reviews) => updatePreview({ reviews })} />
          </div>
          <div className="editor-active-section" hidden={tab !== "booking"}>
            <BookingEditor
              overview={overview}
              busy={busy}
              run={run}
              onPreview={updatePreview}
            />
          </div>
        </section>
        <PreviewFrame site={preview} open={previewOpen} />
      </div>
      </div>
    </DashboardFrame>
  );
}

const categories = ["Home Cleaner", "Office Cleaner", "Airbnb Cleaner", "Car Detailer", "Window Cleaner", "Carpet Cleaner", "Other"] as const;
const audiences = ["Families", "Busy professionals", "Offices", "Airbnb hosts", "Everyone"] as const;
const qualities = ["Reliable", "Friendly", "Detailed", "Fast", "Eco-friendly", "Premium"] as const;
const usServiceAreas = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "Austin, TX",
  "Jacksonville, FL", "Fort Worth, TX", "San Jose, CA", "Columbus, OH", "Charlotte, NC",
  "Indianapolis, IN", "San Francisco, CA", "Seattle, WA", "Denver, CO", "Washington, DC",
  "Nashville, TN", "Las Vegas, NV", "Boston, MA", "Portland, OR", "Detroit, MI",
  "Atlanta, GA", "Kansas City, MO", "Raleigh, NC", "Miami, FL", "Orlando, FL",
  "Tampa, FL", "Minneapolis, MN", "New Orleans, LA", "Cleveland, OH", "Pittsburgh, PA",
] as const;
function generatedIntro(category: string, audience: string, quality: string, area: string) {
  const service = category === "Other" ? "local service" : category.toLowerCase().replace(/cleaner$/, "cleaning").replace(/detailer$/, "detailing");
  const forWhom = audience === "Everyone" ? "" : ` for ${audience.toLowerCase()}`;
  const where = area && area !== "Your local area" ? ` in ${area}` : "";
  return `${quality} ${service}${forWhom}${where}.`;
}
function BrandEditor({ overview, busy, onSave, onUpload, onPreview }: {
  overview: Overview;
  busy: boolean;
  onSave: (value: Record<string, string | null>) => void;
  onUpload: (file: File, purpose: "profile" | "hero") => void;
  onPreview: (value: Partial<PublicSite["partner"]>) => void;
}) {
  const [name, setName] = useState(overview.partner.businessName);
  const [slug, setSlug] = useState(overview.partner.slug);
  const [category, setCategory] = useState(overview.partner.serviceCategory);
  const [area, setArea] = useState(overview.partner.serviceArea === "Your local area" ? "" : overview.partner.serviceArea);
  const [audience, setAudience] = useState<(typeof audiences)[number]>("Families");
  const [quality, setQuality] = useState<(typeof qualities)[number]>("Reliable");
  const [tagline, setTagline] = useState(overview.partner.tagline === "Thoughtful cleaning, made easy." ? "" : overview.partner.tagline);
  const [instagramUrl, setInstagramUrl] = useState(overview.partner.instagramUrl ?? "");
  const [editingIntro, setEditingIntro] = useState(false);
  const [editingLink, setEditingLink] = useState(false);
  const suggested = generatedIntro(category, audience, quality, area);
  return <form className="editor-form" onSubmit={(event) => {
    event.preventDefault();
    onSave({ businessName: name, slug, serviceCategory: category, serviceArea: area, tagline: tagline || suggested, instagramUrl: instagramUrl.trim() || null });
  }}>
    <div className="image-upload-row">
      <label className="image-upload">{overview.partner.profileImageUrl ? <img src={overview.partner.profileImageUrl} alt="Current profile" /> : <Upload size={21} />}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0], "profile")} /><span>Profile photo</span></label>
      <label className="image-upload wide">{overview.partner.heroImageUrl ? <img src={overview.partner.heroImageUrl} alt="Current cover" /> : <ImagePlus size={21} />}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0], "hero")} /><span>Cover image</span></label>
    </div>
    <label>Business name<input value={name} onChange={(event) => { setName(event.target.value); onPreview({ businessName: event.target.value }); }} required /></label>
    <fieldset><legend>What do you do?</legend><div className="choice-row profile-choice-row">{categories.map((item) => <button key={item} type="button" className={category === item ? "selected" : ""} aria-pressed={category === item} onClick={() => { setCategory(item); onPreview({ serviceCategory: item }); }}>{item}</button>)}</div></fieldset>
    <label>Where do you work?
      <input
        list="us-service-areas"
        value={area}
        onChange={(event) => { setArea(event.target.value); onPreview({ serviceArea: event.target.value }); }}
        autoComplete="address-level2"
        placeholder="Search a US city"
        aria-describedby="service-area-help"
        required
      />
      <small id="service-area-help">Choose a city below, or enter another US service area.</small>
      <datalist id="us-service-areas">{usServiceAreas.map((serviceArea) => <option key={serviceArea} value={serviceArea} />)}</datalist>
    </label>
    <div className="service-area-suggestions" aria-label="Popular service areas">
      {usServiceAreas.slice(0, 6).map((serviceArea) => <button key={serviceArea} type="button" className={area === serviceArea ? "selected" : ""} onClick={() => { setArea(serviceArea); onPreview({ serviceArea }); }}>{serviceArea}</button>)}
    </div>
    <fieldset><legend>Who do you mainly serve?</legend><div className="choice-row profile-choice-row">{audiences.map((item) => <button key={item} type="button" className={audience === item ? "selected" : ""} aria-pressed={audience === item} onClick={() => setAudience(item)}>{item}</button>)}</div></fieldset>
    <fieldset><legend>How would you describe your service?</legend><div className="choice-row profile-choice-row">{qualities.map((item) => <button key={item} type="button" className={quality === item ? "selected" : ""} aria-pressed={quality === item} onClick={() => setQuality(item)}>{item}</button>)}</div></fieldset>
    <div className="generated-intro"><span>Suggested intro</span><p>{suggested}</p><button type="button" onClick={() => { setTagline(suggested); onPreview({ tagline: suggested }); }}>Use this</button><button type="button" onClick={() => setEditingIntro((value) => !value)}>{editingIntro ? "Done" : "Edit"}</button></div>
    {editingIntro && <label>Short intro<input maxLength={240} value={tagline} onChange={(event) => { setTagline(event.target.value); onPreview({ tagline: event.target.value }); }} placeholder={suggested} /></label>}
    <label>Instagram profile
      <input
        inputMode="url"
        maxLength={1000}
        placeholder="https://www.instagram.com/yourbusiness/"
        type="url"
        value={instagramUrl}
        onChange={(event) => { setInstagramUrl(event.target.value); onPreview({ instagramUrl: event.target.value || null }); }}
      />
      <small>Optional. Shown on your public profile.</small>
    </label>
    <button type="button" className="text-action" onClick={() => setEditingLink((value) => !value)}>Your link: /{slug} · Change</button>
    {editingLink && <label>Cleanie link<input value={slug} onChange={(event) => { const value = event.target.value.toLowerCase().replace(/\s+/g, "-"); setSlug(value); onPreview({ slug: value }); }} required /></label>}
    <button className="button" disabled={busy}><Save size={16} /> Save profile</button>
  </form>;
}

function ThemeEditor({ overview, busy, onSave, onPreview }: {
  overview: Overview;
  busy: boolean;
  onSave: (value: { theme: ThemeConfig }) => void;
  onPreview: (value: PreviewUpdate["site"]) => void;
}) {
  const [theme, setTheme] = useState<ThemeConfig>(overview.site.theme);
  const presets = [
    { label: "Clean", color: "#26573d", tone: "light" },
    { label: "Warm", color: "#8f5733", tone: "warm" },
    { label: "Premium", color: "#243873", tone: "cool" },
    { label: "Bold", color: "#73385c", tone: "light" },
  ] as const;
  const select = (update: Partial<ThemeConfig>) => {
    const next = { ...theme, ...update };
    setTheme(next);
    onPreview({ theme: next });
    onSave({ theme: next });
  };
  return <div className="editor-form">
    <p className="editor-helper">Your content always uses the same customer-friendly layout. Pick a color direction.</p>
    <fieldset><legend>Style</legend><div className="choice-row profile-choice-row">{presets.map((preset) => <button key={preset.label} type="button" className={theme.primaryColor === preset.color ? "selected" : ""} aria-pressed={theme.primaryColor === preset.color} onClick={() => select({ primaryColor: preset.color, backgroundTone: preset.tone })}>{preset.label}</button>)}</div></fieldset>
    <fieldset><legend>Accent</legend><div className="color-row">{colors.map((color) => <button key={color} type="button" className={theme.primaryColor === color ? "selected" : ""} style={{ backgroundColor: color }} onClick={() => select({ primaryColor: color })}><span className="sr-only">Use {color}</span></button>)}</div></fieldset>
    {busy && <span className="editor-helper">Saving look…</span>}
  </div>;
}

function ServicesEditor({
  overview,
  busy,
  run,
  previewServices,
  previewPortfolio,
  onPreview,
  onPreviewPortfolio,
}: {
  overview: Overview;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
  previewServices: Service[];
  previewPortfolio: PartnerSiteState["portfolio"];
  onPreview: (services: Service[]) => void;
  onPreviewPortfolio: (portfolio: PartnerSiteState["portfolio"]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const draftServiceId = useRef("");
  const hasActiveService = overview.services.some((service) => service.active);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    priceCents: "150",
    priceMode: "fixed" as "fixed" | "from",
    durationMinutes: "120",
  });
  const [customName, setCustomName] = useState(false);
  const [customPrice, setCustomPrice] = useState(false);
  const [customDuration, setCustomDuration] = useState(false);
  const updateDraft = (next: typeof draft) => {
    setDraft(next);
    const remaining = previewServices.filter((item) => item.id !== draftServiceId.current);
    onPreview(next.name.trim() ? [...remaining, {
      id: draftServiceId.current,
      name: next.name,
      description: next.description,
      priceCents: Number(next.priceCents) * 100 || 0,
      priceMode: next.priceMode,
      durationMinutes: Number(next.durationMinutes) || 120,
      active: true,
      sortOrder: remaining.length,
    }] : remaining);
  };
  const startAdding = () => {
    draftServiceId.current = crypto.randomUUID();
    setAdding(true);
  };
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    run("Service added.", async () => {
      const service = await requireAction(createServiceAction({
        name: draft.name,
        description: draft.description,
        priceCents: Number(draft.priceCents) * 100,
        priceMode: draft.priceMode,
        durationMinutes: Number(draft.durationMinutes),
        active: true,
      }));
      onPreview([...previewServices.filter((item) => item.id !== draftServiceId.current), service]);
      setAdding(false);
      setDraft({
        name: "",
        description: "",
        priceCents: "150",
        priceMode: "fixed",
        durationMinutes: "120",
      });
    });
  };
  return (
    <div className="manage-list">
      {!hasActiveService && (
        <section className="service-publish-callout">
          <div>
            <b>{overview.services.length ? "Make a service visible" : "Add your first service"}</b>
            <p>
              Customers need at least one visible service to book. This is the
              final requirement before you can publish.
            </p>
          </div>
          {!overview.services.length && !adding && (
            <button className="button small" onClick={startAdding} type="button">
              <Plus size={15} /> Add service
            </button>
          )}
        </section>
      )}
      {overview.services.map((service) => (
        <ServiceRow
          service={service}
          key={service.id}
          busy={busy}
          run={run}
          previewServices={previewServices}
          previewPortfolio={previewPortfolio}
          portfolioItems={overview.portfolio.filter((item) => item.serviceId === service.id)}
          onPreview={onPreview}
          onPreviewPortfolio={onPreviewPortfolio}
        />
      ))}
      {adding ? (
        <form className="inline-form" onSubmit={add}>
          <fieldset><legend>What service do you offer?</legend><div className="choice-row profile-choice-row">{["Standard Cleaning", "Deep Cleaning", "Move Out Cleaning", "Office Cleaning", "Airbnb Turnover", "Carpet Cleaning", "Window Cleaning"].map((name) => <button type="button" key={name} className={draft.name === name ? "selected" : ""} aria-pressed={draft.name === name} onClick={() => { setCustomName(false); updateDraft({ ...draft, name }); }}>{name}</button>)}<button type="button" className={customName ? "selected" : ""} onClick={() => { setCustomName(true); updateDraft({ ...draft, name: "" }); }}>Other</button></div></fieldset>
          {customName && <label>Service name<input value={draft.name} required onChange={(event) => updateDraft({ ...draft, name: event.target.value })} /></label>}
          <fieldset><legend>Price</legend><div className="choice-row profile-choice-row">{[120, 150, 180].map((price) => <button type="button" key={price} className={draft.priceCents === String(price) && !customPrice ? "selected" : ""} onClick={() => { setCustomPrice(false); updateDraft({ ...draft, priceCents: String(price) }); }}>${price}</button>)}<button type="button" className={customPrice ? "selected" : ""} onClick={() => setCustomPrice(true)}>Custom</button></div></fieldset>
          {customPrice && <label>Price in dollars<input type="number" min="0" value={draft.priceCents} onChange={(event) => updateDraft({ ...draft, priceCents: event.target.value })} required /></label>}
          <fieldset><legend>Duration</legend><div className="choice-row profile-choice-row">{[120, 180, 240].map((minutes) => <button type="button" key={minutes} className={draft.durationMinutes === String(minutes) && !customDuration ? "selected" : ""} onClick={() => { setCustomDuration(false); updateDraft({ ...draft, durationMinutes: String(minutes) }); }}>{minutes / 60} hr</button>)}<button type="button" className={customDuration ? "selected" : ""} onClick={() => setCustomDuration(true)}>Custom</button></div></fieldset>
          {customDuration && <label>Minutes<input type="number" min="15" step="15" value={draft.durationMinutes} onChange={(event) => updateDraft({ ...draft, durationMinutes: event.target.value })} required /></label>}
          <fieldset><legend>Pricing</legend><div className="choice-row profile-choice-row"><button type="button" className={draft.priceMode === "fixed" ? "selected" : ""} onClick={() => updateDraft({ ...draft, priceMode: "fixed" })}>Fixed</button><button type="button" className={draft.priceMode === "from" ? "selected" : ""} onClick={() => updateDraft({ ...draft, priceMode: "from" })}>Starting from</button></div></fieldset>
          <button className="button small" disabled={busy || !draft.name.trim()}>
            Add service
          </button>
          <button className="button secondary small" type="button" onClick={() => {
            onPreview(previewServices.filter((item) => item.id !== draftServiceId.current));
            setAdding(false);
          }}>Cancel</button>
        </form>
      ) : (
        <button className="text-action" onClick={startAdding}>
          <Plus size={16} /> Add service
        </button>
      )}
    </div>
  );
}
function ServiceRow({
  service,
  busy,
  run,
  previewServices,
  previewPortfolio,
  portfolioItems,
  onPreview,
  onPreviewPortfolio,
}: {
  service: Service;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
  previewServices: Service[];
  previewPortfolio: PartnerSiteState["portfolio"];
  portfolioItems: PartnerSiteState["portfolio"];
  onPreview: (services: Service[]) => void;
  onPreviewPortfolio: (portfolio: PartnerSiteState["portfolio"]) => void;
}) {
  const [edit, setEdit] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [draft, setDraft] = useState({
    name: service.name,
    description: service.description,
    price: String(service.priceCents / 100),
    duration: String(service.durationMinutes),
  });
  const updateDraft = (next: typeof draft) => {
    setDraft(next);
    onPreview(previewServices.map((item) => item.id === service.id ? {
      ...item,
      name: next.name,
      description: next.description,
      priceCents: Number(next.price) * 100 || 0,
      durationMinutes: Number(next.duration) || 15,
    } : item));
  };
  return (
    <article className={`manage-card service-manage-card ${edit ? "is-editing" : ""}`}>
      {edit ? (
        <>
          <input
            value={draft.name}
            onChange={(event) =>
              updateDraft({ ...draft, name: event.target.value })
            }
          />
          <input
            value={draft.description}
            onChange={(event) =>
              updateDraft({ ...draft, description: event.target.value })
            }
          />
          <div className="compact-fields">
            <input
              type="number"
              value={draft.price}
              onChange={(event) =>
                updateDraft({ ...draft, price: event.target.value })
              }
            />
            <input
              type="number"
              value={draft.duration}
              onChange={(event) =>
                updateDraft({ ...draft, duration: event.target.value })
              }
            />
          </div>
          <button
            className="button small"
            disabled={busy}
            onClick={() =>
              run("Service saved.", async () => {
                const updated = await requireAction(updateServiceAction(service.id, {
                  name: draft.name,
                  description: draft.description,
                  priceCents: Number(draft.price) * 100,
                  durationMinutes: Number(draft.duration),
                }));
                onPreview(previewServices.map((item) => item.id === service.id ? updated : item));
                setEdit(false);
              })
            }
          >
            Save
          </button>
          <button className="button secondary small" type="button" onClick={() => {
            onPreview(previewServices.map((item) => item.id === service.id ? service : item));
            setDraft({ name: service.name, description: service.description, price: String(service.priceCents / 100), duration: String(service.durationMinutes) });
            setEdit(false);
          }}>Cancel</button>
        </>
      ) : (
        <>
          <div>
            <b>{service.name}</b>
            <small>
              {service.description || `${service.durationMinutes} min`} · $
              {(service.priceCents / 100).toFixed(0)}
              {!service.active && " · Hidden"}
            </small>
          </div>
          <div className="card-actions">
            <button onClick={() => setEdit(true)}>Edit</button>
            <button
              onClick={() => {
                const previous = previewServices;
                onPreview(previous.map((item) => item.id === service.id ? { ...item, active: !service.active } : item));
                run(service.active ? "Service hidden." : "Service shown.", async () => {
                  try {
                    const updated = await requireAction(updateServiceAction(service.id, { active: !service.active }));
                    onPreview(previous.map((item) => item.id === service.id ? updated : item));
                  } catch (error) { onPreview(previous); throw error; }
                });
              }}
            >
              {service.active ? "Hide" : "Show"}
            </button>
            <button
              aria-label={`Delete ${service.name}`}
              onClick={() => {
                const previous = previewServices;
                onPreview(previous.filter((item) => item.id !== service.id));
                run("Service deleted.", async () => {
                  try { await requireAction(deleteServiceAction(service.id)); }
                  catch (error) { onPreview(previous); throw error; }
                });
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </>
      )}
      {!edit && <>
        <button className="service-results-toggle" type="button" aria-expanded={showResults} onClick={() => setShowResults((open) => !open)}>
          <span><ImagePlus size={16} /> Before &amp; after</span>
          <small>{portfolioItems.length ? `${portfolioItems.length} ${portfolioItems.length === 1 ? "result" : "results"}` : "Add photos"}</small>
          <ChevronDown className={showResults ? "open" : ""} size={16} />
        </button>
        {showResults && <ServicePortfolioEditor service={service} portfolioItems={portfolioItems} busy={busy} run={run} previewPortfolio={previewPortfolio} onPreview={onPreviewPortfolio} />}
      </>}
    </article>
  );
}

function ServicePortfolioEditor({
  service,
  portfolioItems,
  busy,
  run,
  previewPortfolio,
  onPreview,
}: {
  service: Service;
  portfolioItems: PartnerSiteState["portfolio"];
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
  previewPortfolio: PartnerSiteState["portfolio"];
  onPreview: (portfolio: PartnerSiteState["portfolio"]) => void;
}) {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [caption, setCaption] = useState("");
  const [customCaption, setCustomCaption] = useState(false);
  const draftId = useRef(crypto.randomUUID());
  const draftRef = useRef({ before: "", after: "", caption: "" });
  const portfolioRef = useRef(previewPortfolio);
  const temporaryUrls = useRef(new Set<string>());
  portfolioRef.current = previewPortfolio;
  useEffect(() => () => { temporaryUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);
  const updateDraft = (update: Partial<typeof draftRef.current>) => {
    const next = { ...draftRef.current, ...update };
    draftRef.current = next;
    setBefore(next.before);
    setAfter(next.after);
    setCaption(next.caption);
    const remaining = portfolioRef.current.filter((item) => item.id !== draftId.current);
    const portfolio = next.before && next.after ? [...remaining, {
      id: draftId.current,
      serviceId: service.id,
      beforeImageUrl: next.before,
      afterImageUrl: next.after,
      caption: next.caption,
      sortOrder: remaining.filter((item) => item.serviceId === service.id).length,
    }] : remaining;
    portfolioRef.current = portfolio;
    onPreview(portfolio);
  };
  const select = (file: File, purpose: "before" | "after") => {
    const temporaryUrl = URL.createObjectURL(file);
    temporaryUrls.current.add(temporaryUrl);
    updateDraft({ [purpose]: temporaryUrl });
    run("Image uploaded.", async () => {
      const image = await uploadPartnerMedia(file, purpose);
      updateDraft({ [purpose]: image.url });
      URL.revokeObjectURL(temporaryUrl);
      temporaryUrls.current.delete(temporaryUrl);
    });
  };
  return (
    <div className="manage-list service-portfolio-editor">
      <div className="gallery-drop-row">
        <label className="upload-box">
          {before ? (
            <img src={before} alt="Before upload" />
          ) : (
            <>
              <Upload size={22} />
              <span>Upload before</span>
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) =>
              event.target.files?.[0] && select(event.target.files[0], "before")
            }
          />
        </label>
        <label className="upload-box">
          {after ? (
            <img src={after} alt="After upload" />
          ) : (
            <>
              <Upload size={22} />
              <span>Upload after</span>
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) =>
              event.target.files?.[0] && select(event.target.files[0], "after")
            }
          />
        </label>
      </div>
      <fieldset><legend>What space is this?</legend><div className="choice-row profile-choice-row">{["Kitchen", "Bathroom", "Bedroom", "Office", "Car"].map((space) => <button type="button" key={space} className={caption === `${space} clean` ? "selected" : ""} onClick={() => { setCustomCaption(false); updateDraft({ caption: `${space} clean` }); }}>{space}</button>)}<button type="button" className={customCaption ? "selected" : ""} onClick={() => setCustomCaption(true)}>Other</button></div></fieldset>
      {customCaption && <input placeholder="Short caption (optional)" value={caption} onChange={(event) => updateDraft({ caption: event.target.value })} />}
      <button
        className="button"
        disabled={busy || !before || !after}
        onClick={() =>
          run("Before & after added.", async () => {
            const item = await requireAction(createPortfolioItemAction({
              serviceId: service.id,
              beforeImageUrl: before,
              afterImageUrl: after,
              caption,
            }));
            onPreview([...portfolioRef.current.filter((entry) => entry.id !== draftId.current), item]);
            draftId.current = crypto.randomUUID();
            draftRef.current = { before: "", after: "", caption: "" };
            setBefore(""); setAfter(""); setCaption("");
          })
        }
      >
        <Plus size={16} /> Add before & after
      </button>
      {portfolioItems.map((item) => (
        <article className="portfolio-row" key={item.id}>
          <img src={item.beforeImageUrl} alt="Before" />
          <img src={item.afterImageUrl} alt="After" />
          <span>{item.caption}</span>
          <button
            aria-label="Delete portfolio item"
            onClick={() => {
              const previous = portfolioRef.current;
              onPreview(previous.filter((entry) => entry.id !== item.id));
              run("Portfolio item deleted.", async () => {
                try { await requireAction(deletePortfolioItemAction(item.id)); }
                catch (error) { onPreview(previous); throw error; }
              });
            }}
          >
            <Trash2 size={15} />
          </button>
        </article>
      ))}
    </div>
  );
}

function ReviewsEditor({
  overview,
  busy,
  run,
  previewReviews,
  onPreview,
}: {
  overview: Overview;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
  previewReviews: PartnerSiteState["reviews"];
  onPreview: (reviews: PartnerSiteState["reviews"]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const draftId = useRef(crypto.randomUUID());
  const [draft, setDraft] = useState({ author: "", rating: 5, text: "" });
  const updateDraft = (next: typeof draft) => {
    setDraft(next);
    const remaining = previewReviews.filter((review) => review.id !== draftId.current);
    onPreview(next.author.trim() && next.text.trim() ? [...remaining, {
      id: draftId.current,
      author: next.author,
      rating: next.rating,
      text: next.text,
      source: "manual",
      featured: remaining.length === 0,
    }] : remaining);
  };
  return (
    <div className="manage-list">
      {overview.reviews.map((review) => (
        <article className="manage-card" key={review.id}>
          <div>
            <b>
              {review.author} · {"★".repeat(review.rating)}
            </b>
            <small>{review.text}</small>
          </div>
          <button
            aria-label={`Delete review by ${review.author}`}
            onClick={() => {
              const previous = previewReviews;
              onPreview(previous.filter((item) => item.id !== review.id));
              run("Review deleted.", async () => {
                try { await requireAction(deleteReviewAction(review.id)); }
                catch (error) { onPreview(previous); throw error; }
              });
            }}
          >
            <Trash2 size={15} />
          </button>
        </article>
      ))}
      {adding ? (
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            run("Review added.", async () => {
              const review = await requireAction(createReviewAction({
                author: draft.author,
                rating: draft.rating,
                text: draft.text,
                source: "manual",
                featured: overview.reviews.length === 0,
              }));
              onPreview([...previewReviews.filter((item) => item.id !== draftId.current), review]);
              draftId.current = crypto.randomUUID();
              setDraft({ author: "", rating: 5, text: "" });
              setAdding(false);
            });
          }}
        >
          <input name="author" placeholder="Customer name" required value={draft.author} onChange={(event) => updateDraft({ ...draft, author: event.target.value })} />
          <select name="rating" value={draft.rating} onChange={(event) => updateDraft({ ...draft, rating: Number(event.target.value) })}>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
          </select>
          <textarea
            name="text"
            placeholder="What did they say?"
            required
            rows={3}
            value={draft.text}
            onChange={(event) => updateDraft({ ...draft, text: event.target.value })}
          />
          <button className="button small" disabled={busy}>
            Add review
          </button>
          <button className="button secondary small" type="button" onClick={() => {
            onPreview(previewReviews.filter((review) => review.id !== draftId.current));
            setAdding(false);
          }}>Cancel</button>
        </form>
      ) : (
        <button className="text-action" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add review
        </button>
      )}
    </div>
  );
}

function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="editor-form-section">
      <div className="editor-form-section-heading">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}

function BookingEditor({ overview, run, onPreview }: {
  overview: Overview;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
  onPreview: (update: PreviewUpdate) => void;
}) {
  const [availability, setAvailability] = useState(overview.availability);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const saveAvailability = (next: PublicSite["availability"]) => {
    setAvailability(next);
    onPreview({ availability: next });
    run("Hours saved.", () => requireAction(updateAvailabilityAction(next)));
  };
  const presets = [
    { label: "Weekdays 9–5", weekdays: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "17:00" },
    { label: "Mon–Sat 9–6", weekdays: [1, 2, 3, 4, 5, 6], startTime: "09:00", endTime: "18:00" },
    { label: "Every day", weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: "09:00", endTime: "17:00" },
  ];
  return <div className="editor-form">
    <EditorSection title="Hours" description="Choose a schedule. Customers only see available booking times.">
      <div className="choice-row profile-choice-row">{presets.map((preset) => <button type="button" key={preset.label} onClick={() => saveAvailability({ ...availability, weekdays: preset.weekdays, startTime: preset.startTime, endTime: preset.endTime })}>{preset.label}</button>)}</div>
      <fieldset><legend>Days available</legend><div className="day-picker">{dayLabels.map((label, day) => <button key={label} type="button" aria-pressed={availability.weekdays.includes(day)} className={availability.weekdays.includes(day) ? "selected" : ""} onClick={() => {
        const weekdays = availability.weekdays.includes(day) ? availability.weekdays.filter((item) => item !== day) : [...availability.weekdays, day].sort();
        if (weekdays.length) saveAvailability({ ...availability, weekdays });
      }}>{label}</button>)}</div></fieldset>
      <div className="form-grid time-range-fields"><label>Start time<input type="time" value={availability.startTime} onChange={(event) => saveAvailability({ ...availability, startTime: event.target.value })} /></label><label>End time<input type="time" value={availability.endTime} onChange={(event) => saveAvailability({ ...availability, endTime: event.target.value })} /></label></div>
    </EditorSection>
    <EditorSection title="Booking" description="Your page is ready to accept booking requests."><div className="booking-default-card"><b>Online booking is on</b><span>Customers choose a service and an available time.</span></div></EditorSection>
    <EditorSection title="Payment" description="Customers arrange payment with you after booking."><div className="booking-default-card"><b>Pay after service</b><span>No online payment is collected.</span></div></EditorSection>
  </div>;
}
