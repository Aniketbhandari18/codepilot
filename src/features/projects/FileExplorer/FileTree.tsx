import { Dispatch, SetStateAction } from "react";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import FileTreeItem from "./FileTreeItem";
import { CreatingFile, RenamingFile } from "@/types";
import FileInput from "./FileInput";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ChevronRightIcon } from "lucide-react";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";

const ROOT_KEY = "__ROOT__";

type Props = {
  file: Doc<"files"> | undefined; // File === undefined represents root
  projectId: Id<"projects">;
  childrenMap: Map<
    Id<"files"> | typeof ROOT_KEY,
    {
      folders: Doc<"files">[];
      files: Doc<"files">[];
    }
  >;
  openFolders: Set<Id<"files">>;
  setOpenFolders: Dispatch<SetStateAction<Set<Id<"files">>>>;
  createFile: ReturnType<typeof useMutation<typeof api.files.createFile>>;
  creatingFile: CreatingFile;
  setCreatingFile: Dispatch<SetStateAction<CreatingFile>>;
  renameFile: ReturnType<typeof useMutation<typeof api.files.rename>>;
  renamingFile: RenamingFile;
  setRenamingFile: Dispatch<SetStateAction<RenamingFile>>;
  deleteFile: ReturnType<typeof useMutation<typeof api.files.deleteFile>>;
  onOpenTab: (fileId: Id<"files">, pinned?: boolean) => void;
};

const FileTree = ({
  file,
  projectId,
  childrenMap,
  openFolders,
  setOpenFolders,
  createFile,
  creatingFile,
  setCreatingFile,
  renameFile,
  renamingFile,
  setRenamingFile,
  deleteFile,
  onOpenTab,
}: Props) => {
  const isRoot = file === undefined;
  const isOpen = isRoot || openFolders.has(file._id);

  const key = file ? file._id : ROOT_KEY;
  const children = childrenMap.get(key);

  const childFolders = children?.folders || [];
  const childFiles = children?.files || [];

  const siblings = childrenMap.get(file?.parentId ?? ROOT_KEY);

  const siblingFolders = siblings?.folders || [];
  const siblingFiles = siblings?.files || [];

  // whether to show input for file/folder creation
  const showInput =
    creatingFile !== null && creatingFile.parentId === file?._id;

  const toggleOpen = () => {
    if (!file) return;

    setOpenFolders((prev) => {
      const next = new Set(prev);

      if (next.has(file._id)) {
        next.delete(file._id);
      } else {
        next.add(file._id);
      }

      return next;
    });
  };

  const startCreating = (type: "folder" | "file", parentId: Id<"files">) => {
    // Open the current folder if it's not already open
    if (file) {
      if (!openFolders.has(file._id)) {
        setOpenFolders((prev) => {
          const next = new Set(prev);

          next.add(file._id);
          return next;
        });
      }
    }

    setCreatingFile({
      type: type,
      parentId: parentId,
    });
  };

  const handleCreate = (name: string) => {
    // Validation is already done inside FileInput component
    if (!creatingFile) return;

    createFile({
      name: name,
      projectId: projectId,
      parentId: creatingFile.parentId,
      type: creatingFile.type,
    });

    setCreatingFile(null);
  };

  const handleCreationCancel = () => {
    setCreatingFile(null);
  };

  const startRenaming = (type: "folder" | "file", fileId: Id<"files">) => {
    setRenamingFile({
      type: type,
      fileId: fileId,
    });
  };

  const handleRename = (name: string) => {
    if (!renamingFile) return;

    renameFile({
      fileId: renamingFile.fileId,
      name: name,
    });

    setRenamingFile(null);
  };

  const handleRenamingCancel = () => {
    setRenamingFile(null);
  };

  const handleDelete = (fileId: Id<"files">) => {
    deleteFile({
      fileId: fileId,
    });
  };

  // if current folder/file is in renaming state, render FileInput instead of FileTreeItem
  if (renamingFile && file && renamingFile.fileId === file._id) {
    return (
      <div>
        <FileInput
          mode={{ type: "rename", itemType: file.type, file: file }}
          siblings={[...siblingFolders, ...siblingFiles]}
          onSubmit={handleRename}
          onCancel={handleRenamingCancel}
        />
      </div>
    );
  }

  // Early return for file
  if (file?.type === "file") {
    return (
      <FileTreeItem
        file={file}
        onRename={startRenaming}
        onDelete={handleDelete}
        onOpenTab={onOpenTab}
      >
        <div className="flex items-center gap-1.5 ml-3">
          <FileIcon fileName={file.name} className="w-7 h-5 shrink-0" />

          <div className="flex-1 truncate">{file.name}</div>
        </div>
      </FileTreeItem>
    );
  }

  // For folder
  return (
    <div>
      {file && (
        <FileTreeItem
          file={file}
          onCreate={startCreating}
          onRename={startRenaming}
          onDelete={handleDelete}
        >
          <div
            onClick={toggleOpen}
            className="flex w-full items-center gap-1.5"
          >
            <div className="-ml-1 flex">
              <ChevronRightIcon
                className={`w-5 h-5 ${isOpen && "rotate-90"}`}
              />
              <FolderIcon className="w-5 h-5" folderName={file.name} />
            </div>
            <div className="flex-1 truncate">{file.name}</div>
          </div>
        </FileTreeItem>
      )}

      {/* If current folder is opened render FileTree again for its children */}
      {isOpen && (
        <div className={`${file ? "pl-4" : ""}`}>
          {/* Input for folder creation */}
          {showInput && creatingFile?.type === "folder" && (
            <FileInput
              mode={{ type: "create", itemType: creatingFile.type }}
              siblings={[...childFolders, ...childFiles]} // children of current Folder would become siblings of the new folder/file to be created
              onSubmit={handleCreate}
              onCancel={handleCreationCancel}
            />
          )}

          {/* Render Folders First */}
          {childFolders.map((child) => (
            <FileTree
              key={child._id}
              file={child}
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
              onOpenTab={onOpenTab}
            />
          ))}

          {/* Input for file creation */}
          {showInput && creatingFile?.type === "file" && (
            <FileInput
              mode={{ type: "create", itemType: creatingFile.type }}
              siblings={[...childFolders, ...childFiles]} // children of current Folder would become siblings of the new folder/file to be created
              onSubmit={handleCreate}
              onCancel={handleCreationCancel}
            />
          )}

          {/* Render Files */}
          {childFiles.map((child) => (
            <FileTree
              key={child._id}
              file={child}
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
              onOpenTab={onOpenTab}
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default FileTree;
