from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def camel_case(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(item.capitalize() for item in tail)


class Schema(BaseModel):
    model_config = ConfigDict(alias_generator=camel_case, populate_by_name=True, from_attributes=True)


class SignUp(Schema):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    business_name: str = Field(min_length=2, max_length=140)


class Login(Schema):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class PartnerUpdate(Schema):
    business_name: str | None = Field(default=None, min_length=2, max_length=140)
    slug: str | None = None
    tagline: str | None = Field(default=None, max_length=240)
    service_area: str | None = Field(default=None, max_length=160)
    profile_image_url: str | None = Field(default=None, max_length=1000)
    hero_image_url: str | None = Field(default=None, max_length=1000)
    about: str | None = Field(default=None, max_length=4000)


class ThemeConfig(Schema):
    primary_color: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    background_tone: Literal["light", "warm", "cool"] = "light"
    font_preset: Literal["modern", "soft"] = "modern"
    button_style: Literal["soft", "pill"] = "soft"


class ThemeUpdate(Schema):
    template: Literal["clean", "warm-home", "pro"] | None = None
    theme: ThemeConfig | None = None


class SectionsConfig(Schema):
    services: bool = True
    portfolio: bool = True
    reviews: bool = True
    about: bool = True


class ServiceCreate(Schema):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=400)
    price_cents: int = Field(ge=0, le=10_000_000)
    duration_minutes: int = Field(ge=15, le=1_440)
    active: bool = True


class ServiceUpdate(Schema):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=400)
    price_cents: int | None = Field(default=None, ge=0, le=10_000_000)
    duration_minutes: int | None = Field(default=None, ge=15, le=1_440)
    active: bool | None = None
    sort_order: int | None = Field(default=None, ge=0, le=10_000)


class PortfolioCreate(Schema):
    before_image_url: str = Field(min_length=1, max_length=1000)
    after_image_url: str = Field(min_length=1, max_length=1000)
    caption: str | None = Field(default=None, max_length=300)


class ReviewCreate(Schema):
    author: str = Field(min_length=2, max_length=140)
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=2, max_length=4000)
    source: Literal["google", "manual"] = "manual"
    source_url: str | None = Field(default=None, max_length=1000)
    featured: bool = False


class AvailabilityUpdate(Schema):
    weekdays: list[int] = Field(min_length=1, max_length=7)
    start_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    end_time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    slot_interval_minutes: int = Field(default=60, ge=15, le=240)

    @field_validator("weekdays")
    @classmethod
    def unique_weekdays(cls, weekdays: list[int]) -> list[int]:
        if len(set(weekdays)) != len(weekdays) or any(day < 0 or day > 6 for day in weekdays):
            raise ValueError("Choose each weekday at most once.")
        return sorted(weekdays)

    @field_validator("end_time")
    @classmethod
    def after_start(cls, end_time: str, info):
        start = info.data.get("start_time")
        if start and end_time <= start:
            raise ValueError("End time must be after start time.")
        return end_time


class RequiredFields(Schema):
    name: bool = True
    phone: bool = True
    email: bool = False
    address: bool = True
    notes: bool = False

    @field_validator("name")
    @classmethod
    def name_is_always_required(cls, name: bool) -> bool:
        if not name:
            raise ValueError("Customer name is always required for a booking.")
        return name


class BookingConfigUpdate(Schema):
    cta_label: str = Field(min_length=2, max_length=80)
    required_fields: RequiredFields
    payment_mode: Literal["none", "deposit", "full"] = "none"
    confirmation_message: str = Field(min_length=2, max_length=300)


class PublicBookingCreate(Schema):
    service_id: str = Field(min_length=1, max_length=36)
    scheduled_start: datetime
    customer_name: str = Field(min_length=2, max_length=140)
    customer_phone: str | None = Field(default=None, max_length=80)
    customer_email: EmailStr | None = None
    customer_address: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=4000)


class SlugAvailability(Schema):
    slug: str
    available: bool
    reason: str | None = None
