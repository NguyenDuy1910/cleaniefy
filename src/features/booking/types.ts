import type { Service } from "@/features/services/types";

export interface Availability {
  weekdays: number[];
  startTime: string;
  endTime: string;
  slotIntervalMinutes: number;
}

export interface BookingConfig {
  ctaLabel: string;
  requiredFields: {
    name: boolean;
    phone: boolean;
    email: boolean;
    address: boolean;
    notes: boolean;
  };
  paymentMode: "none" | "deposit" | "full";
  confirmationMessage: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  priceCents: number;
  status: string;
  service?: Service | null;
}

export interface BookingPayload {
  serviceId: string;
  scheduledStart: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
}
