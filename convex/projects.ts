import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { nextjsFiles } from "@/templates/nextjs/files";
import { Files } from "@/types";
import { Id } from "./_generated/dataModel";
import { nodejsFiles } from "@/templates/nodejs/files";
import { htmlFiles } from "@/templates/html/files";
import { reactFiles } from "@/templates/react/files";

export const createProject = mutation({
  args: {
    name: v.string(),
    template: v.union(
      v.literal("html"),
      v.literal("nextjs"),
      v.literal("react"),
      v.literal("nodejs")
    )
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const now = Date.now();

    const newProjectId = await ctx.db.insert("projects", {
      name: args.name,
      ownerId: identity.subject,
      updatedAt: now,
    });

    // Create a default conversation for the new project
    await ctx.db.insert("conversations", {
      projectId: newProjectId,
      title: "New Conversation",
      updatedAt: now,
    });

    const createFilesRecursively = async (
      files: Files,
      parentId: Id<"files"> | undefined,
    ) => {
      for (const file of files) {
        const newFileId = await ctx.db.insert("files", {
          projectId: newProjectId,
          parentId: parentId,
          name: file.name,
          normalizedName: file.name.trim().toLowerCase(),
          type: file.type,
          content: file.type === "file" ? file.content : undefined,
          updatedAt: now,
        });

        if (file.type === "folder") {
          await createFilesRecursively(file.children, newFileId);
        }
      }
    };

    const TEMPLATE_FILES_MAP = {
      html: htmlFiles,
      react: reactFiles,
      nextjs: nextjsFiles,
      nodejs: nodejsFiles,
    }

    const templateFiles = TEMPLATE_FILES_MAP[args.template];

    await createFilesRecursively(templateFiles, undefined);

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
