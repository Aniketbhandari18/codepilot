import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { Id } from "./_generated/dataModel";

export const createFile = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    type: v.union(v.literal("file"), v.literal("folder")),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    // Project validation
    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    // Parent validation (if provided)
    if (args.parentId) {
      const parent = await ctx.db.get("files", args.parentId);

      if (!parent) {
        throw new Error("Parent File not found");
      }
      if (parent.projectId !== args.projectId) {
        throw new Error("Project not found");
      }
      if (parent.type !== "folder") {
        throw new Error("Cannot create folder/file inside a file");
      }
    }

    const trimmedName = args.name.trim();
    const normalizedName = trimmedName.toLowerCase();

    if (!trimmedName) {
      throw new Error("Name cannot be empty");
    }

    // Check for existing file/folder in the same location
    const existingFile = await ctx.db
      .query("files")
      .withIndex("by_project_parent_normalizedName", (q) =>
        q
          .eq("projectId", args.projectId)
          .eq("parentId", args.parentId)
          .eq("normalizedName", normalizedName),
      )
      .first();

    if (existingFile) {
      throw new Error("Folder or File already exists at this location");
    }

    const now = Date.now();

    const fileId = await ctx.db.insert("files", {
      projectId: args.projectId,
      parentId: args.parentId,
      name: trimmedName,
      normalizedName: normalizedName,
      type: args.type,
      content: args.type === "file" ? (args.content ?? "") : undefined,
      updatedAt: now,
    });

    await ctx.db.patch("projects", args.projectId, {
      updatedAt: now,
    });

    return fileId;
  },
});

export const getFiles = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return files;
  },
});

export const getById = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.fileId);

    if (!file) {
      throw new Error("File not found");
    }

    const project = await ctx.db.get("projects", file.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    return file;
  },
});

export const rename = mutation({
  args: {
    fileId: v.id("files"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.fileId);

    if (!file) {
      throw new Error("File not found");
    }

    const project = await ctx.db.get("projects", file.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    const trimmedName = args.name.trim();
    const normalizedName = trimmedName.toLowerCase();

    if (!trimmedName) {
      throw new Error("Name cannot be empty");
    }

    // Check for existing file/folder in the same location
    const existingFile = await ctx.db
      .query("files")
      .withIndex("by_project_parent_normalizedName", (q) =>
        q
          .eq("projectId", file.projectId)
          .eq("parentId", file.parentId)
          .eq("normalizedName", normalizedName),
      )
      .first();

    if (existingFile && existingFile._id !== args.fileId) {
      throw new Error("Folder or File already exists at this location");
    }

    const now = Date.now();

    await ctx.db.patch("files", args.fileId, {
      name: trimmedName,
      normalizedName: normalizedName,
      updatedAt: now,
    });

    await ctx.db.patch("projects", file.projectId, {
      updatedAt: now,
    });
  },
});

export const updateContent = mutation({
  args: {
    fileId: v.id("files"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.fileId);

    if (!file) {
      throw new Error("File not found");
    }
    if (file.type === "folder") {
      throw new Error("Cannot update content of a folder");
    }

    if (file.content === args.content) {
      return;
    }

    const project = await ctx.db.get("projects", file.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    const now = Date.now();

    await ctx.db.patch("files", args.fileId, {
      content: args.content,
      updatedAt: now,
    });

    await ctx.db.patch("projects", file.projectId, {
      updatedAt: now,
    });
  },
});

export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const file = await ctx.db.get("files", args.fileId);

    if (!file) {
      throw new Error("File not found");
    }

    const project = await ctx.db.get("projects", file.projectId);

    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Project not found");
    }

    // Recursively deletes files/folders and all its descendants
    const deleteRecursively = async (fileId: Id<"files">) => {
      const currentFile = await ctx.db.get("files", fileId);

      if (!currentFile) {
        throw new Error("File not found");
      }

      // If it is folder, delete all its children
      if (currentFile.type === "folder") {
        // Child files
        const childFiles = await ctx.db
          .query("files")
          .withIndex("by_project_parent", (q) =>
            q.eq("projectId", file.projectId).eq("parentId", fileId),
          )
          .collect();

        for (const childFile of childFiles) {
          await deleteRecursively(childFile._id);
        }
      }

      // Delete storage file if it exists
      if (currentFile.storageId) {
        await ctx.storage.delete(currentFile.storageId);
      }

      // Delete current folder/file
      await ctx.db.delete("files", currentFile._id);
    };

    await deleteRecursively(file._id);
    await ctx.db.patch("projects", file.projectId, {
      updatedAt: Date.now(),
    });
  },
});
