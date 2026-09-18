import { z } from "zod";

export const ReviewCreateSchema = z.object({
  author: z.string().trim().min(2).max(140),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(2).max(4_000),
  source: z.enum(["google", "manual"]).default("manual"),
  sourceUrl: z.string().url().max(1000).nullable().optional(),
  featured: z.boolean().default(false),
});
