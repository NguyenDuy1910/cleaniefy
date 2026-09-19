import { MapPin, Phone, CalendarDays } from "lucide-react";
import type { Booking } from "@/lib/types";
import { formatBookingDate, formatBookingTime } from "@/features/booking/format";
import { DashboardFrame } from "./dashboard-home";

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function BookingsView({
  bookings,
  partnerSlug,
  published,
}: {
  bookings: Booking[];
  partnerSlug: string;
  published: boolean;
}) {
  return (
    <DashboardFrame active="bookings" partnerSlug={partnerSlug} published={published}>
      <header className="dashboard-heading">
        <div>
          <h1>Bookings</h1>
          <p>Everything you need for the day, in one place.</p>
        </div>
      </header>
      <div className="booking-list">
        {bookings.length ? (
          bookings.map((booking) => (
            <article key={booking.id}>
              <time>
                <b>
                  {formatBookingDate(booking.scheduledStart)}
                </b>
                <span>
                  {formatBookingTime(booking.scheduledStart)}
                </span>
              </time>
              <div className="booking-list-main">
                <h2>{booking.customerName}</h2>
                <p>
                  {booking.service?.name} · {money(booking.priceCents)}
                </p>
                <span>
                  <MapPin size={14} />
                  {booking.customerAddress || "Address to confirm"}
                </span>
                <span>
                  <Phone size={14} />
                  {booking.customerPhone || "Phone not provided"}
                </span>
                {booking.notes && <em>{booking.notes}</em>}
              </div>
              <span className="booking-status">
                <CalendarDays size={14} />
                {booking.status}
              </span>
            </article>
          ))
        ) : (
          <div className="empty-bookings">
            No bookings yet. Once customers use your link, their details will
            show up here.
          </div>
        )}
      </div>
    </DashboardFrame>
  );
}
