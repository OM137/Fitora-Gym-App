CREATE TABLE "community_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"owner_email" text NOT NULL,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_likes" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"owner_email" text NOT NULL,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"owner_email" text NOT NULL,
	"status" text DEFAULT 'joined' NOT NULL,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"owner_email" text NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"visibility" text NOT NULL,
	"description" text NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
INSERT INTO "fitness_groups" ("id", "name", "category", "visibility", "description", "member_count", "is_demo") VALUES
  ('tt-gym-group', 'TT Fit App Gym Crew', 'Gym group', 'public', 'Your local gym community and weekly training announcements.', 126, true),
  ('tt-beginners', 'Beginner Strength Club', 'Beginner', 'public', 'Build confidence with approachable strength training.', 842, true),
  ('tt-muscle', 'Muscle Building Lab', 'Muscle building', 'public', 'Share training splits, consistency wins, and recovery tips.', 1240, true),
  ('tt-fat-loss', 'Fat Loss Together', 'Fat loss', 'private', 'Supportive habits and sustainable progress, without quick-fix claims.', 638, true),
  ('tt-strength', 'Strength & Barbell', 'Strength', 'public', 'Technique discussions and progressive training ideas.', 906, true),
  ('tt-global', 'Global Fitness Community', 'Global fitness', 'public', 'A worldwide demo directory for training conversations.', 4102, true);
--> statement-breakpoint
INSERT INTO "community_posts" ("id", "group_id", "owner_email", "author_name", "content", "is_demo") VALUES
  ('tt-post-1', 'tt-gym-group', 'sample@ttfit.app', 'Demo member · Priya', 'Logged three consistent sessions this week. Small wins really add up.', true),
  ('tt-post-2', 'tt-beginners', 'sample@ttfit.app', 'Demo member · Sam', 'Beginner tip: start lighter than you think, then focus on a steady range of motion.', true),
  ('tt-post-3', 'tt-strength', 'sample@ttfit.app', 'Demo member · Jordan', 'What recovery habit has helped you stay consistent between sessions?', true);
--> statement-breakpoint
INSERT INTO "community_comments" ("id", "post_id", "owner_email", "author_name", "body", "is_demo") VALUES
  ('tt-comment-1', 'tt-post-1', 'sample@ttfit.app', 'Demo member · Alex', 'Consistency over perfection.', true),
  ('tt-comment-2', 'tt-post-2', 'sample@ttfit.app', 'Demo member · Lee', 'A warm-up and controlled reps make a big difference.', true);
