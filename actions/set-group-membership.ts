import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Join or leave a public fitness group, or request access to a private group.",
  schema: z.object({ groupId: z.string(), joined: z.boolean() }),
  run: async ({ groupId, joined }) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const db = getDb();
    const [group] = await db.select().from(schema.fitnessGroups).where(eq(schema.fitnessGroups.id, groupId)).limit(1);
    if (!group) fail("Group not found", { statusCode: 404 });
    const existing = await db.select().from(schema.communityMemberships).where(and(eq(schema.communityMemberships.groupId, groupId), eq(schema.communityMemberships.ownerEmail, ownerEmail))).limit(1);
    if (!joined) {
      if (existing[0]) await db.delete(schema.communityMemberships).where(eq(schema.communityMemberships.id, existing[0].id));
      return { groupId, status: "left" };
    }
    const status = group.visibility === "private" ? "requested" : "joined";
    if (existing[0]) {
      await db.update(schema.communityMemberships).set({ status }).where(eq(schema.communityMemberships.id, existing[0].id));
    } else {
      await db.insert(schema.communityMemberships).values({ id: crypto.randomUUID(), groupId, ownerEmail, status });
    }
    return { groupId, status };
  },
});
