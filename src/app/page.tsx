"use client";

import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const Page = () => {
  const projects = useQuery(api.projects.getProjects);
  const createProject = useMutation(api.projects.createProject);

  return (
    <div>
      <Button onClick={() => createProject({ name: "project" })}>
        New Project
      </Button>

      {projects?.map((project) => (
        <div key={project._id}>{project.name}</div>
      ))}
    </div>
  );
};
export default Page;
