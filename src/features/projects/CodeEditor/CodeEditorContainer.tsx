import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { EditorTab } from "@/types";
import CodeEditorTabs from "./CodeEditorTabs";
import CodeEditorView from "./CodeEditorView";
import { AlertTriangleIcon } from "lucide-react";

type Props = {
  files: Doc<"files">[] | undefined;
  tabs: EditorTab[];
  activeTabId: Id<"files"> | null;
  onSetActiveTab: (fileId: Id<"files">) => void;
  onPinTab: (fileId: Id<"files">) => void;
  onCloseTab: (fileId: Id<"files">) => void;
};

const CodeEditorContainer = ({
  files,
  tabs,
  activeTabId,
  onSetActiveTab,
  onPinTab,
  onCloseTab,
}: Props) => {
  const file = files?.find((f) => f._id === activeTabId);

  const isActiveFileText = file && !file.storageId;
  const isActiveFileBinary = file && file.storageId;

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
        {isActiveFileText && <CodeEditorView file={file} />}

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
