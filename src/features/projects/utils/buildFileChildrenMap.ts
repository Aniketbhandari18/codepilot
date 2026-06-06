// This file contains the logic to build a mapping of parent folder ID to its child files and folders from a flat list of files and folders.

import { Doc } from "../../../../convex/_generated/dataModel";
import { FILE_ROOT_KEY } from "../constants";
import { FileChildrenMap } from "../types";

export const buildFileChildrenMap = (
  files: Doc<"files">[],
): FileChildrenMap => {
  // Map parent to all its its children
  const childrenMap: FileChildrenMap = new Map();

  // Populate childrenMap
  if (files) {
    for (const file of files) {
      const parentId = file.parentId || FILE_ROOT_KEY;

      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, {
          folders: [],
          files: [],
        });
      }

      const children = childrenMap.get(parentId);

      if (file.type === "folder") {
        children!.folders.push(file);
      } else {
        children!.files.push(file);
      }
    }
  }

  return childrenMap;
};
