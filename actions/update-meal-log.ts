import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Edit a meal owned by the caller.",
  schema: z.object({ id: z.string(), title: z.string().min(1).max(100).optional(), mealType: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]).optional(), calories: z.number().int().min(0).max(10000).optional(), protein: z.number().min(0).max(1000).optional(), carbs: z.number().min(0).max(1000).optional(), fats: z.number().min(0).max(1000).optional() }),
  run: async ({ id, ...patch }) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const [row] = await getDb().update(schema.mealLogs).set(patch).where(and(eq(schema.mealLogs.id, id), eq(schema.mealLogs.ownerEmail, ownerEmail), eq(schema.mealLogs.isDemo, false))).returning();
    if (!row) fail("Meal not found", { statusCode: 404 });
    return row;
  },
});
