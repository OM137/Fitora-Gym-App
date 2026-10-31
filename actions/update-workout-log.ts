import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Edit a workout owned by the caller.",
  schema: z.object({ id: z.string(), title: z.string().min(1).max(100).optional(), focus: z.string().min(1).max(40).optional(), durationMins: z.number().int().min(1).max(600).optional() }),
  run: async ({ id, ...patch }) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const [row] = await getDb().update(schema.workoutLogs).set(patch).where(and(eq(schema.workoutLogs.id, id), eq(schema.workoutLogs.ownerEmail, ownerEmail), eq(schema.workoutLogs.isDemo, false))).returning();
    if (!row) fail("Workout not found", { statusCode: 404 });
    return row;
  },
});
