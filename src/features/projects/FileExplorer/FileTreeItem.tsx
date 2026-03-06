import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Doc, Id } from "../../../../convex/_generated/dataModel";

type Props = {
  children: React.ReactNode;
  file: Doc<"files">;
  onCreate?: (type: "file" | "folder", parentId: Id<"files">) => void;
  onRename: (type: "file" | "folder", fileId: Id<"files">) => void;
  onDelete: (fileId: Id<"files">) => void;
};

const FileTreeItem = ({
  children,
  file,
  onCreate,
  onRename,
  onDelete,
}: Props) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button className="w-full px-1 text-left rounded-sm cursor-pointer hover:bg-cyan-950">
          {children}
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent
        className="bg-[#042A38]"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {file.type === "folder" && (
          <>
            <ContextMenuItem
              className="cursor-pointer"
              onClick={() => onCreate!("file", file._id)}
            >
              New File...
            </ContextMenuItem>
            <ContextMenuItem
              className="cursor-pointer"
              onClick={() => onCreate!("folder", file._id)}
            >
              New Folder...
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          className="cursor-pointer"
          onClick={() => onRename(file.type, file._id)}
        >
          Rename...
        </ContextMenuItem>
        <ContextMenuItem
          className="cursor-pointer"
          onClick={() => onDelete(file._id)}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
export default FileTreeItem;
