import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Create a post in a public or joined fitness group.",
  schema: z.object({ groupId: z.string(), content: z.string().trim().min(1).max(1200) }),
  run: async ({ groupId, content }) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const db = getDb();
    const [group] = await db.select().from(schema.fitnessGroups).where(eq(schema.fitnessGroups.id, groupId)).limit(1);
    if (!group) fail("Group not found", { statusCode: 404 });
    if (group.visibility === "private") {
      const [membership] = await db.select().from(schema.communityMemberships).where(and(eq(schema.communityMemberships.ownerEmail, ownerEmail), eq(schema.communityMemberships.groupId, groupId))).limit(1);
      if (!membership || membership.groupId !== groupId || membership.status !== "joined") fail("Join the private group before posting", { statusCode: 403 });
    }
    const [row] = await db.insert(schema.communityPosts).values({ id: crypto.randomUUID(), groupId, ownerEmail, authorName: ownerEmail.split("@")[0] ?? "Member", content }).returning();
    return row;
  },
});
