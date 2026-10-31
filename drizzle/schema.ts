// App tables live here, defined with Drizzle's PostgreSQL builders. Local dev
// runs them on PGlite and hosted deploys on Postgres.
//
// After editing this file, run `pnpm db:generate` and restart the dev server
// (see `drizzle/START_HERE.md`). Example table, private to its creator unless
// shared (see the `sharing` skill) — uncomment and adapt:
//
// import { sql } from "drizzle-orm";
// import { boolean, pgTable, text } from "drizzle-orm/pg-core";
// import {
//   createSharesTable,
//   ownableColumns,
// } from "@agent-native/core/db/schema";
//
// export const notes = pgTable("notes", {
//   id: text("id").primaryKey(),
//   title: text("title").notNull(),
//   body: text("body").notNull().default(""),
//   archived: boolean("archived").notNull().default(false),
//   createdAt: text("created_at").notNull().default(sql`now()`),
//   updatedAt: text("updated_at").notNull().default(sql`now()`),
//   ...ownableColumns(),
// });
//
// export const noteShares = createSharesTable("note_shares");

import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, real, text, uniqueIndex } from "drizzle-orm/pg-core";

export const workoutLogs = pgTable("workout_logs", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  title: text("title").notNull(),
  focus: text("focus").notNull(),
  durationMins: integer("duration_mins").notNull(),
  completedAt: text("completed_at").notNull().default(sql`now()`),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const mealLogs = pgTable("meal_logs", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  title: text("title").notNull(),
  mealType: text("meal_type").notNull(),
  calories: integer("calories").notNull(),
  protein: real("protein").notNull().default(0),
  carbs: real("carbs").notNull().default(0),
  fats: real("fats").notNull().default(0),
  loggedAt: text("logged_at").notNull().default(sql`now()`),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const activityLogs = pgTable("activity_logs", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  metric: text("metric").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  loggedAt: text("logged_at").notNull().default(sql`now()`),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const fitnessGroups = pgTable("fitness_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  visibility: text("visibility").notNull(),
  description: text("description").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const communityPosts = pgTable("community_posts", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const communityComments = pgTable("community_comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const communityLikes = pgTable("community_likes", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const communityMemberships = pgTable("community_memberships", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  status: text("status").notNull().default("joined"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const fitnessProfiles = pgTable("fitness_profiles", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  displayName: text("display_name"),
  age: integer("age"),
  heightCm: real("height_cm"),
  fitnessGoal: text("fitness_goal"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  profilePhotoUrl: text("profile_photo_url"),
  specialization: text("specialization"),
  qualifications: text("qualifications"),
  experienceYears: integer("experience_years"),
  professionalDetails: text("professional_details"),
  gymName: text("gym_name"),
  gymAddress: text("gym_address"),
  businessDetails: text("business_details"),
  administratorDetails: text("administrator_details"),
  waterReminderEnabled: boolean("water_reminder_enabled").notNull().default(false),
  waterReminderTime: text("water_reminder_time").notNull().default("09:00"),
  waterReminderIntervalHours: integer("water_reminder_interval_hours").notNull().default(2),
  mealReminderEnabled: boolean("meal_reminder_enabled").notNull().default(false),
  mealReminderTime: text("meal_reminder_time").notNull().default("12:00"),
  mealReminderPerDay: integer("meal_reminder_per_day").notNull().default(3),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
}, (table) => [uniqueIndex("fitness_profiles_owner_email_unique").on(table.ownerEmail)]);
