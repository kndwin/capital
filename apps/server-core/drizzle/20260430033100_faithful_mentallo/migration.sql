CREATE TABLE IF NOT EXISTS "company_memo" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"narrative" jsonb NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_watch_target" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'web_page' NOT NULL;--> statement-breakpoint
ALTER TABLE "company_watch_target" ADD COLUMN IF NOT EXISTS "locator" text;--> statement-breakpoint
UPDATE "company_watch_target" SET "locator" = "url" WHERE "locator" IS NULL;--> statement-breakpoint
ALTER TABLE "company_watch_target" ALTER COLUMN "locator" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "company_watch_target" ALTER COLUMN "url" DROP NOT NULL;
