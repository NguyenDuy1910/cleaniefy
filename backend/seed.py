from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from db.session import SessionLocal
from models import Booking, Partner, PortfolioItem, Review, Service, User
from services.auth import hash_password
from services.partner_site import install_defaults


DEMO_USERS = (
    ("jessica@example.com", "Jessica's Home Care", "jessica", "clean", "Thoughtful cleaning for busy families.", "Austin, TX", "/demo/jessica.png"),
    ("warm@example.com", "Warm Home Cleaning", "warm-demo", "warm-home", "The neighborhood clean that feels like home.", "Austin, TX", "/demo/warm-home.png"),
    ("sparkle@example.com", "Sparkle Austin", "sparkle", "pro", "Home & office cleaning you can count on.", "Austin, TX", "/demo/jessica.png"),
)


def seed_demo_data() -> None:
    db = SessionLocal()
    try:
        if db.scalar(select(User.id).where(User.email == "jessica@example.com")):
            return
        partners: list[Partner] = []
        for index, (email, name, slug, template, tagline, area, image) in enumerate(DEMO_USERS):
            user = User(email=email, password_hash=hash_password("cleanie-demo"), is_admin=index == 0)
            db.add(user); db.flush()
            partner = Partner(owner_user_id=user.id, business_name=name, slug=slug, tagline=tagline, service_area=area, profile_image_url=image, hero_image_url=image, about=f"{name} brings reliable, detail-minded care to every home. We arrive prepared, respect your space, and leave things feeling genuinely refreshed.", status="published", published_at=datetime.now(timezone.utc))
            db.add(partner); db.flush(); install_defaults(db, partner, template)
            if template == "warm-home":
                partner.site_config.theme_config = {"primaryColor": "#8f5733", "backgroundTone": "warm", "fontPreset": "soft", "buttonStyle": "pill"}
                partner.booking_config.cta_label = "See available times"
            elif template == "pro":
                partner.site_config.theme_config = {"primaryColor": "#243873", "backgroundTone": "cool", "fontPreset": "modern", "buttonStyle": "soft"}
                partner.booking_config.cta_label = "Get an available slot"
            services = [
                Service(partner_id=partner.id, name="Standard Cleaning", description="A reliable reset for your home", price_cents=12000, duration_minutes=120, sort_order=0),
                Service(partner_id=partner.id, name="Deep Cleaning", description="The details that make a home shine", price_cents=18000, duration_minutes=180, sort_order=1),
            ]
            if template == "pro": services[0].name = "Residential Cleaning"; services.append(Service(partner_id=partner.id, name="Office Cleaning", description="Dependable care for productive teams", price_cents=24000, duration_minutes=180, sort_order=2))
            db.add_all(services)
            db.add_all([
                Review(partner_id=partner.id, author="Sarah M.", rating=5, text="Reliable, kind and incredibly thorough.", source="google", featured=True),
                Review(partner_id=partner.id, author="Diana R.", rating=5, text="Easy to book and our home felt brand new.", source="google", featured=False),
                PortfolioItem(partner_id=partner.id, before_image_url=image, after_image_url="/demo/warm-home.png" if image.endswith("jessica.png") else "/demo/jessica.png", caption="A fresh start for a busy home", sort_order=0),
            ])
            partners.append(partner)
        db.flush()
        tomorrow = datetime.now(timezone.utc).replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)
        first = partners[0]; service = db.scalar(select(Service).where(Service.partner_id == first.id).order_by(Service.sort_order))
        db.add(Booking(partner_id=first.id, service_id=service.id, customer_name="Sarah Johnson", customer_phone="(512) 555-0194", customer_address="1804 Oak Street, Austin", scheduled_start=tomorrow, scheduled_end=tomorrow + timedelta(minutes=service.duration_minutes), price_cents=service.price_cents))
        db.commit()
    finally:
        db.close()
