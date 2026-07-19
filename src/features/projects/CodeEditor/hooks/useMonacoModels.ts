import type * as Monaco from "monaco-editor";
import { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { getFilePath } from "../../utils/getFilePath";
import { useEffect } from "react";
import { WebContainer } from "@webcontainer/api";

export const useMonacoModels = (
  monaco: typeof Monaco | null,
  projectName: string | undefined,
  fileMap: Map<Id<"files">, Doc<"files">>,
  files: Doc<"files">[] | undefined,
  webcontainerInstance: WebContainer | null,
) => {
  const createModels = (files: Doc<"files">[], monaco: typeof Monaco) => {
    for (const file of files) {
      // Skip folders
      if (file.type === "folder") continue;

      const filePath = getFilePath(fileMap, file);

      const uri = monaco.Uri.parse(`file:///${filePath}`);
      const model = monaco.editor.getModel(uri);

      // Create model if it doesn't exist
      if (!model) {
        // Language is automatically inferred from uri
        monaco.editor.createModel(file.content || "", undefined, uri);
      }
    }

    const existingUris = new Set(
      files
        .filter((f) => f.type !== "folder")
        .map((f) =>
          monaco.Uri.parse(`file:///${getFilePath(fileMap, f)}`).toString(),
        ),
    );

    // Delete model that no longer exist
    monaco.editor.getModels().forEach((model) => {
      if (!existingUris.has(model.uri.toString())) {
        model.dispose();
      }
    });
  };

  // Create models
  useEffect(() => {
    if (!files || !monaco) return;

    createModels(files, monaco);
  }, [files, monaco]);

  // Register newly added TypeScript type definitions.
  useEffect(() => {
    if (!projectName || !webcontainerInstance || !monaco) return;

    const wc = webcontainerInstance;

    const unwatch = wc.fs.watch(
      `${projectName}`,
      { recursive: true },
      async (event, filename) => {
        const filenameStr = filename.toString();

        const relativePath = filenameStr.startsWith(projectName + "/")
          ? filenameStr.slice(projectName.length + 1)
          : filenameStr;

        const shouldCreateModel =
          relativePath.endsWith(".d.ts") ||
          relativePath.endsWith("package.json");

        if (!shouldCreateModel) return;

        try {
          if (event === "rename") {
            const fileContent = await wc.fs.readFile(
              `${projectName}/${relativePath}`,
              "utf-8",
            );

            const uri = monaco.Uri.parse(`file:///${relativePath}`);
            const model = monaco.editor.getModel(uri);

            if (!model) {
              // Add the file to the TypeScript compiler
              monaco.typescript.typescriptDefaults.addExtraLib(
                fileContent,
                `file:///${relativePath}`,
              );
            }
          }
        } catch (error) {}
      },
    );

    return () => {
      unwatch.close();
    };
  }, [webcontainerInstance, monaco, projectName]);
};
