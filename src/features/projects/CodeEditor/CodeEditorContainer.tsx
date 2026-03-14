import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { EditorTab } from "@/types";
import CodeEditorTabs from "./CodeEditorTabs";
import CodeEditorView from "./CodeEditorView";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useRef } from "react";
import { AlertTriangleIcon } from "lucide-react";

type Props = {
  files: Doc<"files">[] | undefined;
  tabs: EditorTab[];
  activeTabId: Id<"files"> | null;
  onSetActiveTab: (fileId: Id<"files">) => void;
  onPinTab: (fileId: Id<"files">) => void;
  onCloseTab: (fileId: Id<"files">) => void;
};

const DEBOUNCE_DELAY = 1000; // 1 second;

const CodeEditorContainer = ({
  files,
  tabs,
  activeTabId,
  onSetActiveTab,
  onPinTab,
  onCloseTab,
}: Props) => {
  const file = files?.find((f) => f._id === activeTabId);

  const updateContent = useMutation(api.files.updateContent);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeTabId]);

  const onChange = (value: string) => {
    if (!file) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      updateContent({
        fileId: file._id,
        content: value,
      });
    }, DEBOUNCE_DELAY);
  };

  if (!file || file.type === "folder") return null;

  const isActiveFileText = activeTabId && !file.storageId;
  const isActiveFileBinary = activeTabId && file.storageId;

  return (
    <div className="h-full flex flex-col">
      <CodeEditorTabs
        files={files}
        tabs={tabs}
        activeTabId={activeTabId}
        onSetActiveTab={onSetActiveTab}
        onPinTab={onPinTab}
        onCloseTab={onCloseTab}
      />

      <div className="flex-1 min-h-0">
        {isActiveFileText && (
          <CodeEditorView
            fileId={file._id}
            fileName={file.name}
            initialContent={file.content || ""}
            onChange={onChange}
          />
        )}

        {isActiveFileBinary && (
          <div className="size-full flex items-center justify-center pb-20">
            <div className="flex flex-col items-center gap-2.5 max-w-md text-center">
              <AlertTriangleIcon className="size-10 text-yellow-500" />
              <p className="text-sm">
                The file is not displayed in the text editor because it is
                either binary or uses an unsupported text encoding.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default CodeEditorContainer;
