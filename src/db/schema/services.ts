import { boolean, index, integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { partners } from "./partners";

export const services = pgTable("services", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  partnerId: varchar("partner_id", { length: 36 })
    .notNull()
    .references(() => partners.id),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 400 }).notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [index("ix_services_partner_id").on(table.partnerId)]);
