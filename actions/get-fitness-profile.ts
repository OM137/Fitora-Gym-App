import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Read the signed-in member's personal fitness profile and reminder preferences.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const [profile] = await getDb().select().from(schema.fitnessProfiles)
      .where(eq(schema.fitnessProfiles.ownerEmail, ownerEmail)).limit(1);
    return profile ?? null;
  },
});
