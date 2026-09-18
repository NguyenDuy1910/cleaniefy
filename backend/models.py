from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from db.session import Base


def uid() -> str:
    return str(uuid4())


def now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    partner: Mapped["Partner | None"] = relationship(back_populates="owner", uselist=False)


class Partner(Base):
    __tablename__ = "partners"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    business_name: Mapped[str] = mapped_column(String(140))
    slug: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    tagline: Mapped[str] = mapped_column(String(240), default="Thoughtful cleaning, made easy.")
    service_area: Mapped[str] = mapped_column(String(160), default="Your local area")
    profile_image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    hero_image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    about: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    owner: Mapped[User] = relationship(back_populates="partner")
    site_config: Mapped["PartnerSiteConfig | None"] = relationship(back_populates="partner", uselist=False, cascade="all, delete-orphan")
    services: Mapped[list["Service"]] = relationship(back_populates="partner", cascade="all, delete-orphan")
    portfolio_items: Mapped[list["PortfolioItem"]] = relationship(back_populates="partner", cascade="all, delete-orphan")
    reviews: Mapped[list["Review"]] = relationship(back_populates="partner", cascade="all, delete-orphan")
    availability: Mapped["AvailabilityRule | None"] = relationship(back_populates="partner", uselist=False, cascade="all, delete-orphan")
    booking_config: Mapped["BookingConfig | None"] = relationship(back_populates="partner", uselist=False, cascade="all, delete-orphan")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="partner", cascade="all, delete-orphan")


class PartnerSiteConfig(Base):
    __tablename__ = "partner_site_config"
    partner_id: Mapped[str] = mapped_column(ForeignKey("partners.id"), primary_key=True)
    template: Mapped[str] = mapped_column(String(30), default="clean")
    theme_config: Mapped[dict] = mapped_column(JSON, default=lambda: {"primaryColor": "#26573d", "backgroundTone": "light", "fontPreset": "modern", "buttonStyle": "soft"})
    sections_config: Mapped[dict] = mapped_column(JSON, default=lambda: {"services": True, "portfolio": True, "reviews": True, "about": True})
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    partner: Mapped[Partner] = relationship(back_populates="site_config")


class Service(Base):
    __tablename__ = "services"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    partner_id: Mapped[str] = mapped_column(ForeignKey("partners.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(String(400), default="")
    price_cents: Mapped[int] = mapped_column(Integer)
    duration_minutes: Mapped[int] = mapped_column(Integer)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    partner: Mapped[Partner] = relationship(back_populates="services")


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    partner_id: Mapped[str] = mapped_column(ForeignKey("partners.id"), index=True)
    before_image_url: Mapped[str] = mapped_column(String(1000))
    after_image_url: Mapped[str] = mapped_column(String(1000))
    caption: Mapped[str | None] = mapped_column(String(300), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    partner: Mapped[Partner] = relationship(back_populates="portfolio_items")


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    partner_id: Mapped[str] = mapped_column(ForeignKey("partners.id"), index=True)
    author: Mapped[str] = mapped_column(String(140))
    rating: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(20), default="manual")
    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    partner: Mapped[Partner] = relationship(back_populates="reviews")


class AvailabilityRule(Base):
    __tablename__ = "availability_rules"
    partner_id: Mapped[str] = mapped_column(ForeignKey("partners.id"), primary_key=True)
    weekdays: Mapped[list[int]] = mapped_column(JSON, default=lambda: [1, 2, 3, 4, 5])
    start_time: Mapped[str] = mapped_column(String(5), default="09:00")
    end_time: Mapped[str] = mapped_column(String(5), default="17:00")
    slot_interval_minutes: Mapped[int] = mapped_column(Integer, default=60)
    partner: Mapped[Partner] = relationship(back_populates="availability")


class BookingConfig(Base):
    __tablename__ = "booking_config"
    partner_id: Mapped[str] = mapped_column(ForeignKey("partners.id"), primary_key=True)
    cta_label: Mapped[str] = mapped_column(String(80), default="Book a cleaning")
    required_fields: Mapped[dict] = mapped_column(JSON, default=lambda: {"name": True, "phone": True, "email": False, "address": True, "notes": False})
    payment_mode: Mapped[str] = mapped_column(String(20), default="none")
    confirmation_message: Mapped[str] = mapped_column(String(300), default="Your request is in. We’ll be in touch shortly.")
    partner: Mapped[Partner] = relationship(back_populates="booking_config")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (UniqueConstraint("partner_id", "scheduled_start", name="uq_booking_partner_slot"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    partner_id: Mapped[str] = mapped_column(ForeignKey("partners.id"), index=True)
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id"), index=True)
    customer_name: Mapped[str] = mapped_column(String(140))
    customer_phone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    scheduled_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    price_cents: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="confirmed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    partner: Mapped[Partner] = relationship(back_populates="bookings")
    service: Mapped[Service] = relationship()
