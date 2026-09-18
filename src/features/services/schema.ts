import { z } from "zod";

export const ServiceCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).default(""),
  priceCents: z.number().int().min(0).max(10_000_000),
  durationMinutes: z.number().int().min(15).max(1_440),
  active: z.boolean().default(true),
});

export const ServiceUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(400).optional(),
    priceCents: z.number().int().min(0).max(10_000_000).optional(),
    durationMinutes: z.number().int().min(15).max(1_440).optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Choose a service value to update.");
