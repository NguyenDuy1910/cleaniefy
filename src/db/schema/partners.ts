import {
  boolean,
  integer,
  index,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

const newId = () => crypto.randomUUID();

export type ThemeConfigRecord = {
  primaryColor: string;
  backgroundTone: "light" | "warm" | "cool";
  fontPreset: "modern" | "soft";
  buttonStyle: "soft" | "pill";
};

export type SectionsConfigRecord = {
  services: boolean;
  portfolio: boolean;
  reviews: boolean;
  about: boolean;
};

export type RequiredFieldsRecord = {
  name: boolean;
  phone: boolean;
  email: boolean;
  address: boolean;
  notes: boolean;
};

export const partners = pgTable(
  "partners",
  {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(newId),
    ownerUserId: varchar("owner_user_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => users.id),
    businessName: varchar("business_name", { length: 140 }).notNull(),
    serviceCategory: varchar("service_category", { length: 80 }).notNull().default("Home Cleaner"),
    slug: varchar("slug", { length: 40 }).notNull().unique(),
    tagline: varchar("tagline", { length: 240 })
      .notNull()
      .default("Thoughtful cleaning, made easy."),
    serviceArea: varchar("service_area", { length: 160 })
      .notNull()
      .default("Your local area"),
    profileImageUrl: varchar("profile_image_url", { length: 1000 }),
    heroImageUrl: varchar("hero_image_url", { length: 1000 }),
    instagramUrl: varchar("instagram_url", { length: 1000 }),
    about: text("about"),
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("ix_partners_status").on(table.status)],
);

export const partnerSiteConfig = pgTable("partner_site_config", {
  partnerId: varchar("partner_id", { length: 36 })
    .primaryKey()
    .references(() => partners.id),
  template: varchar("template", { length: 30 }).notNull().default("clean"),
  themeConfig: json("theme_config").$type<ThemeConfigRecord>().notNull(),
  sectionsConfig: json("sections_config")
    .$type<SectionsConfigRecord>()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const availabilityRules = pgTable("availability_rules", {
  partnerId: varchar("partner_id", { length: 36 })
    .primaryKey()
    .references(() => partners.id),
  weekdays: json("weekdays").$type<number[]>().notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull().default("09:00"),
  endTime: varchar("end_time", { length: 5 }).notNull().default("17:00"),
  slotIntervalMinutes: integer("slot_interval_minutes").notNull().default(60),
});

export const bookingConfig = pgTable("booking_config", {
  partnerId: varchar("partner_id", { length: 36 })
    .primaryKey()
    .references(() => partners.id),
  ctaLabel: varchar("cta_label", { length: 80 })
    .notNull()
    .default("Book a cleaning"),
  requiredFields: json("required_fields")
    .$type<RequiredFieldsRecord>()
    .notNull(),
  paymentMode: varchar("payment_mode", { length: 20 })
    .notNull()
    .default("none"),
  confirmationMessage: varchar("confirmation_message", { length: 300 })
    .notNull()
    .default("Your request is in. We’ll be in touch shortly."),
});
