from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from core.templates import template_theme
from models import AvailabilityRule, Booking, BookingConfig, Partner, PartnerSiteConfig, PortfolioItem, Review, Service, User

DEFAULT_SECTIONS = {"services": True, "portfolio": True, "reviews": True, "about": True}
DEFAULT_FIELDS = {"name": True, "phone": True, "email": False, "address": True, "notes": False}


def install_defaults(db: Session, partner: Partner, template: str = "clean") -> None:
    # Attach defaults through relationships so they are usable in the same transaction,
    # including immediately after an account is created or seeded.
    partner.site_config = PartnerSiteConfig(partner_id=partner.id, template=template, theme_config=template_theme(template), sections_config=DEFAULT_SECTIONS.copy())
    partner.availability = AvailabilityRule(partner_id=partner.id)
    partner.booking_config = BookingConfig(partner_id=partner.id, required_fields=DEFAULT_FIELDS.copy())
    db.add_all([partner.site_config, partner.availability, partner.booking_config])


def owned_partner(db: Session, user: User) -> Partner:
    partner = db.scalar(select(Partner).where(Partner.owner_user_id == user.id))
    if not partner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account does not own a Cleanie page.")
    return partner


def published_partner(db: Session, slug: str) -> Partner:
    partner = db.scalar(select(Partner).where(Partner.slug == slug, Partner.status == "published"))
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This Cleanie page is not available.")
    return partner


def partner_dict(partner: Partner) -> dict:
    return {"id": partner.id, "businessName": partner.business_name, "slug": partner.slug, "tagline": partner.tagline, "serviceArea": partner.service_area, "profileImageUrl": partner.profile_image_url, "heroImageUrl": partner.hero_image_url, "about": partner.about, "status": partner.status, "publishedAt": partner.published_at}


def service_dict(item: Service) -> dict:
    return {"id": item.id, "name": item.name, "description": item.description, "priceCents": item.price_cents, "durationMinutes": item.duration_minutes, "active": item.active, "sortOrder": item.sort_order}


def portfolio_dict(item: PortfolioItem) -> dict:
    return {"id": item.id, "beforeImageUrl": item.before_image_url, "afterImageUrl": item.after_image_url, "caption": item.caption, "sortOrder": item.sort_order}


def review_dict(item: Review) -> dict:
    return {"id": item.id, "author": item.author, "rating": item.rating, "text": item.text, "source": item.source, "sourceUrl": item.source_url, "featured": item.featured}


def availability_dict(item: AvailabilityRule) -> dict:
    return {"weekdays": item.weekdays, "startTime": item.start_time, "endTime": item.end_time, "slotIntervalMinutes": item.slot_interval_minutes}


def booking_config_dict(item: BookingConfig) -> dict:
    return {"ctaLabel": item.cta_label, "requiredFields": item.required_fields, "paymentMode": item.payment_mode, "confirmationMessage": item.confirmation_message}


def site_dict(partner: Partner) -> dict:
    config = partner.site_config
    return {"template": config.template, "theme": config.theme_config, "sections": config.sections_config}


def public_site_payload(db: Session, partner: Partner) -> dict:
    reviews = db.scalars(select(Review).where(Review.partner_id == partner.id).order_by(Review.featured.desc(), Review.id)).all()
    services = db.scalars(select(Service).where(Service.partner_id == partner.id, Service.active.is_(True)).order_by(Service.sort_order, Service.name)).all()
    portfolio = db.scalars(select(PortfolioItem).where(PortfolioItem.partner_id == partner.id).order_by(PortfolioItem.sort_order)).all()
    rating = (sum(item.rating for item in reviews) / len(reviews)) if reviews else 5.0
    return {"partner": partner_dict(partner), "site": site_dict(partner), "services": [service_dict(item) for item in services], "portfolio": [portfolio_dict(item) for item in portfolio], "reviews": [review_dict(item) for item in reviews], "availability": availability_dict(partner.availability), "booking": booking_config_dict(partner.booking_config), "metrics": {"rating": round(rating, 1), "reviewCount": len(reviews), "completedJobs": 0, "views": 0}}


def overview_payload(db: Session, partner: Partner) -> dict:
    payload = public_site_payload(db, partner)
    total_bookings = db.scalar(select(func.count(Booking.id)).where(Booking.partner_id == partner.id)) or 0
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    end = start.replace(hour=23, minute=59, second=59)
    today = db.scalars(select(Booking).where(Booking.partner_id == partner.id, Booking.scheduled_start >= start, Booking.scheduled_start <= end).order_by(Booking.scheduled_start)).all()
    payload["metrics"] = {"views": 0, "bookingCount": total_bookings, "rating": payload["metrics"]["rating"]}
    payload["todayBookings"] = [booking_dict(item) for item in today]
    return payload


def booking_dict(item: Booking) -> dict:
    return {"id": item.id, "customerName": item.customer_name, "customerPhone": item.customer_phone, "customerEmail": item.customer_email, "customerAddress": item.customer_address, "notes": item.notes, "scheduledStart": item.scheduled_start, "scheduledEnd": item.scheduled_end, "priceCents": item.price_cents, "status": item.status, "service": service_dict(item.service) if item.service else None}
