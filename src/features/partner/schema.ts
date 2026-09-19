import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const optionalInstagramUrl = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.union([
    z.null(),
    z.string().trim().max(1000).url().refine((value) => {
      const hostname = new URL(value).hostname.toLowerCase();
      return hostname === "instagram.com" || hostname === "www.instagram.com";
    }, "Enter a valid Instagram profile link."),
  ]).optional(),
);

export const ThemeConfigSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Choose a valid six-digit color."),
  backgroundTone: z.enum(["light", "warm", "cool"]),
  fontPreset: z.enum(["modern", "soft"]),
  buttonStyle: z.enum(["soft", "pill"]),
});

export const PartnerProfileSchema = z
  .object({
    businessName: z.string().trim().min(2).max(140).optional(),
    serviceCategory: z.enum(["Home Cleaner", "Office Cleaner", "Airbnb Cleaner", "Car Detailer", "Window Cleaner", "Carpet Cleaner", "Other"]).optional(),
    slug: z.string().trim().max(80).optional(),
    tagline: optionalText(240),
    serviceArea: optionalText(160),
    profileImageUrl: z.string().max(1000).nullable().optional(),
    heroImageUrl: z.string().max(1000).nullable().optional(),
    instagramUrl: optionalInstagramUrl,
    about: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Add at least one value to update your profile.");

export const ThemeUpdateSchema = z.object({ theme: ThemeConfigSchema });

export const SectionsConfigSchema = z.object({
  services: z.boolean(),
  portfolio: z.boolean(),
  reviews: z.boolean(),
  about: z.boolean(),
});

export const SignUpSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  businessName: z.string().trim().min(2).max(140),
});

export const LoginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});
