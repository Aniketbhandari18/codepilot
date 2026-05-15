import { createTool } from "@inngest/agent-kit";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import z from "zod";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

export const deleteFilesTool = ({ token }: { token: string }) => {
  return createTool({
    name: "deleteFiles",
    description:
      "Delete files/folders in the project. When deleting a folder, all its desendants will also be deleted recursively",
    parameters: z.object({
      fileIds: z
        .array(z.string())
        .describe("Array of file or folder IDs to delete"),
    }),
    handler: async ({ fileIds }, { step }) => {
      const filesToDelete: {
        id: string;
        name: string;
        type: string;
      }[] = [];

      try {
        for (const fileId of fileIds) {
          const file = await fetchQuery(
            api.files.getById,
            {
              fileId: fileId as Id<"files">,
            },
            { token: token },
          );

          if (!file) {
            return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
          }

          filesToDelete.push({
            id: file._id,
            name: file.name,
            type: file.type,
          });
        }

        return await step?.run("delete-files", async () => {
          const results: string[] = [];

          for (const file of filesToDelete) {
            await fetchMutation(
              api.files.deleteFile,
              {
                fileId: file.id as Id<"files">,
              },
              { token: token },
            );

            results.push(`Deleted ${file.type} "${file.name}" successfully`);
          }

          return results.join("\n");
        });
      } catch (error) {
        return `Error deleting files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
