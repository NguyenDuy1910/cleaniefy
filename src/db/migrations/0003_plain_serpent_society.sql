ALTER TABLE "portfolio_items" ADD COLUMN "service_id" varchar(36);--> statement-breakpoint
UPDATE "portfolio_items" AS "portfolio"
SET "service_id" = (
	SELECT "service"."id"
	FROM "services" AS "service"
	WHERE "service"."partner_id" = "portfolio"."partner_id"
	ORDER BY "service"."sort_order", "service"."id"
	LIMIT 1
)
WHERE "portfolio"."service_id" IS NULL;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_portfolio_items_service_id" ON "portfolio_items" USING btree ("service_id");
