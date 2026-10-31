import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export default defineAction({
  description: "Save the signed-in user's personal, role-specific, and reminder profile details.",
  schema: z.object({
    displayName: z.string().trim().max(80).nullable().optional(),
    age: z.number().int().min(1).max(120).nullable().optional(),
    heightCm: z.number().min(50).max(260).nullable().optional(),
    fitnessGoal: z.string().trim().max(160).nullable().optional(),
    contactEmail: z.string().trim().email().max(254).nullable().optional(),
    contactPhone: z.string().trim().max(40).nullable().optional(),
    profilePhotoUrl: z.string().url().max(2048).nullable().optional(),
    specialization: z.string().trim().max(160).nullable().optional(),
    qualifications: z.string().trim().max(500).nullable().optional(),
    experienceYears: z.number().int().min(0).max(80).nullable().optional(),
    professionalDetails: z.string().trim().max(1000).nullable().optional(),
    gymName: z.string().trim().max(160).nullable().optional(),
    gymAddress: z.string().trim().max(500).nullable().optional(),
    businessDetails: z.string().trim().max(1000).nullable().optional(),
    administratorDetails: z.string().trim().max(1000).nullable().optional(),
    waterReminderEnabled: z.boolean().optional(),
    waterReminderTime: z.string().regex(timePattern).optional(),
    waterReminderIntervalHours: z.number().int().min(1).max(6).optional(),
    mealReminderEnabled: z.boolean().optional(),
    mealReminderTime: z.string().regex(timePattern).optional(),
    mealReminderPerDay: z.number().int().min(1).max(8).optional(),
  }),
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const now = new Date().toISOString();
    const [profile] = await getDb().insert(schema.fitnessProfiles)
      .values({ id: crypto.randomUUID(), ownerEmail, ...input, updatedAt: now })
      .onConflictDoUpdate({
        target: schema.fitnessProfiles.ownerEmail,
        set: { ...input, updatedAt: now },
      })
      .returning();
    return profile;
  },
});
