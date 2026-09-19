"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookingFlow } from "@/components/booking/booking-flow";
import type { SiteRuntimeMode } from "@/features/booking/site-actions";
import type { PartnerSiteState } from "@/lib/types";

type BookingExperienceProps = {
  site: PartnerSiteState;
  profile: ReactNode;
  interactive?: boolean;
  mode?: SiteRuntimeMode;
};

/**
 * Owns the two high-level customer states: public profile and the focused
 * booking funnel. The checkout itself remains mounted for all three steps,
 * which preserves choices while a customer moves backwards through it.
 */
export function BookingExperience({
  site,
  profile,
  interactive = true,
  mode = "published",
}: BookingExperienceProps) {
  const [isBooking, setIsBooking] = useState(false);
  const [serviceId, setServiceId] = useState(site.services.find((service) => service.active)?.id ?? "");
  const profileScroll = useRef(0);
  const pushedEntry = useRef(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("cleanie:booking", { detail: { name: "booking_profile_view", partner: site.partner.slug } }));
  }, [site.partner.slug]);

  const openBooking = (nextServiceId?: string) => {
    if (!interactive) return;
    if (nextServiceId) setServiceId(nextServiceId);
    if (!isBooking) profileScroll.current = window.scrollY;
    if (!isBooking && mode === "published") {
      window.history.pushState({ cleanieBooking: true }, "", "#book");
      pushedEntry.current = true;
    }
    setIsBooking(true);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  };

  useEffect(() => {
    if (mode === "published" && window.location.hash === "#book") setIsBooking(true);
    const onPopState = (event: PopStateEvent) => {
      const booking = Boolean(event.state?.cleanieBooking || window.location.hash === "#book");
      setIsBooking(booking);
      pushedEntry.current = booking;
      requestAnimationFrame(() => window.scrollTo(0, booking ? 0 : profileScroll.current));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [mode]);

  const exitBooking = () => {
    if (mode === "published" && pushedEntry.current) {
      window.history.back();
      return;
    }
    if (mode === "published" && window.location.hash === "#book") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    setIsBooking(false);
    requestAnimationFrame(() => window.scrollTo(0, profileScroll.current));
  };

  return (
    <div
      className={isBooking ? "booking-experience booking-experience-active" : "booking-experience"}
      onClick={(event) => {
        const target = event.target as Element | null;
        const trigger = target?.closest<HTMLElement>("[data-booking-service], [data-start-booking]");
        if (!trigger) return;
        event.preventDefault();
        openBooking(trigger.dataset.bookingService);
      }}
    >
      {isBooking ? (
        <BookingFlow
          site={site}
          initialServiceId={serviceId}
          interactive={interactive}
          mode={mode}
          onExit={exitBooking}
          onServiceChange={setServiceId}
        />
      ) : profile}
    </div>
  );
}
