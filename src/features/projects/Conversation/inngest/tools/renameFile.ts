import { createTool } from "@inngest/agent-kit";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import z from "zod";
import { api } from "../../../../../../convex/_generated/api";
import { Doc, Id } from "../../../../../../convex/_generated/dataModel";

export const renameFileTool = ({ token }: { token: string }) => {
  return createTool({
    name: "renameFile",
    description: "Rename folder/file in the project.",
    parameters: z.object({
      fileId: z.string(),
      newName: z.string(),
    }),
    handler: async (params, { step }) => {
      const { fileId, newName } = params;

      return await step?.run("rename-file", async () => {
        let file: Doc<"files">;

        try {
          file = await fetchQuery(
            api.files.getById,
            {
              fileId: fileId as Id<"files">,
            },
            { token: token },
          );
        } catch (error) {
          return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
        }

        try {
          await fetchMutation(
            api.files.rename,
            {
              fileId: fileId as Id<"files">,
              name: newName,
            },
            { token: token },
          );

          return `Renamed "${file.name}" to "${newName}" successfully`;
        } catch (error) {
          return `Error renaming file: ${error instanceof Error ? error.message : "Unknown error"}.`;
        }
      });
    },
  });
};
