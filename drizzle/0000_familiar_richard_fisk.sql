CREATE TABLE "github_issues" (
	"id" integer PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"state" text NOT NULL,
	"author_login" text,
	"labels_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"html_url" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "github_pull_requests" (
	"id" integer PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"state" text NOT NULL,
	"author_login" text,
	"merged" integer DEFAULT 0 NOT NULL,
	"html_url" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"closed_at" timestamp,
	"merged_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "timeline_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"categories" text[] NOT NULL,
	"issues" integer DEFAULT 0 NOT NULL,
	"prs" integer DEFAULT 0 NOT NULL,
	"customer_facing" integer DEFAULT 0 NOT NULL,
	"platform_work" integer DEFAULT 0 NOT NULL,
	"impact" text NOT NULL,
	"deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"key_work" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "timeline_segments_slug_unique" UNIQUE("slug")
);
