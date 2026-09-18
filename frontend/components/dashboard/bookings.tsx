"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone, CalendarDays, LoaderCircle } from "lucide-react";
import { ApiError, getBookings } from "@/lib/api/client";
import type { Booking } from "@/lib/types";
import { DashboardFrame } from "./dashboard-home";

const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
export function BookingsView() { const [bookings, setBookings] = useState<Booking[] | null>(null); const [error, setError] = useState(""); useEffect(() => { getBookings().then(setBookings).catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load bookings.")); }, []); return <DashboardFrame active="bookings"><header className="dashboard-heading"><div><h1>Bookings</h1><p>Everything you need for the day, in one place.</p></div></header>{error ? <p className="form-error">{error}</p> : !bookings ? <div className="dashboard-loading"><LoaderCircle className="spin"/> Loading bookings…</div> : <div className="booking-list">{bookings.length ? bookings.map((booking) => <article key={booking.id}><time><b>{new Date(booking.scheduledStart).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</b><span>{new Date(booking.scheduledStart).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></time><div className="booking-list-main"><h2>{booking.customerName}</h2><p>{booking.service?.name} · {money(booking.priceCents)}</p><span><MapPin size={14}/>{booking.customerAddress || "Address to confirm"}</span><span><Phone size={14}/>{booking.customerPhone || "Phone not provided"}</span>{booking.notes && <em>{booking.notes}</em>}</div><span className="booking-status"><CalendarDays size={14}/>{booking.status}</span></article>) : <div className="empty-bookings">No bookings yet. Once customers use your link, their details will show up here.</div>}</div>}</DashboardFrame>; }
