"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ImagePlus,
  Monitor,
  Plus,
  Save,
  Smartphone,
  Tablet,
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
import { SiteRenderer } from "@/templates/renderer";
import { DashboardFrame } from "./dashboard-home";

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

const editorPreview = (overview: Overview): PublicSite => ({
  ...overview,
  metrics: {
    rating: overview.metrics.rating,
    reviewCount: overview.reviews.length,
    completedJobs: overview.metrics.bookingCount,
    views: overview.metrics.views,
  },
});
type PreviewUpdate = {
  partner?: Partial<PublicSite["partner"]>;
  site?: Partial<PublicSite["site"]>;
  availability?: PublicSite["availability"];
  booking?: PublicSite["booking"];
};
type PreviewDevice = "desktop" | "tablet" | "mobile";
const previewDevices: { key: PreviewDevice; label: string; Icon: typeof Monitor }[] = [
  { key: "desktop", label: "Desktop", Icon: Monitor },
  { key: "tablet", label: "Tablet", Icon: Tablet },
  { key: "mobile", label: "Mobile", Icon: Smartphone },
];
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
  const [preview, setPreview] = useState<PublicSite>(editorPreview(initialOverview));
  const [previewVersion, setPreviewVersion] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [tab, setTab] = useState<Tab>("brand");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setOverview(initialOverview);
    setPreview(editorPreview(initialOverview));
  }, [initialOverview]);
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
        },
    );
    setPreviewVersion((version) => version + 1);
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
    <DashboardFrame active="editor" partnerSlug={overview.partner.slug}>
      <div className="editor-top">
        <div>
          <h1>Edit your page</h1>
          <p>Keep it simple. Change what customers notice.</p>
        </div>
        <div className="editor-top-actions">
          <a
            className="button secondary small"
            href={`/${overview.partner.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            View page
          </a>
          <button
            className="button small"
            onClick={publish}
            disabled={busy}
          >
            {overview.partner.status === "published"
              ? "Published"
              : readiness.ready
                ? "Publish"
                : "Finish setup"}
          </button>
        </div>
      </div>
      <div className="editor-layout">
        <nav className="editor-nav" aria-label="Page editor">
          {tabs.map(([value, label]) => (
            <button
              key={value}
              className={tab === value ? "active" : ""}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </nav>
        <section className="editor-panel">
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
          {tab === "brand" && (
            <BrandEditor
              overview={overview}
              busy={busy}
              onPreview={(partner) => updatePreview({ partner })}
              onSave={(data) =>
                run("Brand saved.", () => requireAction(updatePartnerProfileAction(data)))
              }
              onUpload={(file, purpose) => {
                updatePreview({
                  partner:
                    purpose === "profile"
                      ? { profileImageUrl: URL.createObjectURL(file) }
                      : { heroImageUrl: URL.createObjectURL(file) },
                });
                run("Image uploaded.", async () => {
                  const result = await uploadPartnerMedia(file, purpose);
                  await requireAction(updatePartnerProfileAction(
                    purpose === "profile"
                      ? { profileImageUrl: result.url }
                      : { heroImageUrl: result.url },
                  ));
                });
              }}
            />
          )}{" "}
          {tab === "theme" && (
            <ThemeEditor
              overview={overview}
              busy={busy}
              onPreview={(site) => updatePreview({ site })}
              onSave={(value) => run("Theme saved.", () => requireAction(updateThemeAction(value)))}
            />
          )}{" "}
          {tab === "content" && (
            <ContentEditor
              overview={overview}
              busy={busy}
              onPreview={(sections) => updatePreview({ site: { sections } })}
              onSave={(sections) =>
                run("Section visibility saved.", () => requireAction(updateSectionsAction(sections)))
              }
            />
          )}{" "}
          {tab === "services" && (
            <ServicesEditor overview={overview} busy={busy} run={run} />
          )}{" "}
          {tab === "gallery" && (
            <GalleryEditor overview={overview} busy={busy} run={run} />
          )}{" "}
          {tab === "reviews" && (
            <ReviewsEditor overview={overview} busy={busy} run={run} />
          )}{" "}
          {tab === "booking" && (
            <BookingEditor
              overview={overview}
              busy={busy}
              run={run}
              onPreview={updatePreview}
            />
          )}
        </section>
        <aside className="editor-preview">
          <div className="preview-heading">
            <span>LIVE PREVIEW</span>
            <div className="preview-devices" aria-label="Preview device">
              {previewDevices.map(({ key, label, Icon }) => (
                <button
                  aria-label={`${label} preview`}
                  aria-pressed={previewDevice === key}
                  className={previewDevice === key ? "active" : ""}
                  key={key}
                  onClick={() => setPreviewDevice(key)}
                  title={label}
                  type="button"
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
          <div className={`preview-stage ${previewDevice}`}>
            <div className={`preview-viewport ${previewDevice}`} key={`${previewDevice}-${previewVersion}`}>
              <SiteRenderer site={preview} interactive={false} />
            </div>
          </div>
        </aside>
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
      className="editor-form"
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
}: {
  overview: Overview;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
}) {
  const [adding, setAdding] = useState(false);
  const hasActiveService = overview.services.some((service) => service.active);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    priceCents: "",
    durationMinutes: "120",
  });
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    run("Service added.", async () => {
      await requireAction(createServiceAction({
        name: draft.name,
        description: draft.description,
        priceCents: Number(draft.priceCents) * 100,
        durationMinutes: Number(draft.durationMinutes),
        active: true,
      }));
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
            <button className="button small" onClick={() => setAdding(true)} type="button">
              <Plus size={15} /> Add service
            </button>
          )}
        </section>
      )}
      {overview.services.map((service) => (
        <ServiceRow service={service} key={service.id} busy={busy} run={run} />
      ))}
      {adding ? (
        <form className="inline-form" onSubmit={add}>
          <input
            placeholder="Service name"
            value={draft.name}
            required
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
          />
          <input
            placeholder="Description"
            value={draft.description}
            onChange={(event) =>
              setDraft({ ...draft, description: event.target.value })
            }
          />
          <input
            type="number"
            min="0"
            placeholder="Price ($)"
            value={draft.priceCents}
            required
            onChange={(event) =>
              setDraft({ ...draft, priceCents: event.target.value })
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
              setDraft({ ...draft, durationMinutes: event.target.value })
            }
          />
          <button className="button small" disabled={busy}>
            Add service
          </button>
        </form>
      ) : (
        <button className="text-action" onClick={() => setAdding(true)}>
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
}: {
  service: Service;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
}) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({
    name: service.name,
    description: service.description,
    price: String(service.priceCents / 100),
    duration: String(service.durationMinutes),
  });
  return (
    <article className="manage-card">
      {edit ? (
        <>
          <input
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
          />
          <input
            value={draft.description}
            onChange={(event) =>
              setDraft({ ...draft, description: event.target.value })
            }
          />
          <div className="compact-fields">
            <input
              type="number"
              value={draft.price}
              onChange={(event) =>
                setDraft({ ...draft, price: event.target.value })
              }
            />
            <input
              type="number"
              value={draft.duration}
              onChange={(event) =>
                setDraft({ ...draft, duration: event.target.value })
              }
            />
          </div>
          <button
            className="button small"
            disabled={busy}
            onClick={() =>
              run("Service saved.", async () => {
                await requireAction(updateServiceAction(service.id, {
                  name: draft.name,
                  description: draft.description,
                  priceCents: Number(draft.price) * 100,
                  durationMinutes: Number(draft.duration),
                }));
                setEdit(false);
              })
            }
          >
            Save
          </button>
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
              onClick={() =>
                run(service.active ? "Service hidden." : "Service shown.", () =>
                  requireAction(updateServiceAction(service.id, { active: !service.active })),
                )
              }
            >
              {service.active ? "Hide" : "Show"}
            </button>
            <button
              aria-label={`Delete ${service.name}`}
              onClick={() =>
                run("Service deleted.", () => requireAction(deleteServiceAction(service.id)))
              }
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
}: {
  overview: Overview;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
}) {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [caption, setCaption] = useState("");
  const select = (file: File, purpose: "before" | "after") =>
    run("Image uploaded.", async () => {
      const image = await uploadPartnerMedia(file, purpose);
      purpose === "before" ? setBefore(image.url) : setAfter(image.url);
    });
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
        onChange={(event) => setCaption(event.target.value)}
      />
      <button
        className="button"
        disabled={busy || !before || !after}
        onClick={() =>
          run("Before & after added.", async () => {
            await requireAction(createPortfolioItemAction({
              beforeImageUrl: before,
              afterImageUrl: after,
              caption,
            }));
            setBefore("");
            setAfter("");
            setCaption("");
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
            onClick={() =>
              run("Portfolio item deleted.", () => requireAction(deletePortfolioItemAction(item.id)))
            }
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
}: {
  overview: Overview;
  busy: boolean;
  run: (message: string, action: () => Promise<unknown>) => void;
}) {
  const [adding, setAdding] = useState(false);
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
            onClick={() =>
              run("Review deleted.", () => requireAction(deleteReviewAction(review.id)))
            }
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
            const form = new FormData(event.currentTarget);
            run("Review added.", async () => {
              await requireAction(createReviewAction({
                author: String(form.get("author")),
                rating: Number(form.get("rating")),
                text: String(form.get("text")),
                source: "manual",
                featured: overview.reviews.length === 0,
              }));
              setAdding(false);
            });
          }}
        >
          <input name="author" placeholder="Customer name" required />
          <select name="rating" defaultValue="5">
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
          </select>
          <textarea
            name="text"
            placeholder="What did they say?"
            required
            rows={3}
          />
          <button className="button small" disabled={busy}>
            Add review
          </button>
        </form>
      ) : (
        <button className="text-action" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add review
        </button>
      )}
    </div>
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
      <fieldset>
        <legend>Days available</legend>
        <div className="day-picker">
          {dayLabels.map((label, day) => (
            <button
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
      <div className="form-grid">
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
      <label>
        Booking CTA
        <input
          value={config.ctaLabel}
          onChange={(event) =>
            updateBookingPreview({ ...config, ctaLabel: event.target.value })
          }
        />
      </label>
      <fieldset>
        <legend>Customer details</legend>
        <div className="toggle-list compact">
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
      </fieldset>
      <fieldset>
        <legend>Payment</legend>
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
      </fieldset>
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
      <button className="button" disabled={busy}>
        <Save size={16} /> Save booking settings
      </button>
    </form>
  );
}
