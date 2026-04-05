import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    const conversationId = await ctx.db.insert("conversations", {
      projectId: args.projectId,
      title: "New Conversation",
      updatedAt: Date.now(),
    });

    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

export const getAll = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_project_updatedAt", (q) =>
        q.eq("projectId", args.projectId),
      )
      .order("desc")
      .collect();

    return conversations;
  },
});

export const rename = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    if (!args.title.trim()) {
      throw new Error("title is missing");
    }

    const conversation = await ctx.db.get("conversations", args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.title === args.title.trim()) return;

    const project = await ctx.db.get("projects", conversation.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    await ctx.db.patch("conversations", args.conversationId, {
      title: args.title.trim(),
    });
  },
});

export const remove = mutation({
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

    await ctx.db.delete("conversations", args.conversationId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    await Promise.all(
      messages.map((message) => ctx.db.delete("messages", message._id))
    );
  },
});
