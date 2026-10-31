import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Delete an activity measurement owned by the caller.",
  schema: z.object({ id: z.string() }),
  http: { method: "DELETE" },
  run: async ({ id }) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const [row] = await getDb().delete(schema.activityLogs).where(and(eq(schema.activityLogs.id, id), eq(schema.activityLogs.ownerEmail, ownerEmail), eq(schema.activityLogs.isDemo, false))).returning();
    if (!row) fail("Activity record not found", { statusCode: 404 });
    return row;
  },
});
