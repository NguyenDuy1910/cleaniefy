"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ImagePlus,
  LoaderCircle,
  Monitor,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { updatePartnerProfileAction, updateSectionsAction, updateThemeAction, publishPartnerAction } from "@/features/partner/actions";
import { createServiceAction, deleteServiceAction, updateServiceAction } from "@/features/services/actions";
import { createPortfolioItemAction, deletePortfolioItemAction } from "@/features/portfolio/actions";
import { createReviewAction, deleteReviewAction } from "@/features/reviews/actions";
import { updateAvailabilityAction, updateBookingConfigAction } from "@/features/booking/actions";
import { uploadPartnerMedia } from "@/lib/blob/client";
import type { ActionResult } from "@/lib/utils/actions";
import { TEMPLATE_CATALOG, getTemplateDefinition } from "@/templates/catalog";
import type {
  BookingConfig,
  Overview,
  PublicSite,
  Service,
  TemplateKey,
  ThemeConfig,
} from "@/lib/types";
import { DashboardFrame } from "./dashboard-home";
import { PreviewFrame } from "@/components/preview/preview-frame";
import { toPartnerSiteState } from "@/components/preview/preview-messages";
import type { PartnerSiteState } from "@/features/partner/types";

type Tab =
  | "brand"
  | "theme"
  | "content"
  | "services"
  | "gallery"
  | "reviews"
  | "booking";
const tabs: [Tab, string][] = [
  ["brand", "Brand"],
  ["theme", "Theme"],
  ["content", "Content"],
  ["services", "Services"],
  ["gallery", "Gallery"],
  ["reviews", "Reviews"],
  ["booking", "Booking"],
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
  slug: "brand",
  service: "services",
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
    const requested = new URLSearchParams(location.search).get(
      "tab",
    ) as Tab | null;
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
    <DashboardFrame active="editor" partnerSlug={overview.partner.slug} wide>
      <div className="page-editor">
      <header className="editor-header">
        <div>
          <h1>Edit your page</h1>
          <p>Customize what customers see.</p>
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
      <nav className="editor-tabs" aria-label="Page editor" role="tablist">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              aria-controls="editor-panel"
              aria-selected={tab === value}
              className={tab === value ? "active" : ""}
              onClick={() => setTab(value)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
      </nav>
      <div className="editor-workspace">
        <section className={`editor-panel ${busy ? "is-saving" : ""}`} aria-busy={busy} id="editor-panel" role="tabpanel">
          <div className="editor-panel-header">
            <h2>{tabs.find(([value]) => value === tab)?.[1]}</h2>
            <p>
              {tab === "brand"
                ? "The identity customers recognize."
                : tab === "theme"
                  ? "Choose a focused visual direction."
                  : tab === "content"
                    ? "Cleanie keeps the conversion order intact."
                    : tab === "booking"
                      ? "Control how customers request a clean."
                      : "Keep the essentials current."}
            </p>
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
          <div hidden={tab !== "brand"}>
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
          <div hidden={tab !== "theme"}>
            <ThemeEditor
              overview={overview}
              busy={busy}
              onPreview={(site) => updatePreview({ site })}
              onSave={(value) => run("Theme saved.", () => requireAction(updateThemeAction(value)))}
            />
          </div>
          <div hidden={tab !== "content"}>
            <ContentEditor
              overview={overview}
              busy={busy}
              onPreview={(sections) => updatePreview({ site: { sections } })}
              onSave={(sections) =>
                run("Section visibility saved.", () => requireAction(updateSectionsAction(sections)))
              }
            />
          </div>
          <div hidden={tab !== "services"}>
            <ServicesEditor overview={overview} busy={busy} run={run} previewServices={preview.services} onPreview={(services) => updatePreview({ services })} />
          </div>
          <div hidden={tab !== "gallery"}>
            <GalleryEditor overview={overview} busy={busy} run={run} previewPortfolio={preview.portfolio} onPreview={(portfolio) => updatePreview({ portfolio })} />
          </div>
          <div hidden={tab !== "reviews"}>
            <ReviewsEditor overview={overview} busy={busy} run={run} previewReviews={preview.reviews} onPreview={(reviews) => updatePreview({ reviews })} />
          </div>
          <div hidden={tab !== "booking"}>
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

function BrandEditor({
  overview,
  busy,
  onSave,
  onUpload,
  onPreview,
}: {
  overview: Overview;
  busy: boolean;
  onSave: (value: Record<string, string>) => void;
  onUpload: (file: File, purpose: "profile" | "hero") => void;
  onPreview: (value: Partial<PublicSite["partner"]>) => void;
}) {
  const [slugState, setSlugState] = useState(overview.partner.slug);
  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSave({
          businessName: String(form.get("businessName")),
          tagline: String(form.get("tagline")),
          serviceArea: String(form.get("serviceArea")),
          about: String(form.get("about")),
          slug: slugState,
        });
      }}
    >
      <div className="image-upload-row">
        <label className="image-upload">
          {overview.partner.profileImageUrl ? (
            <img src={overview.partner.profileImageUrl} alt="Current profile" />
          ) : (
            <Upload size={21} />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) =>
              event.target.files?.[0] &&
              onUpload(event.target.files[0], "profile")
            }
          />
          <span>Profile photo</span>
        </label>
        <label className="image-upload wide">
          {overview.partner.heroImageUrl ? (
            <img src={overview.partner.heroImageUrl} alt="Current hero" />
          ) : (
            <ImagePlus size={21} />
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) =>
              event.target.files?.[0] && onUpload(event.target.files[0], "hero")
            }
          />
          <span>Hero image</span>
        </label>
      </div>
      <label>
        Business name
        <input
          name="businessName"
          defaultValue={overview.partner.businessName}
          onChange={(event) => onPreview({ businessName: event.target.value })}
          required
        />
      </label>
      <label>
        Your Cleanie link
        <div className="slug-input">
          <span>cleanie.app/</span>
          <input
            value={slugState}
            onChange={(event) => {
              const slug = event.target.value
                .toLowerCase()
                .replace(/\s+/g, "-");
              setSlugState(slug);
              onPreview({ slug });
            }}
            required
          />
        </div>
      </label>
      <label>
        Tagline
        <input
          name="tagline"
          defaultValue={overview.partner.tagline}
          onChange={(event) => onPreview({ tagline: event.target.value })}
          required
        />
      </label>
      <label>
        Service area
        <input
          name="serviceArea"
          defaultValue={overview.partner.serviceArea}
          onChange={(event) => onPreview({ serviceArea: event.target.value })}
          required
        />
      </label>
      <label>
        About your business
        <textarea
          name="about"
          rows={4}
          defaultValue={overview.partner.about || ""}
          placeholder="A short, welcoming introduction."
          onChange={(event) => onPreview({ about: event.target.value })}
        />
      </label>
      <button className="button" disabled={busy}>
        <Save size={16} /> Save brand
      </button>
    </form>
  );
}

