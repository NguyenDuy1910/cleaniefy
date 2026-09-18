"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, LoaderCircle } from "lucide-react";
import { ApiError, createBooking, getAvailability } from "@/lib/api/client";
import type { PublicSite, Service } from "@/lib/types";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export function BookingFlow({ site }: { site: PublicSite }) {
  const services = site.services.filter((service) => service.active);
  const dates = useMemo(() => Array.from({ length: 14 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index + 1); return date; }).filter((date) => site.availability.weekdays.includes(date.getDay())).slice(0, 5), [site.availability.weekdays]);
  const [service, setService] = useState<Service | null>(services[0] ?? null);
  const [date, setDate] = useState(dates[0] ? formatDate(dates[0]) : "");
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true); setSlot(""); setError("");
    getAvailability(site.partner.slug, date, service?.id).then(({ slots: nextSlots }) => setSlots(nextSlots)).catch(() => setError("We couldn’t load times. Please try again.")).finally(() => setLoadingSlots(false));
  }, [date, service?.id, site.partner.slug]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!service || !slot) { setError("Choose a service, date, and time to continue."); return; }
    const form = new FormData(event.currentTarget);
    setSubmitting(true); setError("");
    try {
      await createBooking(site.partner.slug, { serviceId: service.id, scheduledStart: slot, customerName: String(form.get("name") || ""), customerPhone: String(form.get("phone") || ""), customerEmail: String(form.get("email") || ""), customerAddress: String(form.get("address") || ""), notes: String(form.get("notes") || "") });
      setSuccess(true);
    } catch (err) { setError(err instanceof ApiError ? err.message : "We couldn’t save your booking. Please try again."); } finally { setSubmitting(false); }
  };

  if (success) return <section className="booking-flow booking-success" id="book" aria-live="polite"><CheckCircle2 size={42}/><h2>You&apos;re booked!</h2><p>{site.booking.confirmationMessage || `We’ve sent your booking request to ${site.partner.businessName}. They’ll be in touch shortly.`}</p></section>;
  if (!services.length) return null;

  return <section className="booking-flow" id="book" aria-labelledby="booking-title"><div className="booking-heading"><div><div className="site-kicker">Ready when you are</div><h2 id="booking-title">Book your cleaning</h2></div><span>2 min</span></div><form onSubmit={submit}>
    <fieldset><legend>1. Choose a service</legend><div className="booking-services">{services.map((item) => <button className={`booking-service ${service?.id === item.id ? "selected" : ""}`} type="button" onClick={() => setService(item)} key={item.id}><span><b>{item.name}</b><small>{item.durationMinutes >= 60 ? `${Math.round(item.durationMinutes / 60)} hr` : `${item.durationMinutes} min`}</small></span><strong>{money(item.priceCents)}+</strong></button>)}</div></fieldset>
    <fieldset><legend>2. Choose a day and time</legend><div className="date-list">{dates.map((item) => <button key={formatDate(item)} type="button" className={date === formatDate(item) ? "selected" : ""} onClick={() => setDate(formatDate(item))}><small>{dayNames[item.getDay()]}</small><b>{item.getDate()}</b></button>)}</div><div className="time-list" aria-live="polite">{loadingSlots ? <span className="times-loading"><LoaderCircle size={15}/> Finding times…</span> : slots.length ? slots.map((item) => <button className={slot === item ? "selected" : ""} type="button" key={item} onClick={() => setSlot(item)}>{new Date(item).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</button>) : <span className="times-empty">No times available for this day.</span>}</div></fieldset>
    <fieldset><legend>3. Your details</legend><div className="customer-fields"><label>Name<input name="name" required placeholder="Your full name" autoComplete="name"/></label>{site.booking.requiredFields.phone && <label>Phone<input name="phone" required placeholder="(555) 000-0000" autoComplete="tel"/></label>}{site.booking.requiredFields.email && <label>Email<input name="email" required placeholder="you@example.com" autoComplete="email" type="email"/></label>}{site.booking.requiredFields.address && <label>Service address<input name="address" required placeholder="Street address" autoComplete="street-address"/></label>}{site.booking.requiredFields.notes && <label>Anything else we should know?<textarea name="notes" placeholder="Access details, pets, priorities…" rows={3}/></label>}</div></fieldset>
    <div className="booking-summary"><span>{service?.name} {slot && `· ${new Date(slot).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}`}</span><strong>{service && money(service.priceCents)}+</strong></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="site-button booking-submit" disabled={submitting} type="submit">{submitting ? <><LoaderCircle className="spin" size={16}/> Booking…</> : <><Clock size={16}/>{site.booking.ctaLabel || "Confirm booking"}</>}</button><p className="payment-note">No online payment required.</p>
  </form></section>;
}
