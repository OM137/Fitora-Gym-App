import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Save a steps, weight, or hydration measurement for the caller.",
  schema: z.object({ metric: z.enum(["steps", "weight", "water", "waist", "chest", "hip"]), value: z.number().positive(), unit: z.enum(["steps", "kg", "L", "cm"]) }),
  run: async (input) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const [row] = await getDb().insert(schema.activityLogs).values({ id: crypto.randomUUID(), ownerEmail, ...input }).returning();
    return row;
  },
});
