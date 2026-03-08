import { EditorTab } from "@/types";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  files: Doc<"files">[] | undefined;
  tabs: EditorTab[];
  activeTabId: Id<"files"> | null;
  onSetActiveTab: (fileId: Id<"files">) => void;
  onPinTab: (fileId: Id<"files">) => void;
  onCloseTab: (fileId: Id<"files">) => void;
};

const CodeEditorTabs = ({
  files,
  tabs,
  activeTabId,
  onSetActiveTab,
  onPinTab,
  onCloseTab,
}: Props) => {
  if (!files) return null;
  return (
    <div
      className="flex items-center border-b border-white/15 overflow-x-auto
      [&::-webkit-scrollbar]:h-1
      [&::-webkit-scrollbar-track]:bg-transparent
      [&::-webkit-scrollbar-thumb]:bg-white/20
      [&::-webkit-scrollbar-thumb]:rounded-full
      hover:[&::-webkit-scrollbar-thumb]:bg-white/40"
    >
      {tabs.map((tab) => {
        const file = files.find((f) => f._id === tab.fileId);

        if (!file) return null;

        const isActive = file._id === activeTabId;

        return (
          <div
            key={tab.fileId}
            onClick={() => onSetActiveTab(tab.fileId)}
            onDoubleClick={() => onPinTab(tab.fileId)}
            className={`
              flex items-center gap-2 px-3 py-1.5 text-sm border-r border-white/15 
              cursor-pointer shrink-0 group select-none
              ${isActive ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/10"}
            `}
          >
            <span className={`${!tab.pinned ? "italic" : ""}`}>
              {file.name}
            </span>
            <Button
              variant={"ghost"}
              size={"xs"}
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.fileId);
              }}
              className={`${isActive ? "opacity-100" : "opacity-0"} group-hover:opacity-100 hover:bg-white/10! hover:text-white rounded`}
            >
              <X className="h-3.5! w-3.5!" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};
export default CodeEditorTabs;
