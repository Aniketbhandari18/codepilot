import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";

export const createProject = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const newProjectId = await ctx.db.insert("projects", {
      name: args.name,
      ownerId: identity.subject,
      updatedAt: Date.now(),
    });

    return newProjectId;
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
