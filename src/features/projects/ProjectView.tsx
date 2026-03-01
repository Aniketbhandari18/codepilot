import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Id } from "../../../convex/_generated/dataModel";
import { CodeXml, Eye } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const ProjectView = ({ projectId }: { projectId: Id<"projects"> }) => {
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
          <p>Code Editor</p>
        </TabsContent>
        <TabsContent value="preview">
          <p>Preview</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectView;
