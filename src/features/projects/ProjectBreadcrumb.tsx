"use client";

import { useParams } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyboardEvent, useState } from "react";

const ProjectBreadcrumb = () => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState("");

  const params = useParams();
  const projectId = params.projectId as Id<"projects"> | undefined;

  const project = useQuery(
    api.projects.getById,
    projectId ? { projectId } : "skip",
  );

  const renameProject = useMutation(api.projects.rename).withOptimisticUpdate(
    (localStore, args) => {
      const { projectId, projectName } = args;

      const currentProject = localStore.getQuery(api.projects.getById, {
        projectId: projectId,
      });

      if (currentProject) {
        localStore.setQuery(
          api.projects.getById,
          { projectId: projectId },
          { ...currentProject, name: projectName },
        );
      }
    },
  );

  const handleStartRenaming = () => {
    if (!project) return;

    setName(project.name);
    setIsRenaming(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setName("");
    }
  };

  const handleRename = () => {
    const trimmedName = name.trim();
    setName("");
    setIsRenaming(false);

    if (!project) return;

    if (!trimmedName || project.name === trimmedName) return;
    renameProject({ projectId: project._id, projectName: trimmedName });
  };

  if (!projectId) return null;

  return (
    <>
      {project !== null && (
        <span className="text-[22px] text-white/20 mb-0.5">/</span>
      )}
      {project === undefined && <Skeleton className="h-4 w-34 rounded-sm" />}
      {project &&
        (isRenaming ? (
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.target.select()}
            onBlur={handleRename}
          />
        ) : (
          <span
            className="font-semibold text-white/80 max-w-50 truncate"
            onClick={handleStartRenaming}
          >
            {project.name}
          </span>
        ))}
    </>
  );
};
export default ProjectBreadcrumb;
