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
