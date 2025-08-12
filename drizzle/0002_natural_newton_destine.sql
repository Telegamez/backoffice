CREATE TABLE "segment_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
