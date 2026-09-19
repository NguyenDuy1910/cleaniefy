CREATE TABLE "bookings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"partner_id" varchar(36) NOT NULL,
	"service_id" varchar(36) NOT NULL,
	"customer_name" varchar(140) NOT NULL,
	"customer_phone" varchar(80),
	"customer_email" varchar(255),
	"customer_address" varchar(500),
	"notes" text,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"price_cents" integer NOT NULL,
	"status" varchar(20) DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "uq_booking_partner_slot" UNIQUE("partner_id","scheduled_start")
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"partner_id" varchar(36) PRIMARY KEY NOT NULL,
	"weekdays" json NOT NULL,
	"start_time" varchar(5) DEFAULT '09:00' NOT NULL,
	"end_time" varchar(5) DEFAULT '17:00' NOT NULL,
	"slot_interval_minutes" integer DEFAULT 60 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_config" (
	"partner_id" varchar(36) PRIMARY KEY NOT NULL,
	"cta_label" varchar(80) DEFAULT 'Book a cleaning' NOT NULL,
	"required_fields" json NOT NULL,
	"payment_mode" varchar(20) DEFAULT 'none' NOT NULL,
	"confirmation_message" varchar(300) DEFAULT 'Your request is in. We’ll be in touch shortly.' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_site_config" (
	"partner_id" varchar(36) PRIMARY KEY NOT NULL,
	"template" varchar(30) DEFAULT 'clean' NOT NULL,
	"theme_config" json NOT NULL,
	"sections_config" json NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"owner_user_id" varchar(36) NOT NULL,
	"business_name" varchar(140) NOT NULL,
	"slug" varchar(40) NOT NULL,
	"tagline" varchar(240) DEFAULT 'Thoughtful cleaning, made easy.' NOT NULL,
	"service_area" varchar(160) DEFAULT 'Your local area' NOT NULL,
	"profile_image_url" varchar(1000),
	"hero_image_url" varchar(1000),
	"about" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "partners_owner_user_id_unique" UNIQUE("owner_user_id"),
	CONSTRAINT "partners_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"partner_id" varchar(36) NOT NULL,
	"before_image_url" varchar(1000) NOT NULL,
	"after_image_url" varchar(1000) NOT NULL,
	"caption" varchar(300),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"partner_id" varchar(36) NOT NULL,
	"author" varchar(140) NOT NULL,
	"rating" integer NOT NULL,
	"text" text NOT NULL,
	"source" varchar(20) DEFAULT 'manual' NOT NULL,
	"source_url" varchar(1000),
	"featured" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"partner_id" varchar(36) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" varchar(400) DEFAULT '' NOT NULL,
	"price_cents" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_config" ADD CONSTRAINT "booking_config_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_site_config" ADD CONSTRAINT "partner_site_config_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_bookings_partner_id" ON "bookings" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "ix_bookings_service_id" ON "bookings" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "ix_bookings_scheduled_start" ON "bookings" USING btree ("scheduled_start");--> statement-breakpoint
CREATE INDEX "ix_bookings_scheduled_end" ON "bookings" USING btree ("scheduled_end");--> statement-breakpoint
CREATE INDEX "ix_partners_status" ON "partners" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ix_portfolio_items_partner_id" ON "portfolio_items" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "ix_reviews_partner_id" ON "reviews" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "ix_services_partner_id" ON "services" USING btree ("partner_id");