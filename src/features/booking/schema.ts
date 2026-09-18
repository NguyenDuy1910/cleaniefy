import { z } from "zod";
import type { BookingConfig, BookingPayload } from "./types";

export const AvailabilitySchema = z
  .object({
    weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    slotIntervalMinutes: z.number().int().min(15).max(240),
  })
  .superRefine((value, context) => {
    if (new Set(value.weekdays).size !== value.weekdays.length) {
      context.addIssue({ code: "custom", message: "Choose each weekday at most once.", path: ["weekdays"] });
    }
    if (value.endTime <= value.startTime) {
      context.addIssue({ code: "custom", message: "End time must be after start time.", path: ["endTime"] });
    }
  })
  .transform((value) => ({ ...value, weekdays: [...value.weekdays].sort() }));

export const BookingConfigSchema = z.object({
  ctaLabel: z.string().trim().min(2).max(80),
  requiredFields: z.object({
    name: z.literal(true),
    phone: z.boolean(),
    email: z.boolean(),
    address: z.boolean(),
    notes: z.boolean(),
  }),
  paymentMode: z.enum(["none", "deposit", "full"]),
  confirmationMessage: z.string().trim().min(2).max(300),
});

export const CreatePublicBookingSchema = z.object({
  serviceId: z.string().uuid(),
  scheduledStart: z.coerce.date(),
  customerName: z.string().trim().min(2).max(140),
  customerPhone: z.string().trim().max(80).optional(),
  customerEmail: z.string().trim().email().max(255).optional(),
  customerAddress: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(4_000).optional(),
});

export const PublicAvailabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date."),
  serviceId: z.string().uuid().optional(),
});

export function requiredBookingFieldError(config: BookingConfig, input: Pick<BookingPayload, "customerPhone" | "customerEmail" | "customerAddress" | "notes">): string | null {
  const requiredValues = {
    phone: input.customerPhone,
    email: input.customerEmail,
    address: input.customerAddress,
    notes: input.notes,
  };
  for (const [field, value] of Object.entries(requiredValues)) {
    if (config.requiredFields[field as keyof typeof requiredValues] && !value?.trim()) {
      return `${field[0]?.toUpperCase()}${field.slice(1)} is required for this booking.`;
    }
  }
  return null;
}
