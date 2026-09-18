import type { TemplateKey, ThemeConfig } from "@/lib/types";

export type TemplateLayout = "classic" | "warm" | "pro" | "split" | "editorial";

export type TemplateDefinition = {
  key: TemplateKey;
  title: string;
  description: string;
  layout: TemplateLayout;
  eyebrow: string;
  heroHeadline: string;
  servicesTitle: string;
  reviewTitle: string;
  intro?: string;
  theme: ThemeConfig;
};

export const TEMPLATE_CATALOG: TemplateDefinition[] = [
  {
    key: "clean",
    title: "Clean",
    description: "Clear and conversion-led for any local cleaner.",
    layout: "classic",
    eyebrow: "Local cleaning, made simple",
    heroHeadline: "Professional cleaning, made easy.",
    servicesTitle: "Services",
    reviewTitle: "Why customers choose us",
    intro: "Professional cleaning, made easy.",
    theme: {
      primaryColor: "#26573d",
      backgroundTone: "light",
      fontPreset: "modern",
      buttonStyle: "soft",
    },
  },
  {
    key: "warm-home",
    title: "Warm Home",
    description: "Friendly, reassuring, and made for homes.",
    layout: "warm",
    eyebrow: "Care for the place you call home",
    heroHeadline: "A clean home, without the stress.",
    servicesTitle: "Choose what you need",
    reviewTitle: "Loved by local families",
    theme: {
      primaryColor: "#8f5733",
      backgroundTone: "warm",
      fontPreset: "soft",
      buttonStyle: "pill",
    },
  },
  {
    key: "pro",
    title: "Pro",
    description: "Structured proof and confidence for growing teams.",
    layout: "pro",
    eyebrow: "Verified cleaning team",
    heroHeadline: "Reliable care, built around your schedule.",
    servicesTitle: "Services",
    reviewTitle: "Recent customer review",
    theme: {
      primaryColor: "#243873",
      backgroundTone: "cool",
      fontPreset: "modern",
      buttonStyle: "soft",
    },
  },
  {
    key: "fresh-start",
    title: "Fresh Start",
    description: "Crisp, airy energy for recurring home resets.",
    layout: "split",
    eyebrow: "More room to breathe",
    heroHeadline: "Come home to a fresh start.",
    servicesTitle: "Your reset, your way",
    reviewTitle: "Fresh starts customers remember",
    theme: {
      primaryColor: "#087e8b",
      backgroundTone: "light",
      fontPreset: "modern",
      buttonStyle: "pill",
    },
  },
  {
    key: "signature",
    title: "Signature",
    description: "An elevated editorial look for premium care.",
    layout: "editorial",
    eyebrow: "The thoughtful clean",
    heroHeadline: "Details make the difference.",
    servicesTitle: "Signature services",
    reviewTitle: "A note from a happy home",
    theme: {
      primaryColor: "#6f3b64",
      backgroundTone: "warm",
      fontPreset: "soft",
      buttonStyle: "soft",
    },
  },
  {
    key: "eco-calm",
    title: "Eco Calm",
    description: "Grounded, considered, and naturally reassuring.",
    layout: "split",
    eyebrow: "Mindful home care",
    heroHeadline: "A calmer kind of clean.",
    servicesTitle: "Mindful services",
    reviewTitle: "Care customers can feel",
    theme: {
      primaryColor: "#4f6f52",
      backgroundTone: "light",
      fontPreset: "soft",
      buttonStyle: "pill",
    },
  },
  {
    key: "move-ready",
    title: "Move Ready",
    description: "Bold clarity for move-in and move-out cleans.",
    layout: "pro",
    eyebrow: "Ready for what’s next",
    heroHeadline: "A clean handoff, handled.",
    servicesTitle: "Move-ready services",
    reviewTitle: "A smoother move, every time",
    theme: {
      primaryColor: "#d05a37",
      backgroundTone: "warm",
      fontPreset: "modern",
      buttonStyle: "soft",
    },
  },
  {
    key: "bright-home",
    title: "Bright Home",
    description: "Optimistic and approachable for everyday upkeep.",
    layout: "classic",
    eyebrow: "A brighter everyday",
    heroHeadline: "A little more light in every room.",
    servicesTitle: "Popular cleans",
    reviewTitle: "Bright reviews from real homes",
    intro: "Easy to book. Lovely to come home to.",
    theme: {
      primaryColor: "#b47b12",
      backgroundTone: "light",
      fontPreset: "modern",
      buttonStyle: "pill",
    },
  },
  {
    key: "studio-luxe",
    title: "Studio Luxe",
    description: "Quietly refined for concierge-level cleaning.",
    layout: "editorial",
    eyebrow: "Considered home care",
    heroHeadline: "Care with an eye for every detail.",
    servicesTitle: "Concierge services",
    reviewTitle: "The standard clients return for",
    theme: {
      primaryColor: "#29243b",
      backgroundTone: "cool",
      fontPreset: "soft",
      buttonStyle: "soft",
    },
  },
  {
    key: "neighborly",
    title: "Neighborly",
    description: "Personal, local, and full of community warmth.",
    layout: "warm",
    eyebrow: "A local clean you can trust",
    heroHeadline: "Good neighbors make life lighter.",
    servicesTitle: "How we can help",
    reviewTitle: "Loved around the neighborhood",
    theme: {
      primaryColor: "#a04455",
      backgroundTone: "warm",
      fontPreset: "soft",
      buttonStyle: "pill",
    },
  },
];

export function getTemplateDefinition(key: TemplateKey): TemplateDefinition {
  return (
    TEMPLATE_CATALOG.find((template) => template.key === key) ??
    TEMPLATE_CATALOG[0]
  );
}
