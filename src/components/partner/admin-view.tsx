import Link from "next/link";
import type { Booking, Partner } from "@/lib/types";
import { formatBookingDate, formatBookingTime } from "@/features/booking/format";

export function AdminView({ partners, bookings }: { partners: Partner[]; bookings: Booking[] }) {
  return (
    <main className="admin-page">
      <header>
        <Link className="wordmark" href="/dashboard">cleanie</Link>
        <div><span>Admin</span><Link href="/dashboard">Partner dashboard</Link></div>
      </header>
      <h1>Operations</h1>
      <p className="admin-intro">A deliberately small view of partners and the bookings they receive.</p>
      <section className="admin-section">
        <h2>Partners</h2>
        <div className="admin-table">
          <div className="admin-row admin-head"><span>Business</span><span>Link</span><span>Status</span></div>
          {partners.map((partner) => (
            <div className="admin-row" key={partner.id}>
              <b>{partner.businessName}</b>
              {partner.status === "published"
                ? <a href={`/${partner.slug}`} target="_blank" rel="noreferrer">/{partner.slug}</a>
                : <span>/{partner.slug}</span>}
              <span className={`status ${partner.status}`}>{partner.status}</span>
            </div>
          ))}
          {!partners.length && <div className="admin-row admin-empty">No partners yet.</div>}
        </div>
      </section>
      <section className="admin-section">
        <h2>Recent bookings</h2>
        <div className="admin-table">
          <div className="admin-row admin-head booking"><span>Customer</span><span>Service</span><span>When</span><span>Amount</span></div>
          {bookings.map((booking) => (
            <div className="admin-row booking" key={booking.id}>
              <b>{booking.customerName}</b><span>{booking.service?.name}</span><span>{formatBookingDate(booking.scheduledStart)} · {formatBookingTime(booking.scheduledStart)}</span><span>${(booking.priceCents / 100).toFixed(0)}</span>
            </div>
          ))}
          {!bookings.length && <div className="admin-row admin-empty">No bookings yet.</div>}
        </div>
      </section>
    </main>
  );
}
