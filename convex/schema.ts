import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    ownerId: v.string(),
    updatedAt: v.number(),
    importStatus: v.optional(
      v.union(
        v.literal("importing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
  }).index("by_owner", ["ownerId"]),

  files: defineTable({
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(), // Original file name for display (preserves casing)
    normalizedName: v.string(), // Lowercased version of name for duplicate checks within same parent
    type: v.union(v.literal("folder"), v.literal("file")),
    content: v.optional(v.string()), // For text files
    storageId: v.optional(v.id("_storage")), // For binary files
    updatedAt: v.number(),
  })
    // For querying all files/folders within a project
    .index("by_project", ["projectId"])

    // For querying all files/folders within a parent
    .index("by_parent", ["parentId"])

    // For querying all files within a specific folder inside a project
    // Might not need it
    .index("by_project_parent", ["projectId", "parentId"])

    // For fast duplicate file/folder checks within a parent
    // Might not need projectId in this
    .index("by_project_parent_normalizedName", [
      "projectId",
      "parentId",
      "normalizedName",
    ]),
});
