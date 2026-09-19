"use client";

import { useEffect, useMemo, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { ArrowLeft, CalendarPlus, Check, CheckCircle2, ChevronDown, ChevronRight, LoaderCircle, LockKeyhole, MapPin, StickyNote, UserRound, X } from "lucide-react";
import { PublicApiError } from "@/features/booking/client";
import { formatBookingDate, formatBookingTime } from "@/features/booking/format";
import { siteActions, type SiteRuntimeMode } from "@/features/booking/site-actions";
import type { Booking, PartnerSiteState } from "@/lib/types";
import { BookingDatePicker } from "./booking-date-picker";

type Step = "time" | "details" | "review" | "complete";
type CustomerDetails = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  notes: string;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const blankDetails: CustomerDetails = { customerName: "", customerPhone: "", customerEmail: "", customerAddress: "", notes: "" };
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
const servicePrice = (service: { priceCents: number; priceMode: "fixed" | "from" }) => `${service.priceMode === "from" ? "From " : ""}${money(service.priceCents)}`;
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const formatWhen = formatBookingDate;
const formatTime = formatBookingTime;
const duration = (minutes: number) => minutes < 60 ? `${minutes} min` : minutes % 60 === 0 ? `${minutes / 60} hr` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
const calendarStamp = (value: string | Date) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function calendarUrl(title: string, start: string, end: string, location?: string) {
  const query = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${calendarStamp(start)}/${calendarStamp(end)}` });
  if (location) query.set("location", location);
  return `https://calendar.google.com/calendar/render?${query}`;
}

function track(name: string, detail: Record<string, string | number | undefined> = {}) {
  window.dispatchEvent(new CustomEvent("cleanie:booking", { detail: { name, ...detail } }));
}

export function BookingFlow({
  site,
  initialServiceId,
  onExit,
  onServiceChange,
  interactive = true,
  mode = "published",
}: {
  site: PartnerSiteState;
  initialServiceId: string;
  onExit: () => void;
  onServiceChange: (serviceId: string) => void;
  interactive?: boolean;
  mode?: SiteRuntimeMode;
}) {
  const services = site.services.filter((item) => item.active);
  const weekdays = site.availability.weekdays.join(",");
  const availableDates = useMemo(() => {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
    return Array.from({ length: 28 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + index);
      return date;
    }).filter((date) => weekdays.split(",").includes(String(date.getUTCDay()))).slice(0, 3);
  }, [weekdays]);
  const [step, setStep] = useState<Step>("time");
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const service = services.find((item) => item.id === selectedServiceId) ?? services[0] ?? null;
  const [selectedDate, setSelectedDate] = useState(availableDates[0] ? dateKey(availableDates[0]) : "");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [details, setDetails] = useState<CustomerDetails>(blankDetails);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});
  const [showServiceChoices, setShowServiceChoices] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [slotNotice, setSlotNotice] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);

  const availabilitySite = useMemo(() => site, [site.partner.slug, site.availability, site.services]);
  useEffect(() => { track("booking_checkout_viewed", { partner: site.partner.slug }); }, [site.partner.slug]);
  useEffect(() => { window.scrollTo(0, 0); }, [step]);
  useEffect(() => {
    if (!interactive || !selectedDate || !service) return;
    const controller = new AbortController();
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot("");
    setStep("time");
    setError("");
    siteActions(mode).getAvailability(availabilitySite, selectedDate, service, controller.signal)
      .then(setSlots)
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) setError("We couldn’t load times. Try again.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingSlots(false); });
    return () => controller.abort();
  }, [interactive, mode, selectedDate, service, availabilitySite, availabilityRetry]);

  const selectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    onServiceChange(serviceId);
    setShowServiceChoices(false);
    setSelectedSlot("");
    setError("");
    setSlotNotice("");
    track("booking_service_selected", { partner: site.partner.slug, service: serviceId });
  };
  const selectDate = (date: string) => { setSelectedDate(date); setSelectedSlot(""); setError(""); setSlotNotice(""); };
  const selectSlot = (slot: string) => { setSelectedSlot(slot); setError(""); setSlotNotice(""); track("booking_slot_selected", { partner: site.partner.slug }); };
  const continueToDetails = () => { if (!selectedSlot) { setError("Choose a time to continue."); return; } setStep("details"); };
  const goBack = () => {
    setError("");
    if (step === "time") onExit();
    else setStep(step === "review" ? "details" : "time");
  };
  const validateDetails = () => {
    const next: Partial<Record<keyof CustomerDetails, string>> = {};
    if (details.customerName.trim().length < 2) next.customerName = "Enter your name.";
    if (site.booking.requiredFields.address && !details.customerAddress.trim()) next.customerAddress = "Enter the service address.";
    if (site.booking.requiredFields.phone && !details.customerPhone.trim()) next.customerPhone = "Enter a phone number.";
    if (site.booking.requiredFields.email && !details.customerEmail.trim()) next.customerEmail = "Enter an email address.";
    else if (details.customerEmail && !/^\S+@\S+\.\S+$/.test(details.customerEmail)) next.customerEmail = "Enter a valid email address.";
    if (site.booking.requiredFields.notes && !details.notes.trim()) next.notes = "Add a short note.";
    setFieldErrors(next);
    const firstInvalid = (["customerAddress", "customerName", "customerPhone", "customerEmail", "notes"] as const).find((field) => next[field]);
    if (firstInvalid) requestAnimationFrame(() => document.getElementById(`booking-${firstInvalid}`)?.focus());
    return Object.keys(next).length === 0;
  };
  const updateDetail = (field: keyof CustomerDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };
  const continueToReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateDetails()) return;
    setStep("review");
    track("booking_details_completed", { partner: site.partner.slug });
  };
  const confirmBooking = async () => {
    if (!interactive || !service || !selectedSlot) return;
    setSubmitting(true);
    setError("");
    track("booking_confirmation_started", { partner: site.partner.slug });
    try {
      const created = await siteActions(mode).createBooking(site, {
        serviceId: service.id,
        scheduledStart: selectedSlot,
        customerName: details.customerName.trim(),
        customerPhone: details.customerPhone.trim() || undefined,
        customerEmail: details.customerEmail.trim() || undefined,
        customerAddress: details.customerAddress.trim() || undefined,
        notes: details.notes.trim() || undefined,
      });
      setBooking(created ?? null);
      setStep("complete");
      track("booking_completed", { partner: site.partner.slug, service: service.id });
    } catch (requestError) {
      setError(requestError instanceof Error || requestError instanceof PublicApiError ? requestError.message : "We couldn’t confirm your booking. Try again.");
      if (requestError instanceof PublicApiError && requestError.status === 409) {
        setStep("time");
        setSelectedSlot("");
        setSlotNotice("That time was just booked. Choose another available time.");
        setAvailabilityRetry((value) => value + 1);
      }
      track("booking_failed", { partner: site.partner.slug });
    } finally { setSubmitting(false); }
  };

  if (!service) return <section className="booking-shell booking-empty"><p>Online booking is coming soon.</p><button className="booking-text-button" onClick={onExit} type="button">Return to profile</button></section>;

  const confirmedSlot = booking?.scheduledStart ?? selectedSlot;
  const confirmedEnd = booking?.scheduledEnd ?? (confirmedSlot ? new Date(new Date(confirmedSlot).getTime() + service.durationMinutes * 60_000).toISOString() : "");
  const confirmedPrice = booking?.priceCents ?? service.priceCents;
  if (step === "complete") return <section className="booking-shell booking-complete" aria-live="polite">
    <BookingHeader businessName={site.partner.businessName} complete onExit={onExit} />
    <main className="booking-main"><div className="confirmation-content">
      <CheckCircle2 className="confirmation-icon" size={52} />
      <h1>{mode === "preview" ? "Booking preview completed" : "Booking confirmed"}</h1>
      <p>{mode === "preview" ? "This was a preview. No booking was created." : site.booking.confirmationMessage}</p>
      <div className="confirmation-card"><b>{service.name}</b><span>{formatWhen(confirmedSlot)}</span><span>{formatTime(confirmedSlot)} – {formatTime(confirmedEnd)}</span>{details.customerAddress && <span>{details.customerAddress}</span>}<strong>{service.priceMode === "from" ? "From " : ""}{money(confirmedPrice)}</strong></div>
      {mode === "published" && <a className="booking-calendar-link" href={calendarUrl(`${service.name} with ${site.partner.businessName}`, confirmedSlot, confirmedEnd, details.customerAddress)} target="_blank" rel="noopener noreferrer"><CalendarPlus size={17} /> Add to calendar</a>}
    </div></main>
    <BookingFooter><button className="site-button booking-submit" onClick={onExit} type="button">Back to profile</button></BookingFooter>
  </section>;

  const title = step === "time" ? `Book ${service.name}` : step === "details" ? "Your details" : "Review booking";
  const progress = step === "time" ? 1 : step === "details" ? 2 : 3;
  return <section className="booking-shell" aria-labelledby="booking-title"><BookingHeader title={title} progress={progress} onBack={goBack} /><main className="booking-main">
    {step === "time" && <section className="booking-step booking-time-step" aria-labelledby="booking-title">
      <p className="booking-section-label">Selected service</p>
      <div className="selected-service-card"><div><b>{service.name}</b><span>{duration(service.durationMinutes)}</span></div><strong>{servicePrice(service)}</strong><button type="button" onClick={() => setShowServiceChoices((open) => !open)} aria-expanded={showServiceChoices}>Change <ChevronDown size={15} /></button></div>
      {showServiceChoices && <div className="service-choices" aria-label="Choose a different service">{services.map((item) => <button className={item.id === service.id ? "selected" : ""} type="button" onClick={() => selectService(item.id)} key={item.id}><span><b>{item.name}</b><small>{duration(item.durationMinutes)}</small></span><strong>{servicePrice(item)}</strong>{item.id === service.id && <Check size={16} />}</button>)}</div>}
      <h2>Choose a date and time</h2>
      <div className="date-controls"><div className="date-list" aria-label="Nearest available dates">{availableDates.map((date) => { const value = dateKey(date); const selected = selectedDate === value; return <button key={value} type="button" className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => selectDate(value)}><span>{dayNames[date.getUTCDay()]}</span><b>{date.getUTCDate()}</b>{selected && <Check size={13} />}</button>; })}</div><BookingDatePicker availableWeekdays={site.availability.weekdays} onChange={selectDate} value={selectedDate} /></div>
      <div className="time-list" aria-live="polite">{loadingSlots ? <span className="times-loading"><LoaderCircle className="spin" size={16} />Finding available times</span> : slots.length ? slots.map((slot) => { const selected = selectedSlot === slot; return <button type="button" className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => selectSlot(slot)} key={slot}><span>{formatTime(slot)}</span>{selected && <Check size={14} />}</button>; }) : !error && <span className="times-empty">No times that day. Choose another date.</span>}</div>
      {slotNotice && <p className="form-error" role="status">{slotNotice}</p>}
      {error && <div className="availability-error" role="alert"><p className="form-error">{error}</p><button type="button" className="booking-text-button" onClick={() => setAvailabilityRetry((value) => value + 1)}>Try again</button></div>}
    </section>}
    {step === "details" && <form className="booking-step booking-details-step" id="booking-details-form" onSubmit={continueToReview} noValidate>
      <div className="booking-details-intro"><p className="booking-section-label">Almost there</p><h2>Where should we come?</h2><span>We only use these details for this booking.</span></div>
      <section className="booking-details-card" aria-labelledby="booking-address-title">
        <div className="booking-details-card-heading"><MapPin size={18} /><div><h3 id="booking-address-title">Service address</h3><p>Where the service will take place.</p></div></div>
        <CustomerField label={`Address${site.booking.requiredFields.address ? "" : " (optional)"}`} name="customerAddress" value={details.customerAddress} error={fieldErrors.customerAddress} onChange={updateDetail} autoComplete="street-address" required={site.booking.requiredFields.address} />
      </section>
      <section className="booking-details-card" aria-labelledby="booking-contact-title">
        <div className="booking-details-card-heading"><UserRound size={18} /><div><h3 id="booking-contact-title">Contact details</h3><p>So your provider can reach you about this visit.</p></div></div>
        <div className="customer-fields">
          <CustomerField label="Your name" name="customerName" value={details.customerName} error={fieldErrors.customerName} onChange={updateDetail} autoComplete="name" required />
          <CustomerField label={`Phone${site.booking.requiredFields.phone ? "" : " (optional)"}`} name="customerPhone" value={details.customerPhone} error={fieldErrors.customerPhone} onChange={updateDetail} autoComplete="tel" type="tel" inputMode="tel" required={site.booking.requiredFields.phone} />
          <CustomerField label={`Email${site.booking.requiredFields.email ? "" : " (optional)"}`} name="customerEmail" value={details.customerEmail} error={fieldErrors.customerEmail} onChange={updateDetail} autoComplete="email" type="email" inputMode="email" required={site.booking.requiredFields.email} />
        </div>
      </section>
      {site.booking.requiredFields.notes || showNote ? <section className="booking-details-card booking-note-card"><CustomerField label={`Notes${site.booking.requiredFields.notes ? "" : " (optional)"}`} name="notes" value={details.notes} error={fieldErrors.notes} onChange={updateDetail} textarea /></section> : <button className="booking-add-note" onClick={() => setShowNote(true)} type="button"><StickyNote size={16} /> Add a note (optional)</button>}
    </form>}
    {step === "review" && <section className="booking-step booking-review-step"><div className="booking-review-heading"><p className="booking-section-label">Final check</p><h2>Everything look right?</h2><span>You can go back to change any detail.</span></div><div className="review-card"><dl><div><dt>Service</dt><dd>{service.name}</dd></div><div><dt>When</dt><dd>{formatWhen(selectedSlot)} · {formatTime(selectedSlot)}</dd></div>{details.customerAddress && <div><dt>Address</dt><dd>{details.customerAddress}</dd></div>}<div><dt>Contact</dt><dd className="review-contact"><b>{details.customerName}</b>{details.customerPhone && <span>{details.customerPhone}</span>}{details.customerEmail && <span>{details.customerEmail}</span>}</dd></div><div><dt>Provider</dt><dd>{site.partner.businessName}</dd></div></dl><div className="review-total"><span>{service.priceMode === "from" ? "Starting at" : "Total"}</span><strong>{money(service.priceCents)}</strong></div></div><section className="payment-section" aria-labelledby="payment-title"><h2 id="payment-title">Payment</h2><div><LockKeyhole size={18} /><span><b>No online payment</b><small>Arrange payment directly with {site.partner.businessName}.</small></span></div></section>{error && <p className="form-error" role="alert">{error}</p>}</section>}
  </main><BookingFooter serviceName={service.name} meta={selectedSlot ? `${formatWhen(selectedSlot)} · ${formatTime(selectedSlot)}` : duration(service.durationMinutes)} price={servicePrice(service)}>{step === "time" ? <button key="time-continue" className="site-button booking-submit" type="button" disabled={!selectedSlot || loadingSlots} onClick={continueToDetails}>Continue <ChevronRight size={18} /></button> : step === "details" ? <button key="details-review" className="site-button booking-submit" type="submit" form="booking-details-form">Review <ChevronRight size={18} /></button> : <button key="review-confirm" className="site-button booking-submit" type="button" disabled={submitting} aria-busy={submitting} onClick={confirmBooking}>{submitting ? <><LoaderCircle className="spin" size={17} />Confirming</> : "Confirm booking"}</button>}</BookingFooter></section>;
}

