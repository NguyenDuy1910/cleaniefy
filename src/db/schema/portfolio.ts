import { index, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { partners } from "./partners";
import { services } from "./services";

export const portfolioItems = pgTable("portfolio_items", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  partnerId: varchar("partner_id", { length: 36 })
    .notNull()
    .references(() => partners.id),
  serviceId: varchar("service_id", { length: 36 })
    .references(() => services.id, { onDelete: "set null" }),
  beforeImageUrl: varchar("before_image_url", { length: 1000 }).notNull(),
  afterImageUrl: varchar("after_image_url", { length: 1000 }).notNull(),
  caption: varchar("caption", { length: 300 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  index("ix_portfolio_items_partner_id").on(table.partnerId),
  index("ix_portfolio_items_service_id").on(table.serviceId),
]);
