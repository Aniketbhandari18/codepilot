import { Doc, Id } from "../../../convex/_generated/dataModel";
import { FILE_ROOT_KEY } from "./constants";

export type FileChildrenMap = Map<
  Id<"files"> | typeof FILE_ROOT_KEY,
  {
    folders: Doc<"files">[];
    files: Doc<"files">[];
  }
>;
