from __future__ import annotations

import re
from datetime import date as Date, datetime, time, timedelta, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.config import blob_storage_credentials
from core.slugs import RESERVED_PARTNER_SLUGS, suggest_slug, validate_slug
from core.templates import template_theme
from db.session import get_db
from models import AvailabilityRule, Booking, BookingConfig, Partner, PartnerSiteConfig, PortfolioItem, Review, Service, User
from schemas import (AvailabilityUpdate, BookingConfigUpdate, Login, PartnerUpdate, PortfolioCreate, PublicBookingCreate, ReviewCreate, SectionsConfig, ServiceCreate, ServiceUpdate, SignUp, ThemeUpdate)
from services.auth import create_access_token, current_user, hash_password, verify_password
from services.partner_site import (availability_dict, booking_config_dict, booking_dict, install_defaults, overview_payload, owned_partner, partner_dict, portfolio_dict, public_site_payload, published_partner, review_dict, service_dict, site_dict)

router = APIRouter(prefix="/api/v1")


def unique_slug(db: Session, name: str) -> str:
    base = suggest_slug(name)
    candidate, index = base, 2
    while candidate in RESERVED_PARTNER_SLUGS or db.scalar(select(Partner.id).where(Partner.slug == candidate)):
        suffix = f"-{index}"
        candidate = f"{base[:40 - len(suffix)].rstrip('-')}{suffix}"
        index += 1
    return candidate


def get_record(db: Session, model, record_id: str, partner_id: str):
    record = db.scalar(select(model).where(model.id == record_id, model.partner_id == partner_id))
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="That item was not found.")
    return record


def as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def availability_slots(db: Session, partner: Partner, day: Date, service: Service | None = None) -> list[datetime]:
    rule = partner.availability
    if day.weekday() + 1 == 7:  # convert Python's Monday=0 to JavaScript's Sunday=0
        weekday = 0
    else:
        weekday = day.weekday() + 1
    if weekday not in rule.weekdays:
        return []
    start = datetime.combine(day, time.fromisoformat(rule.start_time)).replace(tzinfo=timezone.utc)
    close = datetime.combine(day, time.fromisoformat(rule.end_time)).replace(tzinfo=timezone.utc)
    duration = timedelta(minutes=service.duration_minutes if service else rule.slot_interval_minutes)
    existing = db.scalars(select(Booking).where(Booking.partner_id == partner.id, Booking.status != "cancelled", Booking.scheduled_start < close, Booking.scheduled_end > start)).all()
    occupied = [(as_utc(item.scheduled_start), as_utc(item.scheduled_end)) for item in existing]
    slots: list[datetime] = []
    candidate = start
    while candidate + duration <= close:
        if candidate >= datetime.now(timezone.utc) and not any(candidate < end and candidate + duration > begins for begins, end in occupied):
            slots.append(candidate)
        candidate += timedelta(minutes=rule.slot_interval_minutes)
    return slots


@router.post("/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignUp, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with that email already exists.")
    user = User(email=email, password_hash=hash_password(payload.password))
    db.add(user); db.flush()
    partner = Partner(owner_user_id=user.id, business_name=payload.business_name.strip(), slug=unique_slug(db, payload.business_name))
    db.add(partner); db.flush(); install_defaults(db, partner); db.commit(); db.refresh(partner)
    return {"accessToken": create_access_token(user), "user": {"id": user.id, "email": user.email, "isAdmin": user.is_admin}, "partner": partner_dict(partner)}


