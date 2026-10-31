import { defineAction, fail } from "@agent-native/core/action";
import { getRequestUserEmail } from "@agent-native/core/server/request-context";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db.js";

export default defineAction({
  description: "List fitness groups, visible community posts, comments, likes, and the caller's group memberships.",
  schema: z.object({}),
  http: { method: "GET" },
  run: async () => {
    const email = getRequestUserEmail();
    if (!email) fail("Not authenticated", { statusCode: 401 });
    const db = getDb();
    const [groups, memberships] = await Promise.all([
      db.select().from(schema.fitnessGroups).orderBy(desc(schema.fitnessGroups.memberCount)),
      db.select().from(schema.communityMemberships).where(eq(schema.communityMemberships.ownerEmail, email)),
    ]);
    const visibleGroupIds = groups.filter((group) => group.visibility === "public" || memberships.some((membership) => membership.groupId === group.id && membership.status === "joined")).map((group) => group.id);
    const posts = visibleGroupIds.length ? await db.select().from(schema.communityPosts).where(inArray(schema.communityPosts.groupId, visibleGroupIds)).orderBy(desc(schema.communityPosts.createdAt)).limit(100) : [];
    const postIds = posts.map((post) => post.id);
    const [comments, likes] = postIds.length ? await Promise.all([
      db.select().from(schema.communityComments).where(inArray(schema.communityComments.postId, postIds)).orderBy(desc(schema.communityComments.createdAt)),
      db.select().from(schema.communityLikes).where(inArray(schema.communityLikes.postId, postIds)),
    ]) : [[], []];
    const likeCounts = Object.fromEntries(posts.map((post) => [post.id, likes.filter((like) => like.postId === post.id).length]));
    return {
      groups,
      posts: posts.map(({ id, groupId, authorName, content, createdAt, isDemo }) => ({ id, groupId, authorName, content, createdAt, isDemo })),
      comments: comments.map(({ id, postId, authorName, body, createdAt, isDemo }) => ({ id, postId, authorName, body, createdAt, isDemo })),
      likeCounts,
      myLikedPostIds: likes.filter((like) => like.ownerEmail === email).map((like) => like.postId),
      memberships: memberships.map(({ groupId, status }) => ({ groupId, status })),
    };
  },
});
