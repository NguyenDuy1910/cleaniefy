import { z } from "zod";
import { TEMPLATE_KEYS } from "@/lib/types";

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const ThemeConfigSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Choose a valid six-digit color."),
  backgroundTone: z.enum(["light", "warm", "cool"]),
  fontPreset: z.enum(["modern", "soft"]),
  buttonStyle: z.enum(["soft", "pill"]),
});

export const PartnerProfileSchema = z
  .object({
    businessName: z.string().trim().min(2).max(140).optional(),
    slug: z.string().trim().max(80).optional(),
    tagline: optionalText(240),
    serviceArea: optionalText(160),
    profileImageUrl: z.string().max(1000).nullable().optional(),
    heroImageUrl: z.string().max(1000).nullable().optional(),
    about: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Add at least one value to update your profile.");

export const ThemeUpdateSchema = z
  .object({
    template: z.enum(TEMPLATE_KEYS).optional(),
    theme: ThemeConfigSchema.optional(),
  })
  .refine((value) => value.template !== undefined || value.theme !== undefined, "Choose a template or theme setting.");

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
