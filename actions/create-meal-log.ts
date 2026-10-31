import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Save a meal and its estimated nutrition for the caller.",
  schema: z.object({ title: z.string().min(1).max(100), mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]), calories: z.number().int().min(0).max(10000), protein: z.number().min(0).max(1000), carbs: z.number().min(0).max(1000), fats: z.number().min(0).max(1000) }),
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const [row] = await getDb().insert(schema.mealLogs).values({ id: crypto.randomUUID(), ownerEmail, ...input, title: input.title.trim() }).returning();
    return row;
  },
});
