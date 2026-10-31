import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Comment on a visible fitness community post.",
  schema: z.object({ postId: z.string(), body: z.string().trim().min(1).max(500) }),
  run: async ({ postId, body }) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const db = getDb();
    const [post] = await db.select().from(schema.communityPosts).where(eq(schema.communityPosts.id, postId)).limit(1);
    if (!post) fail("Post not found", { statusCode: 404 });
    const [group] = await db.select().from(schema.fitnessGroups).where(eq(schema.fitnessGroups.id, post.groupId)).limit(1);
    const [membership] = await db.select().from(schema.communityMemberships).where(and(eq(schema.communityMemberships.groupId, post.groupId), eq(schema.communityMemberships.ownerEmail, ownerEmail))).limit(1);
    if (group?.visibility === "private" && membership?.status !== "joined") fail("Join the private group before commenting", { statusCode: 403 });
    const [row] = await db.insert(schema.communityComments).values({ id: crypto.randomUUID(), postId, ownerEmail, authorName: ownerEmail.split("@")[0] ?? "Member", body }).returning();
    return row;
  },
});
