import ProjectContainer from "@/features/projects/ProjectContainer";
import { Id } from "../../../../convex/_generated/dataModel";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <ProjectContainer projectId={projectId as Id<"projects">} />;
}
