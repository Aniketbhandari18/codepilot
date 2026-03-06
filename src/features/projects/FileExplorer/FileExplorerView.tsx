import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { CopyMinus, FilePlusCorner } from "lucide-react";
import { TbFolderPlus } from "react-icons/tb";
import { useState } from "react";
import FileTree from "./FileTree";
import { CreatingFile, RenamingFile } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";
import FileExplorerSkeleton from "./FileExplorerSkeleton";

const ROOT_KEY = "__ROOT__";

const FileExplorerView = ({ projectId }: { projectId: Id<"projects"> }) => {
  const [openFolders, setOpenFolders] = useState<Set<Id<"files">>>(new Set());
  const [creatingFile, setCreatingFile] = useState<CreatingFile>(null);
  const [renamingFile, setRenamingFile] = useState<RenamingFile>(null);

  const createFile = useMutation(api.files.createFile).withOptimisticUpdate(
    (localStore, args) => {
      const tempId = crypto.randomUUID() as Id<"files">;

      const existingFiles = localStore.getQuery(api.files.getFiles, {
        projectId: args.projectId,
      });

      if (!existingFiles) return;

      const newFile = {
        _id: tempId,
        _creationTime: Date.now(),
        projectId: args.projectId,
        parentId: args.parentId,
        name: args.name.trim(),
        normalizedName: args.name.trim().toLowerCase(),
        type: args.type,
        content: args.type === "file" ? "" : undefined,
        updatedAt: Date.now(),
      };

      localStore.setQuery(api.files.getFiles, { projectId: args.projectId }, [
        ...existingFiles,
        newFile,
      ]);
    },
  );

  const renameFile = useMutation(api.files.rename).withOptimisticUpdate(
    (localStore, args) => {
      const existingFiles = localStore.getQuery(api.files.getFiles, {
        projectId: projectId,
      });

      if (!existingFiles) return;

      const updatedFiles = existingFiles.map((file) => {
        if (file._id === args.fileId) {
          return {
            ...file,
            name: args.name.trim(),
            normalizedName: args.name.trim().toLowerCase(),
            updatedAt: Date.now(),
          };
        }

        return file;
      });

      localStore.setQuery(
        api.files.getFiles,
        { projectId: projectId },
        updatedFiles,
      );
    },
  );

  const deleteFile = useMutation(api.files.deleteFile).withOptimisticUpdate(
    (localStore, args) => {
      const existingFiles = localStore.getQuery(api.files.getFiles, {
        projectId: projectId,
      });

      if (!existingFiles) return;

      const updatedFiles = existingFiles.filter(
        (file) => file._id !== args.fileId,
      );

      localStore.setQuery(
        api.files.getFiles,
        { projectId: projectId },
        updatedFiles,
      );
    },
  );

  const files = useQuery(api.files.getFiles, {
    projectId: projectId,
  });

  type ChildrenMap = Map<
    Id<"files"> | typeof ROOT_KEY,
    {
      folders: Doc<"files">[];
      files: Doc<"files">[];
    }
  >;

  // Map parent to all its its children
  const childrenMap: ChildrenMap = new Map();

  // Populate childrenMap
  if (files) {
    for (const file of files) {
      const parentId = file.parentId || ROOT_KEY;

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

  // Sort folders and files by name for each parent
  for (const children of childrenMap.values()) {
    children.folders.sort((a, b) =>
      a.normalizedName.localeCompare(b.normalizedName, undefined, {
        numeric: true,
      }),
    );
    children.files.sort((a, b) =>
      a.normalizedName.localeCompare(b.normalizedName, undefined, {
        numeric: true,
      }),
    );
  }

  return (
    <div className="p-1 h-full">
      {/* Actions Buttons */}
      <div className="flex justify-between mb-2">
        <div className="space-x-1">
          {/* Create File */}
          <Button
            size={"sm"}
            variant={"outline"}
            className="p-1!"
            onClick={() =>
              setCreatingFile({
                type: "file",
                parentId: undefined,
              })
            }
          >
            <FilePlusCorner className="h-4 w-5.5!" />
          </Button>

          {/* Create Folder */}
          <Button
            size={"sm"}
            variant={"outline"}
            className="p-1!"
            onClick={() =>
              setCreatingFile({
                type: "folder",
                parentId: undefined,
              })
            }
          >
            <TbFolderPlus className="h-4.5 w-5.5!" />
          </Button>
        </div>

        {/* Collapse all folders */}
        <div>
          <Button
            size={"sm"}
            variant={"outline"}
            className="p-1!"
            onClick={() => setOpenFolders(new Set())}
          >
            <CopyMinus className="h-5 w-5.5!" />
          </Button>
        </div>
      </div>

      {files === undefined ? (
        <FileExplorerSkeleton />
      ) : (
        <ScrollArea className="h-full pb-1.5">
          <FileTree
            file={undefined}
            projectId={projectId}
            childrenMap={childrenMap}
            openFolders={openFolders}
            setOpenFolders={setOpenFolders}
            createFile={createFile}
            creatingFile={creatingFile}
            setCreatingFile={setCreatingFile}
            renameFile={renameFile}
            renamingFile={renamingFile}
            setRenamingFile={setRenamingFile}
            deleteFile={deleteFile}
          />
        </ScrollArea>
      )}
    </div>
  );
};
export default FileExplorerView;
