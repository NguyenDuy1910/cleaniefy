import {
  integer,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { partners } from "./partners";
import { services } from "./services";

export const bookings = pgTable(
  "bookings",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    partnerId: varchar("partner_id", { length: 36 })
      .notNull()
      .references(() => partners.id),
    serviceId: varchar("service_id", { length: 36 })
      .notNull()
      .references(() => services.id),
    customerName: varchar("customer_name", { length: 140 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 80 }),
    customerEmail: varchar("customer_email", { length: 255 }),
    customerAddress: varchar("customer_address", { length: 500 }),
    notes: text("notes"),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true }).notNull(),
    scheduledEnd: timestamp("scheduled_end", { withTimezone: true }).notNull(),
    priceCents: integer("price_cents").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("confirmed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    unique("uq_booking_partner_slot").on(table.partnerId, table.scheduledStart),
    index("ix_bookings_partner_id").on(table.partnerId),
    index("ix_bookings_service_id").on(table.serviceId),
    index("ix_bookings_scheduled_start").on(table.scheduledStart),
    index("ix_bookings_scheduled_end").on(table.scheduledEnd),
  ],
);
