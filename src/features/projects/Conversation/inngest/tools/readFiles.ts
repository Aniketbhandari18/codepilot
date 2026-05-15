import { createTool } from "@inngest/agent-kit";
import { fetchQuery } from "convex/nextjs";
import z from "zod";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

export const readFilesTool = ({ token }: { token: string }) => {
  return createTool({
    name: "readFiles",
    description:
      "Read content of files from the project. It returns file contents",
    parameters: z.object({
      fileIds: z.array(z.string()),
    }),
    handler: async ({ fileIds }, { step }) => {
      return await step?.run("read-files", async () => {
        try {
          const fileContents: {
            id: string;
            name: string;
            content: string;
          }[] = [];

          for (const fileId of fileIds) {
            const file = await fetchQuery(
              api.files.getById,
              {
                fileId: fileId as Id<"files">,
              },
              { token: token },
            );

            if (file.content !== undefined) {
              fileContents.push({
                id: file._id,
                name: file.name,
                content: file.content,
              });
            }
          }

          if (fileContents.length === 0) {
            return "Error: No files found with provided IDs. Use listFiles to get valid IDs";
          }

          return fileContents;
        } catch (error) {
          return `Error reading files: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      });
    },
  });
};
