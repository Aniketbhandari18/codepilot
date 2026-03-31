"use client";

import { useQuery } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { notFound } from "next/navigation";
import { Allotment } from "allotment";
import ProjectView from "./ProjectView";
import ConversationSidebar from "./Conversation/ConversationSidebar";

import "allotment/dist/style.css";

const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 800;

const ProjectContainer = ({ projectId }: { projectId: Id<"projects"> }) => {
  const project = useQuery(api.projects.getById, { projectId });

  if (project === null) {
    return notFound();
  }

  return (
    <div className="h-full">
      <Allotment defaultSizes={[1, 2]}>
        <Allotment.Pane
          snap
          minSize={MIN_SIDEBAR_WIDTH}
          maxSize={MAX_SIDEBAR_WIDTH}
          preferredSize="33.33%"
        >
          <ConversationSidebar projectId={projectId} />
        </Allotment.Pane>
        <Allotment.Pane>
          <ProjectView projectId={projectId} />
        </Allotment.Pane>
      </Allotment>
    </div>
  );
};
export default ProjectContainer;
