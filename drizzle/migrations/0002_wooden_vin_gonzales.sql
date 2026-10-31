CREATE TABLE "fitness_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_email" text NOT NULL,
	"display_name" text,
	"age" integer,
	"height_cm" real,
	"fitness_goal" text,
	"water_reminder_enabled" boolean DEFAULT false NOT NULL,
	"water_reminder_time" text DEFAULT '09:00' NOT NULL,
	"water_reminder_interval_hours" integer DEFAULT 2 NOT NULL,
	"meal_reminder_enabled" boolean DEFAULT false NOT NULL,
	"meal_reminder_time" text DEFAULT '12:00' NOT NULL,
	"meal_reminder_per_day" integer DEFAULT 3 NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "fitness_profiles_owner_email_unique" ON "fitness_profiles" USING btree ("owner_email");