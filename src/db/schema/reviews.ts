import { boolean, index, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { partners } from "./partners";

export const reviews = pgTable("reviews", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  partnerId: varchar("partner_id", { length: 36 })
    .notNull()
    .references(() => partners.id),
  author: varchar("author", { length: 140 }).notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  source: varchar("source", { length: 20 }).notNull().default("manual"),
  sourceUrl: varchar("source_url", { length: 1000 }),
  featured: boolean("featured").notNull().default(false),
}, (table) => [index("ix_reviews_partner_id").on(table.partnerId)]);
