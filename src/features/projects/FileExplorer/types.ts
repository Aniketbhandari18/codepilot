import { Id } from "../../../../convex/_generated/dataModel";

export type CreatingFile = {
  type: "folder" | "file";
  parentId: Id<"files"> | undefined;
} | null;

export type RenamingFile = {
  type: "folder" | "file";
  fileId: Id<"files">;
} | null;
