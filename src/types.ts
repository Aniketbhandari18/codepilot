import { Id } from "../convex/_generated/dataModel";

export type CreatingFile = {
  type: "folder" | "file";
  parentId: Id<"files"> | undefined;
} | null;

export type RenamingFile = {
  type: "folder" | "file";
  fileId: Id<"files">;
} | null;

export type EditorTab = {
  fileId: Id<"files">;
  pinned: boolean;
};

type FileNode = {
  name: string;
  type: "file";
  content: string;
};

type FolderNode = {
  name: string;
  type: "folder";
  children: (FileNode | FolderNode)[];
};

export type Files = (FileNode | FolderNode)[];
