import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { desc, eq, or } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "List the caller's activity measurements and clearly marked demo measurements.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const email = getRequestUserEmail();
    if (!email) fail("Not authenticated", { statusCode: 401 });
    return getDb().select().from(schema.activityLogs)
      .where(or(eq(schema.activityLogs.ownerEmail, email), eq(schema.activityLogs.isDemo, true)))
      .orderBy(desc(schema.activityLogs.loggedAt)).limit(100);
  },
});
