import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Save a completed workout for the caller.",
  schema: z.object({ title: z.string().min(1).max(100), focus: z.string().min(1).max(40), durationMins: z.number().int().min(1).max(600) }),
  run: async ({ title, focus, durationMins }) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const [row] = await getDb().insert(schema.workoutLogs).values({ id: crypto.randomUUID(), ownerEmail, title: title.trim(), focus, durationMins }).returning();
    return row;
  },
});