function ThemeEditor({
  overview,
  busy,
  onSave,
  onPreview,
}: {
  overview: Overview;
  busy: boolean;
  onSave: (value: { template?: TemplateKey; theme?: ThemeConfig }) => void;
  onPreview: (value: PreviewUpdate["site"]) => void;
}) {
  const [theme, setTheme] = useState<ThemeConfig>(overview.site.theme);
  const [template, setTemplate] = useState<TemplateKey>(overview.site.template);
  const selectTemplate = (value: TemplateKey) => {
    const nextTheme = { ...getTemplateDefinition(value).theme };
    setTemplate(value);
    setTheme(nextTheme);
    onPreview({ template: value, theme: nextTheme });
  };
  const updateThemePreview = (update: Partial<ThemeConfig>) => {
    const nextTheme = { ...theme, ...update };
    setTheme(nextTheme);
    onPreview({ template, theme: nextTheme });
  };
  return (
    <form
      className="editor-form booking-editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ template, theme });
      }}
    >
      <fieldset>
        <legend>Template</legend>
        <div className="choice-row template-choice-row">
          {TEMPLATE_CATALOG.map((item) => (
            <button
              type="button"
              className={template === item.key ? "selected" : ""}
              key={item.key}
              onClick={() => selectTemplate(item.key)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Brand color</legend>
        <div className="color-row">
          {colors.map((color) => (
            <button
              type="button"
              className={theme.primaryColor === color ? "selected" : ""}
              key={color}
              style={{ backgroundColor: color }}
              onClick={() => updateThemePreview({ primaryColor: color })}
            >
              <span className="sr-only">Use {color}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Typography</legend>
        <div className="choice-row">
          <button
            type="button"
            className={theme.fontPreset === "modern" ? "selected" : ""}
            onClick={() => updateThemePreview({ fontPreset: "modern" })}
          >
            Modern
          </button>
          <button
            type="button"
            className={theme.fontPreset === "soft" ? "selected" : ""}
            onClick={() => updateThemePreview({ fontPreset: "soft" })}
          >
            Soft
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend>Button shape</legend>
        <div className="choice-row">
          <button
            type="button"
            className={theme.buttonStyle === "soft" ? "selected" : ""}
            onClick={() => updateThemePreview({ buttonStyle: "soft" })}
          >
            Soft
          </button>
          <button
            type="button"
            className={theme.buttonStyle === "pill" ? "selected" : ""}
            onClick={() => updateThemePreview({ buttonStyle: "pill" })}
          >
            Pill
          </button>
        </div>
      </fieldset>
      <button className="button" disabled={busy}>
        <Save size={16} /> Save theme
      </button>
    </form>
  );
}

function ContentEditor({
  overview,
  busy,
  onSave,
  onPreview,
}: {
  overview: Overview;
  busy: boolean;
  onSave: (value: Overview["site"]["sections"]) => void;
  onPreview: (value: Overview["site"]["sections"]) => void;
}) {
  const [sections, setSections] = useState(overview.site.sections);
  const labels: [keyof typeof sections, string, string][] = [
    ["services", "Services", "What customers can book"],
    ["portfolio", "Before & after", "Show your work"],
    ["reviews", "Google reviews", "Social proof from customers"],
    ["about", "About", "A short introduction"],
  ];
  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(sections);
      }}
    >
      <p className="editor-helper">
        Turn sections on or off. Their order stays optimized by Cleanie.
      </p>
      <div className="toggle-list">
        {labels.map(([key, title, description]) => (
          <label key={key}>
            <span>
              <b>{title}</b>
              <small>{description}</small>
            </span>
            <input
              type="checkbox"
              checked={sections[key]}
              onChange={() => {
                const nextSections = { ...sections, [key]: !sections[key] };
                setSections(nextSections);
                onPreview(nextSections);
              }}
            />
            <i />
          </label>
        ))}
      </div>
      <button className="button" disabled={busy}>
        <Save size={16} /> Save sections
      </button>
    </form>
  );
}

function ServicesEditor({
  overview,
  busy,
  run,
  previewServices,
  onPreview,
}: {
  overview: Overview;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
  previewServices: Service[];
  onPreview: (services: Service[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const draftServiceId = useRef("");
  const hasActiveService = overview.services.some((service) => service.active);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    priceCents: "",
    durationMinutes: "120",
  });
  const updateDraft = (next: typeof draft) => {
    setDraft(next);
    const remaining = previewServices.filter((item) => item.id !== draftServiceId.current);
    onPreview(next.name.trim() ? [...remaining, {
      id: draftServiceId.current,
      name: next.name,
      description: next.description,
      priceCents: Number(next.priceCents) * 100 || 0,
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
        durationMinutes: Number(draft.durationMinutes),
        active: true,
      }));
      onPreview([...previewServices.filter((item) => item.id !== draftServiceId.current), service]);
      setAdding(false);
      setDraft({
        name: "",
        description: "",
        priceCents: "",
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
        <ServiceRow service={service} key={service.id} busy={busy} run={run} previewServices={previewServices} onPreview={onPreview} />
      ))}
      {adding ? (
        <form className="inline-form" onSubmit={add}>
          <input
            placeholder="Service name"
            value={draft.name}
            required
            onChange={(event) =>
              updateDraft({ ...draft, name: event.target.value })
            }
          />
          <input
            placeholder="Description"
            value={draft.description}
            onChange={(event) =>
              updateDraft({ ...draft, description: event.target.value })
            }
          />
          <input
            type="number"
            min="0"
            placeholder="Price ($)"
            value={draft.priceCents}
            required
            onChange={(event) =>
              updateDraft({ ...draft, priceCents: event.target.value })
            }
          />
          <input
            type="number"
            min="15"
            step="15"
            placeholder="Minutes"
            value={draft.durationMinutes}
            required
            onChange={(event) =>
              updateDraft({ ...draft, durationMinutes: event.target.value })
            }
          />
          <button className="button small" disabled={busy}>
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
  onPreview,
}: {
  service: Service;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
  previewServices: Service[];
  onPreview: (services: Service[]) => void;
}) {
  const [edit, setEdit] = useState(false);
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
    <article className="manage-card">
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
    </article>
  );
}

function GalleryEditor({
  overview,
  busy,
  run,
  previewPortfolio,
  onPreview,
}: {
  overview: Overview;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
  previewPortfolio: PartnerSiteState["portfolio"];
  onPreview: (portfolio: PartnerSiteState["portfolio"]) => void;
}) {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [caption, setCaption] = useState("");
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
      beforeImageUrl: next.before,
      afterImageUrl: next.after,
      caption: next.caption,
      sortOrder: remaining.length,
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
    <div className="manage-list">
      <p className="editor-helper">
        Upload a real before and after pair. Both images are shown together on
        your page.
      </p>
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
      <input
        placeholder="Caption (optional)"
        value={caption}
        onChange={(event) => updateDraft({ caption: event.target.value })}
      />
      <button
        className="button"
        disabled={busy || !before || !after}
        onClick={() =>
          run("Before & after added.", async () => {
            const item = await requireAction(createPortfolioItemAction({
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
      {overview.portfolio.map((item) => (
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

function BookingEditor({
  overview,
  busy,
  run,
  onPreview,
}: {
  overview: Overview;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
  onPreview: (update: PreviewUpdate) => void;
}) {
  const [config, setConfig] = useState<BookingConfig>(overview.booking);
  const [availability, setAvailability] = useState(overview.availability);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const updateAvailabilityPreview = (
    nextAvailability: PublicSite["availability"],
  ) => {
    setAvailability(nextAvailability);
    onPreview({ availability: nextAvailability });
  };
  const updateBookingPreview = (nextConfig: BookingConfig) => {
    setConfig(nextConfig);
    onPreview({ booking: nextConfig });
  };
  const save = () =>
    run("Booking settings saved.", async () => {
      await requireAction(updateAvailabilityAction(availability));
      await requireAction(updateBookingConfigAction(config));
    });
  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <EditorSection title="Availability" description="Choose the days and hours customers can request.">
        <fieldset>
          <legend>Days available</legend>
          <div className="day-picker">
          {dayLabels.map((label, day) => (
            <button
              aria-pressed={availability.weekdays.includes(day)}
              type="button"
              className={availability.weekdays.includes(day) ? "selected" : ""}
              key={label}
              onClick={() => {
                const nextAvailability = {
                  ...availability,
                  weekdays: availability.weekdays.includes(day)
                    ? availability.weekdays.filter((item) => item !== day)
                    : [...availability.weekdays, day].sort(),
                };
                updateAvailabilityPreview(nextAvailability);
              }}
            >
              {label}
            </button>
          ))}
          </div>
        </fieldset>
        <div className="form-grid time-range-fields">
          <label>
            Start time
            <input
              type="time"
              value={availability.startTime}
              onChange={(event) =>
                updateAvailabilityPreview({
                  ...availability,
                  startTime: event.target.value,
                })
              }
            />
          </label>
          <label>
            End time
            <input
              type="time"
              value={availability.endTime}
              onChange={(event) =>
                updateAvailabilityPreview({
                  ...availability,
                  endTime: event.target.value,
                })
              }
            />
          </label>
        </div>
      </EditorSection>
      <EditorSection title="Booking CTA" description="This is the button customers use to start booking.">
        <label>
          Button label
          <input
            value={config.ctaLabel}
            onChange={(event) =>
              updateBookingPreview({ ...config, ctaLabel: event.target.value })
            }
          />
        </label>
      </EditorSection>
      <EditorSection title="Customer information" description="Choose what customers must provide with a booking.">
        <div className="toggle-list compact setting-toggle-list">
          {(["name", "phone", "email", "address", "notes"] as const).map(
            (field) => (
              <label key={field}>
                <span>
                  <b>{field[0].toUpperCase() + field.slice(1)}</b>
                </span>
                <input
                  disabled={field === "name"}
                  type="checkbox"
                  checked={config.requiredFields[field]}
                  onChange={() =>
                    updateBookingPreview({
                      ...config,
                      requiredFields: {
                        ...config.requiredFields,
                        [field]: !config.requiredFields[field],
                      },
                    })
                  }
                />
                <i />
              </label>
            ),
          )}
        </div>
      </EditorSection>
      <EditorSection title="Payment" description="Online payment is not enabled for this page.">
        <label className="radio-option">
          <input
            type="radio"
            checked={config.paymentMode === "none"}
            onChange={() =>
              updateBookingPreview({ ...config, paymentMode: "none" })
            }
          />{" "}
          No online payment
        </label>
        <label className="radio-option muted">
          <input type="radio" disabled /> Deposit (coming later)
        </label>
        <label className="radio-option muted">
          <input type="radio" disabled /> Full payment (coming later)
        </label>
      </EditorSection>
      <EditorSection title="Confirmation" description="Shown after a customer sends a booking request.">
        <label>
          Confirmation message
          <textarea
            rows={3}
            value={config.confirmationMessage}
            onChange={(event) =>
              updateBookingPreview({
                ...config,
                confirmationMessage: event.target.value,
              })
            }
          />
        </label>
      </EditorSection>
      <button className="button" disabled={busy}>
        <Save size={16} /> Save booking settings
      </button>
    </form>
  );
}
