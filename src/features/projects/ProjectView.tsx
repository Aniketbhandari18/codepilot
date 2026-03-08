import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Id } from "../../../convex/_generated/dataModel";
import { CodeXml, Eye } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Allotment } from "allotment";
import FileExplorerView from "./FileExplorer/FileExplorerView";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EditorTab } from "@/types";
import CodeEditorContainer from "./CodeEditor/CodeEditorContainer";

const ProjectView = ({ projectId }: { projectId: Id<"projects"> }) => {
  // State for opened Tabs in code editors
  const [openedTabs, setOpenedTabs] = useState<EditorTab[]>([]);
  // State for active Tab in code editor
  const [activeTabId, setActiveTabId] = useState<Id<"files"> | null>(null);

  const openTab = (fileId: Id<"files">, pinned: boolean = false) => {
    const existing = openedTabs.find((t) => t.fileId === fileId);

    if (existing) {
      setActiveTabId(fileId);

      if (pinned) {
        setOpenedTabs((prev) =>
          prev.map((t) => (t.fileId === fileId ? { ...t, pinned: true } : t)),
        );
      }

      return;
    }

    // If there is an unpinned tab replace it with the new one
    const unpinnedTab = openedTabs.find((t) => t.pinned === false);
    if (unpinnedTab) {
      setOpenedTabs((prev) =>
        prev.map((t) =>
          t.pinned === false ? { fileId: fileId, pinned: pinned } : t,
        ),
      );

      setActiveTabId(fileId);
      return;
    }

    // Else add new Tab
    setOpenedTabs((prev) => [...prev, { fileId: fileId, pinned: pinned }]);
    setActiveTabId(fileId);
  };

  const closeTab = (fileId: Id<"files">) => {
    const tabIdx = openedTabs.findIndex((t) => t.fileId === fileId);
    const len = openedTabs.length;
    const nearestIdx = tabIdx === len - 1 ? tabIdx - 1 : tabIdx + 1;

    // Remove this fileId from openedTabs
    setOpenedTabs((prev) => prev.filter((t) => t.fileId !== fileId));

    // if this file is active, replace it with the nearest tab
    if (activeTabId === fileId) {
      // Set null for 0 active tabs
      if (len === 1) {
        setActiveTabId(null);
        return;
      }

      setActiveTabId(openedTabs[nearestIdx].fileId);
    }
  };

  // Might not need this
  const pinTab = (fileId: Id<"files">) => {
    setOpenedTabs((prev) =>
      prev.map((t) => (t.fileId === fileId ? { ...t, pinned: true } : t)),
    );
  };

  const files = useQuery(api.files.getFiles, {
    projectId: projectId,
  });

  return (
    <div className="h-full">
      <Tabs className="gap-0 h-full" defaultValue="code">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-1.5 py-1.5 border-b border-white/15">
          {/* Tabs */}
          <TabsList className="bg-transparent gap-1">
            <TabsTrigger
              value="code"
              className="flex items-center gap-1.5 data-[state=active]:text-[#9B74E0]! data-[state=active]:border-[#9B74E0]/60! data-[state=active]:bg-[#9B74E0]/15! border-white/20"
            >
              <CodeXml className="w-4 h-4" />
              Code
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex items-center gap-1.5 data-[state=active]:text-[#9B74E0]! data-[state=active]:border-[#9B74E0]/60! data-[state=active]:bg-[#9B74E0]/15! border-white/20"
            >
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Export to GitHub */}
          <Button
            size={"sm"}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border rounded-md"
          >
            <FaGithub className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Tab Content */}
        <TabsContent value="code">
          <Allotment defaultSizes={[1, 3]}>
            <Allotment.Pane
              minSize={180}
              maxSize={600}
              snap
              preferredSize={"25%"}
            >
              <FileExplorerView
                projectId={projectId}
                files={files}
                onOpenTab={openTab}
              />
            </Allotment.Pane>
            <Allotment.Pane>
              <CodeEditorContainer
                files={files}
                tabs={openedTabs}
                activeTabId={activeTabId}
                onSetActiveTab={setActiveTabId}
                onPinTab={pinTab}
                onCloseTab={closeTab}
              />
            </Allotment.Pane>
          </Allotment>
        </TabsContent>
        <TabsContent value="preview">
          <p>Preview</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectView;
