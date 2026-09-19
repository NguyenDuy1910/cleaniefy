import { z } from "zod";

export const PortfolioCreateSchema = z.object({
  serviceId: z.string().trim().min(1).max(36),
  beforeImageUrl: z.string().min(1).max(1000),
  afterImageUrl: z.string().min(1).max(1000),
  caption: z.string().trim().max(300).nullable().optional(),
});
