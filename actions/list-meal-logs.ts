import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { desc, eq, or } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "List the caller's meals and clearly marked demo meals.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const email = getRequestUserEmail();
    if (!email) fail("Not authenticated", { statusCode: 401 });
    return getDb().select().from(schema.mealLogs)
      .where(or(eq(schema.mealLogs.ownerEmail, email), eq(schema.mealLogs.isDemo, true)))
      .orderBy(desc(schema.mealLogs.loggedAt)).limit(100);
  },
});
