import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "List the caller's workout logs and clearly marked demo workouts.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const email = getRequestUserEmail();
    if (!email) fail("Not authenticated", { statusCode: 401 });
    return getDb().select().from(schema.workoutLogs)
      .where(or(eq(schema.workoutLogs.ownerEmail, email), eq(schema.workoutLogs.isDemo, true)))
      .orderBy(desc(schema.workoutLogs.completedAt)).limit(100);
  },
});
