// utils/resolveFilePath.ts

import { Doc, Id } from "../../../../convex/_generated/dataModel";

// Given a relative path like "src/components/Button.tsx",
// walk the files array to find the matching file record
export function resolveFileByPath(
  files: Doc<"files">[],
  relativePath: string,
  projectId: Id<"projects">,
): Doc<"files"> | null {
  const segments = relativePath.split("/").filter(Boolean);

  let parentId: Id<"files"> | undefined = undefined;
  let current: Doc<"files"> | null = null;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const normalizedSegment = segment.toLowerCase();

    current =
      files.find(
        (f) =>
          f.projectId === projectId &&
          f.parentId === parentId &&
          f.normalizedName === normalizedSegment,
      ) ?? null;

    if (!current) return null;
    parentId = current._id;
  }

  return current;
}

// Given a relative path, return the parentId of the last segment
export function resolveParentId(
  files: Doc<"files">[],
  relativePath: string,
  projectId: Id<"projects">,
): Id<"files"> | undefined | null {
  const segments = relativePath.split("/").filter(Boolean);
  if (segments.length <= 1) return undefined; // root-level file, no parent

  const parentPath = segments.slice(0, -1).join("/");
  const parent = resolveFileByPath(files, parentPath, projectId);
  return parent ? parent._id : null; // null = parent not found
}
