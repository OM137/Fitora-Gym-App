import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "Like or unlike a visible community post for the caller.",
  schema: z.object({ postId: z.string(), liked: z.boolean() }),
  run: async ({ postId, liked }) => {
    const ownerEmail = getRequestUserEmail();
    if (!ownerEmail) fail("Not authenticated", { statusCode: 401 });
    const db = getDb();
    const [post] = await db.select().from(schema.communityPosts).where(eq(schema.communityPosts.id, postId)).limit(1);
    if (!post) fail("Post not found", { statusCode: 404 });
    const [group] = await db.select().from(schema.fitnessGroups).where(eq(schema.fitnessGroups.id, post.groupId)).limit(1);
    const [membership] = await db.select().from(schema.communityMemberships).where(and(eq(schema.communityMemberships.groupId, post.groupId), eq(schema.communityMemberships.ownerEmail, ownerEmail))).limit(1);
    if (group?.visibility === "private" && membership?.status !== "joined") fail("Join the private group before liking posts", { statusCode: 403 });
    const existing = await db.select().from(schema.communityLikes).where(and(eq(schema.communityLikes.postId, postId), eq(schema.communityLikes.ownerEmail, ownerEmail))).limit(1);
    if (liked && !existing[0]) await db.insert(schema.communityLikes).values({ id: crypto.randomUUID(), postId, ownerEmail });
    if (!liked && existing[0]) await db.delete(schema.communityLikes).where(eq(schema.communityLikes.id, existing[0].id));
    return { postId, liked };
  },
});