function BookingHeader({ title, progress, businessName, complete = false, onBack, onExit }: { title?: string; progress?: number; businessName?: string; complete?: boolean; onBack?: () => void; onExit?: () => void }) {
  return <div className="booking-header-wrap"><header className="booking-header">{complete ? <><button className="booking-header-button" onClick={onExit} type="button" aria-label="Return to profile"><ArrowLeft size={20} /></button><b>{businessName}</b><button className="booking-header-button" onClick={onExit} type="button" aria-label="Close confirmation"><X size={20} /></button></> : <><button className="booking-header-button" onClick={onBack} type="button" aria-label="Go back"><ArrowLeft size={20} /></button><h1 id="booking-title">{title}</h1><span>{progress} of 3</span></>}</header>{progress && <div className="booking-progress" aria-hidden="true"><i style={{ width: `${progress / 3 * 100}%` }} /></div>}</div>;
}

function BookingFooter({ children, serviceName, meta, price }: { children: React.ReactNode; serviceName?: string; meta?: string; price?: string }) { return <footer className="booking-footer">{serviceName && <div className="booking-footer-summary"><div><b>{serviceName}</b>{meta && <span>{meta}</span>}</div>{price && <strong>{price}</strong>}</div>}{children}</footer>; }

function CustomerField({ label, name, value, error, onChange, textarea = false, ...input }: { label: string; name: keyof CustomerDetails; value: string; error?: string; onChange: (name: keyof CustomerDetails, value: string) => void; textarea?: boolean } & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "value" | "onChange">) {
  const id = `booking-${name}`;
  const describedBy = error ? `${id}-error` : undefined;
  return <label className="customer-field" htmlFor={id}>{label}{textarea ? <textarea id={id} name={name} value={value} onChange={(event) => onChange(name, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy} rows={3} /> : <input id={id} name={name} value={value} onChange={(event) => onChange(name, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...input} />}{error && <small id={describedBy} role="alert">{error}</small>}</label>;
}
