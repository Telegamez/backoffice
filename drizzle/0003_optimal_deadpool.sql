CREATE TABLE "user_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"provider_id" text NOT NULL,
	"credentials_encrypted" text NOT NULL,
	"scopes" text[] NOT NULL,
	"expires_at" timestamp,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
