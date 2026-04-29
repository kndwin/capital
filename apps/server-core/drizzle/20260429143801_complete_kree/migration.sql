ALTER TABLE "company_source" ADD COLUMN "status" text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE "company_source" ADD COLUMN "url" text;--> statement-breakpoint
ALTER TABLE "company_source" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "company_source" ADD COLUMN "file_url" text;--> statement-breakpoint
ALTER TABLE "company_source" ADD COLUMN "acquired_provider" text;--> statement-breakpoint
ALTER TABLE "company_source" ADD COLUMN "acquired_text" text;--> statement-breakpoint
ALTER TABLE "company_source" ADD COLUMN "acquired_text_truncated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "company_source" ADD COLUMN "acquired_text_char_count" integer;--> statement-breakpoint
ALTER TABLE "company_source" ADD COLUMN "acquired_text_hash" text;--> statement-breakpoint
ALTER TABLE "company_source" ADD COLUMN "error" text;
