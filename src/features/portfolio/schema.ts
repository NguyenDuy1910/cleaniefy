import { z } from "zod";

export const PortfolioCreateSchema = z.object({
  beforeImageUrl: z.string().min(1).max(1000),
  afterImageUrl: z.string().min(1).max(1000),
  caption: z.string().trim().max(300).nullable().optional(),
});
