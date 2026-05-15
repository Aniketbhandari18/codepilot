import { createTool } from "@inngest/agent-kit";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import z from "zod";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

type CreateFolderToolParams = {
  projectId: Id<"projects">;
  token: string;
};

export const createFolderTool = ({
  projectId,
  token,
}: CreateFolderToolParams) => {
  return createTool({
    name: "createFolder",
    description: "Create a new folder in the project.",
    parameters: z.object({
      parentId: z
        .string()
        .nullable()
        .describe(
          "The ID of the parent folder. Use null for root level. Must be a valid folder ID from listFiles.",
        ),
      folderName: z.string().describe("The name of the folder to create"),
    }),
    handler: async (params, { step }) => {
      const { parentId, folderName } = params;

      return await step?.run("create-folder", async () => {
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
          const folderId = await fetchMutation(
            api.files.createFile,
            {
              projectId: projectId,
              parentId: parentId ? (parentId as Id<"files">) : undefined,
              name: folderName,
              type: "folder",
            },
            { token: token },
          );

          return `Folder "${folderName}" created with ID: ${folderId}`;
        } catch (error) {
          return `Error creating folder: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      });
    },
  });
};
