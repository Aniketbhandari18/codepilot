import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { api } from "./_generated/api";

export const createProject = mutation({
  args: {
    name: v.string(),
    template: v.optional(
      v.union(
        v.literal("html"),
        v.literal("nextjs"),
        v.literal("react"),
        v.literal("nodejs"),
      ),
    ),
    prompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const now = Date.now();

    const newProjectId = await ctx.db.insert("projects", {
      name: args.name,
      ownerId: identity.subject,
      initialized: args.template ? true : false,
      updatedAt: now,
    });

    // Create a default conversation for the new project
    const defaultConversationId = await ctx.db.insert("conversations", {
      projectId: newProjectId,
      title: "New Conversation",
      updatedAt: now,
    });

    // Create template files
    if (args.template) {
      ctx.runMutation(api.files.createTemplateFiles, {
        projectId: newProjectId,
        template: args.template,
      });
    }

    let assistantMsgId;
    if (args.prompt) {
      // Create user message
      await ctx.db.insert("messages", {
        conversationId: defaultConversationId,
        projectId: newProjectId,
        content: args.prompt.trim(),
        role: "user",
        status: "completed",
        updatedAt: now,
      });

      // Create assistant processing message (update later when message proceessing completes)
      assistantMsgId = await ctx.db.insert("messages", {
        conversationId: defaultConversationId,
        projectId: newProjectId,
        content: "processing...",
        role: "assistant",
        status: "processing",
        updatedAt: now,
      });
    }

    return {
      projectId: newProjectId,
      assistantMsgId,
    };
  },
});

export const getProjects = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const projectQuery = ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject));

    if (args.limit) {
      if (args.limit < 0) {
        throw new Error("Limit must be non-negative");
      }

      return await projectQuery.take(args.limit);
    }

    return await projectQuery.collect();
  },
});

export const getById = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project || project.ownerId !== identity.subject) {
      return null;
    }

    return project;
  },
});

export const rename = mutation({
  args: {
    projectName: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);
    const projectName = args.projectName.trim();

    if (!projectName) {
      throw new Error("Name cannot be empty");
    }

    if (!project) {
      throw new Error("Project not found");
    }
    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch("projects", args.projectId, {
      name: projectName,
      updatedAt: Date.now(),
    });
  },
});

export const markInitialized = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    await ctx.db.patch("projects", args.projectId, {
      initialized: true,
    });
  },
});
