import { Doc, Id } from "../../../../convex/_generated/dataModel";

export const getFilePath = (
  fileMap: Map<Id<"files">, Doc<"files">>,
  file: Doc<"files">,
) => {
  const fileNames = [file.name];

  let currentFile = file;

  while (currentFile.parentId !== undefined) {
    const parentFile = fileMap.get(currentFile.parentId);

    if (!parentFile) {
      return null;
    }

    fileNames.push(parentFile.name);

    currentFile = parentFile;
  }

  const filePath = fileNames.reverse().join("/");

  return filePath;
};
