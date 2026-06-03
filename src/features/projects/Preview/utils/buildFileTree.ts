// This file contains the logic to build a file tree structure from a flat list of files and folders.
// This file tree structure is required by WebContainer to mount files.

import { FileSystemTree } from "@webcontainer/api";
import { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { buildFileChildrenMap } from "../../utils/buildFileChildrenMap";
import { FILE_ROOT_KEY } from "../../constants";
import { FileChildrenMap } from "../../types";

export const buildFileTree = (files: Doc<"files">[]): FileSystemTree => {
  const childrenMap = buildFileChildrenMap(files);

  const fileTree: FileSystemTree = buildTreeRecursively(
    FILE_ROOT_KEY,
    childrenMap,
  );

  return fileTree;
};

const buildTreeRecursively = (
  parentId: Id<"files"> | typeof FILE_ROOT_KEY,
  childrenMap: FileChildrenMap,
): FileSystemTree => {
  const children = childrenMap.get(parentId);

  if (!children) return {};

  const tree: FileSystemTree = {};

  // Fill files first
  const childFiles = children.files;
  for (const file of childFiles) {
    tree[file.name] = {
      file: {
        contents: file.content ?? "",
      },
    };
  }

  // Fill folders
  const childFolders = children.folders;
  for (const folder of childFolders) {
    tree[folder.name] = {
      directory: buildTreeRecursively(folder._id, childrenMap),
    };
  }

  return tree;
};
