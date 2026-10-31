CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_email" text NOT NULL,
	"metric" text NOT NULL,
	"value" real NOT NULL,
	"unit" text NOT NULL,
	"logged_at" text DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_email" text NOT NULL,
	"title" text NOT NULL,
	"meal_type" text NOT NULL,
	"calories" integer NOT NULL,
	"protein" real DEFAULT 0 NOT NULL,
	"carbs" real DEFAULT 0 NOT NULL,
	"fats" real DEFAULT 0 NOT NULL,
	"logged_at" text DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_email" text NOT NULL,
	"title" text NOT NULL,
	"focus" text NOT NULL,
	"duration_mins" integer NOT NULL,
	"completed_at" text DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO "workout_logs" ("id", "owner_email", "title", "focus", "duration_mins", "is_demo") VALUES
  ('demo-workout-1', 'demo@sharksgym.app', 'Upper body strength', 'Strength', 46, true),
  ('demo-workout-2', 'demo@sharksgym.app', 'Leg day foundations', 'Lower body', 52, true),
  ('demo-workout-3', 'demo@sharksgym.app', 'Full-body conditioning', 'Conditioning', 34, true);
--> statement-breakpoint
INSERT INTO "meal_logs" ("id", "owner_email", "title", "meal_type", "calories", "protein", "carbs", "fats", "is_demo") VALUES
  ('demo-meal-1', 'demo@sharksgym.app', 'Oats, banana & whey', 'Breakfast', 420, 32, 58, 9, true),
  ('demo-meal-2', 'demo@sharksgym.app', 'Grilled chicken bowl', 'Lunch', 610, 48, 66, 16, true),
  ('demo-meal-3', 'demo@sharksgym.app', 'Greek yogurt & berries', 'Snack', 220, 20, 28, 4, true);
--> statement-breakpoint
INSERT INTO "activity_logs" ("id", "owner_email", "metric", "value", "unit", "is_demo") VALUES
  ('demo-activity-1', 'demo@sharksgym.app', 'steps', 7840, 'steps', true),
  ('demo-activity-2', 'demo@sharksgym.app', 'weight', 74.2, 'kg', true),
  ('demo-activity-3', 'demo@sharksgym.app', 'water', 1.8, 'L', true);