@router.post("/auth/login")
def login(payload: Login, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password.")
    partner = owned_partner(db, user)
    return {"accessToken": create_access_token(user), "user": {"id": user.id, "email": user.email, "isAdmin": user.is_admin}, "partner": partner_dict(partner)}


@router.get("/partners/slug-availability")
def slug_availability(slug: str, db: Session = Depends(get_db)):
    try:
        validate_slug(slug)
    except HTTPException as error:
        return {"slug": slug, "available": False, "reason": error.detail}
    existing = db.scalar(select(Partner.id).where(Partner.slug == slug))
    return {"slug": slug, "available": existing is None, "reason": None if existing is None else "That Cleanie link is already in use."}


@router.get("/partners/me")
def my_partner(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return overview_payload(db, owned_partner(db, user))


@router.patch("/partners/me")
def update_partner(payload: PartnerUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user)
    updates = payload.model_dump(exclude_unset=True)
    if "slug" in updates:
        validate_slug(updates["slug"])
        if updates["slug"] != partner.slug and db.scalar(select(Partner.id).where(Partner.slug == updates["slug"])):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That Cleanie link is already in use.")
    for field, value in updates.items():
        setattr(partner, field, value.strip() if isinstance(value, str) and field not in {"profile_image_url", "hero_image_url"} else value)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback(); raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That Cleanie link is already in use.") from error
    db.refresh(partner)
    return partner_dict(partner)


@router.put("/partners/me/theme")
def update_theme(payload: ThemeUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user); config = partner.site_config
    if payload.template is not None:
        config.template = payload.template
        # Direct API consumers receive a complete, usable design even when they
        # only select a template. The dashboard can still send a custom theme.
        if payload.theme is None: config.theme_config = template_theme(payload.template)
    if payload.theme is not None: config.theme_config = payload.theme.model_dump(by_alias=True)
    db.commit(); db.refresh(config)
    return site_dict(partner)


@router.put("/partners/me/sections")
def update_sections(payload: SectionsConfig, user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user); partner.site_config.sections_config = payload.model_dump(by_alias=True); db.commit()
    return partner.site_config.sections_config


@router.get("/partners/me/services")
def list_services(user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user)
    return [service_dict(item) for item in db.scalars(select(Service).where(Service.partner_id == partner.id).order_by(Service.sort_order, Service.name)).all()]


@router.post("/partners/me/services", status_code=status.HTTP_201_CREATED)
def add_service(payload: ServiceCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user); order = (db.scalar(select(func.max(Service.sort_order)).where(Service.partner_id == partner.id)) or -1) + 1
    item = Service(partner_id=partner.id, sort_order=order, **payload.model_dump()); db.add(item); db.commit(); db.refresh(item)
    return service_dict(item)


@router.patch("/partners/me/services/{service_id}")
def edit_service(service_id: str, payload: ServiceUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    item = get_record(db, Service, service_id, owned_partner(db, user).id)
    for field, value in payload.model_dump(exclude_unset=True).items(): setattr(item, field, value)
    db.commit(); db.refresh(item); return service_dict(item)


@router.delete("/partners/me/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_service(service_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(get_record(db, Service, service_id, owned_partner(db, user).id)); db.commit()


@router.get("/partners/me/portfolio")
def list_portfolio(user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user); return [portfolio_dict(item) for item in db.scalars(select(PortfolioItem).where(PortfolioItem.partner_id == partner.id).order_by(PortfolioItem.sort_order)).all()]


@router.post("/partners/me/portfolio", status_code=status.HTTP_201_CREATED)
def add_portfolio(payload: PortfolioCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user); order = (db.scalar(select(func.max(PortfolioItem.sort_order)).where(PortfolioItem.partner_id == partner.id)) or -1) + 1
    item = PortfolioItem(partner_id=partner.id, sort_order=order, **payload.model_dump()); db.add(item); db.commit(); db.refresh(item); return portfolio_dict(item)


@router.delete("/partners/me/portfolio/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_portfolio(item_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(get_record(db, PortfolioItem, item_id, owned_partner(db, user).id)); db.commit()


@router.get("/partners/me/reviews")
def list_reviews(user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user); return [review_dict(item) for item in db.scalars(select(Review).where(Review.partner_id == partner.id).order_by(Review.featured.desc())).all()]


@router.post("/partners/me/reviews", status_code=status.HTTP_201_CREATED)
def add_review(payload: ReviewCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user)
    if payload.featured: db.query(Review).filter(Review.partner_id == partner.id).update({Review.featured: False})
    item = Review(partner_id=partner.id, **payload.model_dump()); db.add(item); db.commit(); db.refresh(item); return review_dict(item)


@router.delete("/partners/me/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_review(review_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(get_record(db, Review, review_id, owned_partner(db, user).id)); db.commit()


@router.put("/partners/me/availability")
def set_availability(payload: AvailabilityUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user)
    for field, value in payload.model_dump().items(): setattr(partner.availability, field, value)
    db.commit(); return availability_dict(partner.availability)


@router.put("/partners/me/booking-config")
def set_booking_config(payload: BookingConfigUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user); config = partner.booking_config
    config.cta_label = payload.cta_label; config.required_fields = payload.required_fields.model_dump(by_alias=True); config.payment_mode = payload.payment_mode; config.confirmation_message = payload.confirmation_message
    db.commit(); return booking_config_dict(config)


@router.post("/partners/me/media")
async def upload_media(file: UploadFile = File(...), purpose: str = Form(...), user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user)
    if purpose not in {"profile", "hero", "before", "after"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown media purpose.")
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Upload a JPEG, PNG, or WebP image.")
    data = await file.read()
    if not data or len(data) > 4 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Images must be smaller than 4 MB.")
    credentials = blob_storage_credentials()
    if not credentials:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Image storage is not configured.")
    store_id, token = credentials
    try:
        from vercel.blob import AsyncBlobClient
        safe_name = re.sub(r"[^a-zA-Z0-9._-]", "-", file.filename or "image")
        blob = await AsyncBlobClient(token=token).put(
            f"partners/{partner.id}/{purpose}/{safe_name}",
            data,
            access="public",
            add_random_suffix=True,
            content_type=file.content_type,
        )
        if urlparse(blob.url).hostname != f"{store_id}.public.blob.vercel-storage.com":
            raise RuntimeError("The configured Vercel Blob store does not match the upload token.")
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Image storage is unavailable. Please try again shortly.") from error
    return {"url": blob.url}


@router.get("/partners/me/bookings")
def list_bookings(user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user)
    return [booking_dict(item) for item in db.scalars(select(Booking).where(Booking.partner_id == partner.id).order_by(Booking.scheduled_start.desc())).all()]


@router.post("/partners/me/publish")
def publish(user: User = Depends(current_user), db: Session = Depends(get_db)):
    partner = owned_partner(db, user)
    if not partner.business_name or not partner.slug or not db.scalar(select(Service.id).where(Service.partner_id == partner.id, Service.active.is_(True))):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Add a business name, Cleanie link, and at least one active service before publishing.")
    partner.status = "published"; partner.published_at = datetime.now(timezone.utc); db.commit(); db.refresh(partner)
    return partner_dict(partner)


@router.get("/public/partners/{slug}")
def public_partner(slug: str, db: Session = Depends(get_db)):
    return public_site_payload(db, published_partner(db, slug))


@router.get("/public/partners/{slug}/availability")
def public_availability(slug: str, date: Date, service_id: str | None = None, db: Session = Depends(get_db)):
    partner = published_partner(db, slug); service = None
    if service_id:
        service = db.scalar(select(Service).where(Service.id == service_id, Service.partner_id == partner.id, Service.active.is_(True)))
        if not service: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="That service is no longer available.")
    return {"date": date.isoformat(), "slots": [item.isoformat() for item in availability_slots(db, partner, date, service)]}


@router.post("/public/partners/{slug}/bookings", status_code=status.HTTP_201_CREATED)
def create_public_booking(slug: str, payload: PublicBookingCreate, db: Session = Depends(get_db)):
    # Lock the tenant row first. This serializes competing booking requests for this partner without global locks.
    partner = db.scalar(select(Partner).where(Partner.slug == slug, Partner.status == "published").with_for_update())
    if not partner: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This Cleanie page is not available.")
    service = db.scalar(select(Service).where(Service.id == payload.service_id, Service.partner_id == partner.id, Service.active.is_(True)))
    if not service: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="That service is no longer available.")
    required = partner.booking_config.required_fields
    values = {"phone": payload.customer_phone, "email": payload.customer_email, "address": payload.customer_address, "notes": payload.notes}
    for field, value in values.items():
        if required.get(field) and not value:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{field.capitalize()} is required for this booking.")
    scheduled_start = as_utc(payload.scheduled_start)
    valid_slots = availability_slots(db, partner, scheduled_start.date(), service)
    if scheduled_start not in valid_slots:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This time was just booked. Please choose another available time.")
    booking = Booking(partner_id=partner.id, service_id=service.id, customer_name=payload.customer_name.strip(), customer_phone=payload.customer_phone, customer_email=str(payload.customer_email) if payload.customer_email else None, customer_address=payload.customer_address, notes=payload.notes, scheduled_start=scheduled_start, scheduled_end=scheduled_start + timedelta(minutes=service.duration_minutes), price_cents=service.price_cents)
    db.add(booking)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback(); raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This time was just booked. Please choose another available time.") from error
    db.refresh(booking); return booking_dict(booking)


def admin_user(user: User = Depends(current_user)) -> User:
    if not user.is_admin: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access is required.")
    return user


@router.get("/admin/partners")
def admin_partners(_: User = Depends(admin_user), db: Session = Depends(get_db)):
    return [partner_dict(item) for item in db.scalars(select(Partner).order_by(Partner.created_at.desc())).all()]


@router.get("/admin/bookings")
def admin_bookings(_: User = Depends(admin_user), db: Session = Depends(get_db)):
    return [booking_dict(item) for item in db.scalars(select(Booking).order_by(Booking.created_at.desc()).limit(200)).all()]
