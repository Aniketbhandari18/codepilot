import { createTool } from "@inngest/agent-kit";
import { fetchQuery } from "convex/nextjs";
import z from "zod";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

type ListFilesToolParams = {
  projectId: Id<"projects">;
  token: string;
};

export const listFilesTool = ({ projectId, token }: ListFilesToolParams) => {
  return createTool({
    name: "listFiles",
    description:
      "List all folders/file in the project. Returns names, IDs, types, and parentId for each folder/file",
    parameters: z.object({}),
    handler: async (params, { step }) => {
      return await step?.run("list-files", async () => {
        try {
          const files = await fetchQuery(
            api.files.getFiles,
            {
              projectId: projectId,
            },
            { token: token },
          );

          // Sort files
          // Folders first, then files, sorted alphabetically
          const sortedFiles = files.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === "folder" ? -1 : 1;
            }

            return a.normalizedName.localeCompare(b.normalizedName, undefined, {
              numeric: true,
            });
          });

          const fileList = sortedFiles.map((f) => ({
            id: f._id,
            name: f.name,
            normalizedName: f.normalizedName,
            type: f.type,
            parentId: f.parentId,
          }));

          return fileList;
        } catch (error) {
          return `Error reading files: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      });
    },
  });
};
