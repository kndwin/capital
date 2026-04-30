CREATE TABLE "company_watch_target" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"kind" text DEFAULT 'web_page' NOT NULL,
	"locator" text NOT NULL,
	"url" text,
	"title" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_scanned_at" timestamp,
	"last_matched_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
