import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Id } from "../../../convex/_generated/dataModel";
import { CodeXml, Eye, TerminalSquare } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Allotment } from "allotment";
import FileExplorerView from "./FileExplorer/FileExplorerView";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EditorTab } from "@/types";
import CodeEditorContainer from "./CodeEditor/CodeEditorContainer";
import TerminalView from "./Terminal/TerminalView";
import Preview from "./Preview/Preview";
import { useWebContainer } from "./hooks/useWebContainer";

const ProjectView = ({ projectId }: { projectId: Id<"projects"> }) => {
  const project = useQuery(api.projects.getById, {
    projectId: projectId,
  });
  const files = useQuery(api.files.getFiles, {
    projectId: projectId,
  });

  const [showTerminal, setShowTerminal] = useState(true);

  const { webContainerInstance, status, previewUrl, setStatus, setError } =
    useWebContainer({ projectId });

  const [activeView, setActiveView] = useState<"code" | "preview">("code");

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

  // Toggle terminal with Ctrl+` (or Cmd+` on macOS).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("e:", e.key);
      if ((e.ctrlKey || e.metaKey) && e.code === "Backquote") {
        e.preventDefault();

        if (activeView !== "code") {
          setActiveView("code");

          setShowTerminal(true);
        } else {
          setShowTerminal((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeView]);

  return (
    <div className="h-full">
      <Tabs
        className="gap-0 h-full"
        value={activeView}
        defaultValue="code"
        onValueChange={(v) => setActiveView(v as any)}
      >
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

          {/* Terminal toggle (only in Code view) and Export to GitHub */}
          <div className="flex items-center gap-2">
            {activeView === "code" && (
              <Button
                variant={"secondary"}
                size={"sm"}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/80 border rounded-md"
                onClick={() => setShowTerminal((prev) => !prev)}
                aria-pressed={showTerminal}
              >
                <TerminalSquare className="size-4" />
                {showTerminal ? "Hide Terminal" : "Show Terminal"}
              </Button>
            )}

            <Button
              variant={"secondary"}
              size={"sm"}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/80 border rounded-md"
            >
              <FaGithub className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className={activeView === "code" ? "h-full" : "hidden"}>
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

            <Allotment.Pane className="check">
              <Allotment className="check1" vertical defaultSizes={[3, 1]}>
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

                <Allotment.Pane visible={showTerminal}>
                  <div className="h-full flex flex-col bg-[#1b1f27] border-t">
                    <div className="h-7 flex items-center bg-[#1a1d23] px-3 text-sm font-semibold gap-1.5 text-muted-foreground border-b border-border/50 shrink-0">
                      <TerminalSquare className="size-4" />
                      Terminal
                    </div>
                    {project && (
                      <TerminalView
                        files={files}
                        webContainerInstance={webContainerInstance}
                        setStatus={setStatus}
                        setError={setError}
                        cwd={project.name}
                      />
                    )}
                  </div>
                </Allotment.Pane>
              </Allotment>
            </Allotment.Pane>
          </Allotment>
        </div>
        <div className={activeView === "preview" ? "h-full" : "hidden"}>
          <Preview url={previewUrl} status={status} />
        </div>
      </Tabs>
    </div>
  );
};

export default ProjectView;
