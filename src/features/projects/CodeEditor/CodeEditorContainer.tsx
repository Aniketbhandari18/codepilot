import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { EditorTab } from "@/types";
import CodeEditorTabs from "./CodeEditorTabs";

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
  return (
    <div>
      <CodeEditorTabs
        files={files}
        tabs={tabs}
        activeTabId={activeTabId}
        onSetActiveTab={onSetActiveTab}
        onPinTab={onPinTab}
        onCloseTab={onCloseTab}
      />

      <div>Editor View</div>
    </div>
  );
};
export default CodeEditorContainer;
