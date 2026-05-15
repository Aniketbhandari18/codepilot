import { createTool } from "@inngest/agent-kit";
import { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import z from "zod";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";

export const updateFilesTool = ({ token }: { token: string }) => {
  return createTool({
    name: "updateFiles",
    description:
      "Update contents of one or more files in the project. Use this to batch update multiple files efficiently.",
    parameters: z.object({
      files: z
        .array(
          z.object({
            fileId: z.string().describe("The ID of the file to update"),
            content: z.string().describe("The new file content"),
          }),
        )
        .describe("Array of files to update"),
    }),
    handler: async (params, { step }) => {
      const { files } = params;

      const filesToUpdate: {
        id: Id<"files">;
        name: string;
        content: string;
      }[] = [];

      // Validate all files first
      for (const fileData of files) {
        const { fileId, content } = fileData;

        let file: Doc<"files">;

        try {
          file = await fetchQuery(
            api.files.getById,
            {
              fileId: fileId as Id<"files">,
            },
            { token: token },
          );

          if (file.type === "folder") {
            return `Error: "${fileId}" is a folder, not a file. You can only update file contents.`;
          }

          filesToUpdate.push({
            id: file._id,
            name: file.name,
            content,
          });
        } catch (error) {
          return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
        }
      }

      return await step?.run("update-files", async () => {
        try {
          const results: string[] = [];

          for (const file of filesToUpdate) {
            await fetchMutation(
              api.files.updateContent,
              {
                fileId: file.id,
                content: file.content,
              },
              { token: token },
            );

            results.push(`Updated file "${file.name}" successfully`);
          }

          return results.join("\n");
        } catch (error) {
          return `Error updating files: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      });
    },
  });
};
