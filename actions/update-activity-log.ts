import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Edit an activity measurement owned by the caller.",
  schema: z.object({ id: z.string(), metric: z.enum(["steps", "weight", "water", "waist", "chest", "hip"]).optional(), value: z.number().positive().optional(), unit: z.enum(["steps", "kg", "L", "cm"]).optional() }),
  run: async ({ id, ...patch }) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const [row] = await getDb().update(schema.activityLogs).set(patch).where(and(eq(schema.activityLogs.id, id), eq(schema.activityLogs.ownerEmail, ownerEmail), eq(schema.activityLogs.isDemo, false))).returning();
    if (!row) fail("Activity record not found", { statusCode: 404 });
    return row;
  },
});
