import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";

export const create = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    role: v.union(v.literal("assistant"), v.literal("user")),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    if (!args.content.trim()) {
      throw new Error("Content is missing");
    }

    const conversation = await ctx.db.get("conversations", args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const project = await ctx.db.get("projects", conversation.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    const now = Date.now();

    const message = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      projectId: project._id,
      content: args.content.trim(),
      role: args.role,
      status: args.status,
      updatedAt: now,
    });

    await Promise.all([
      ctx.db.patch("conversations", args.conversationId, {
        updatedAt: now,
      }),

      ctx.db.patch("projects", project._id, {
        updatedAt: now,
      }),
    ]);

    return message;
  },
});

export const getAll = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const conversation = await ctx.db.get("conversations", args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const project = await ctx.db.get("projects", conversation.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();

    return messages;
  },
});
