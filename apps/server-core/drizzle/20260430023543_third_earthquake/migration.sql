CREATE TABLE "company_application_invite" (
	"id" text PRIMARY KEY,
	"token_hash" text NOT NULL UNIQUE,
	"status" text DEFAULT 'open' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"submitted_company_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
