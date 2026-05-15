import { createTool } from "@inngest/agent-kit";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import z from "zod";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

type CreateFileToolParams = {
  projectId: Id<"projects">;
  token: string;
};

export const createFilesTool = ({ projectId, token }: CreateFileToolParams) => {
  return createTool({
    name: "createFiles",
    description:
      "Create one or more files at once in the same parent folder. Use this to batch create files that share the same parent folder. More efficient than creating files one by one.",
    parameters: z.object({
      parentId: z
        .string()
        .nullable()
        .describe(
          "The ID of the parent folder. Use null for root level. Must be a valid folder ID from listFiles.",
        ),
      files: z
        .array(
          z.object({
            fileName: z.string().describe("The file name including extension"),
            content: z.string().describe("The file content"),
          }),
        )
        .describe("Array of files to create"),
    }),
    handler: async (params, { step }) => {
      const { parentId, files } = params;

      return await step?.run("create-files", async () => {
        try {
          if (parentId && parentId !== "") {
            const parentFolder = await fetchQuery(
              api.files.getById,
              {
                fileId: parentId as Id<"files">,
              },
              { token: token },
            );

            if (parentFolder.type !== "folder") {
              return `Error: The ID "${parentId}" is a file, not a folder. Use a folder ID as parentId.`;
            }
          }
        } catch (error) {
          return `Error: Invalid parentId "${parentId}". Use listFiles to get valid folder IDs, or use null for root level.`;
        }

        try {
          const results = await fetchMutation(
            api.files.createFiles,
            {
              projectId: projectId,
              parentId: parentId ? (parentId as Id<"files">) : undefined,
              files: files,
            },
            { token: token },
          );

          const created = results.filter((r) => !r.error);
          const failed = results.filter((r) => r.error);

          let response = `Created ${created.length} file(s)`;
          if (created.length > 0) {
            response += `: ${created.map((r) => r.fileName).join(", ")}`;
          }
          if (failed.length > 0) {
            response += `. Failed: ${failed.map((r) => `${r.fileName} (${r.error})`).join(", ")}`;
          }

          return response;
        } catch (error) {
          return `Error creating files: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      });
    },
  });
};
