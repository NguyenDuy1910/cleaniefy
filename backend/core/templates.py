from __future__ import annotations

TEMPLATE_KEYS = (
    "clean",
    "warm-home",
    "pro",
    "fresh-start",
    "signature",
    "eco-calm",
    "move-ready",
    "bright-home",
    "studio-luxe",
    "neighborly",
)

TEMPLATE_THEMES: dict[str, dict[str, str]] = {
    "clean": {"primaryColor": "#26573d", "backgroundTone": "light", "fontPreset": "modern", "buttonStyle": "soft"},
    "warm-home": {"primaryColor": "#8f5733", "backgroundTone": "warm", "fontPreset": "soft", "buttonStyle": "pill"},
    "pro": {"primaryColor": "#243873", "backgroundTone": "cool", "fontPreset": "modern", "buttonStyle": "soft"},
    "fresh-start": {"primaryColor": "#087e8b", "backgroundTone": "light", "fontPreset": "modern", "buttonStyle": "pill"},
    "signature": {"primaryColor": "#6f3b64", "backgroundTone": "warm", "fontPreset": "soft", "buttonStyle": "soft"},
    "eco-calm": {"primaryColor": "#4f6f52", "backgroundTone": "light", "fontPreset": "soft", "buttonStyle": "pill"},
    "move-ready": {"primaryColor": "#d05a37", "backgroundTone": "warm", "fontPreset": "modern", "buttonStyle": "soft"},
    "bright-home": {"primaryColor": "#b47b12", "backgroundTone": "light", "fontPreset": "modern", "buttonStyle": "pill"},
    "studio-luxe": {"primaryColor": "#29243b", "backgroundTone": "cool", "fontPreset": "soft", "buttonStyle": "soft"},
    "neighborly": {"primaryColor": "#a04455", "backgroundTone": "warm", "fontPreset": "soft", "buttonStyle": "pill"},
}


def template_theme(template: str) -> dict[str, str]:
    """Return a copy so partners never share mutable template configuration."""
    return TEMPLATE_THEMES.get(template, TEMPLATE_THEMES["clean"]).copy()
