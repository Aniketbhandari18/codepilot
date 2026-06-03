import { WebContainer } from "@webcontainer/api";
import { useEffect, useRef, useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { buildFileTree } from "../Preview/utils/buildFileTree";

type Props = {
  projectId: Id<"projects">;
};

let globalWebContainerInstance: WebContainer | null = null;

export const useWebContainer = ({ projectId }: Props) => {
  const [webContainerInstance, setWebContainerInstance] =
    useState<WebContainer | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  const [status, setStatus] = useState<
    "idle" | "booting" | "ready" | "installing" | "running" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const project = useQuery(api.projects.getById, {
    projectId: projectId,
  });
  const files = useQuery(api.files.getFiles, {
    projectId: projectId,
  });

  useEffect(() => {
    if (!files || !project || hasInitializedRef.current) return;

    setStatus("booting");
    setError(null);

    const fileTree = buildFileTree(files);
    let wc: WebContainer;

    (async () => {
      try {
        if (globalWebContainerInstance) wc = globalWebContainerInstance;
        else
          wc = await WebContainer.boot({
            coep: "credentialless",
            workdirName: "projects",
          });

        await wc.fs.mkdir(project.name);
        await wc.mount(fileTree, { mountPoint: project.name });

        globalWebContainerInstance = wc;
        if (!webContainerInstance) setWebContainerInstance(wc);

        wc.on("server-ready", (port, url) => {
          setPreviewUrl(url);
          setStatus("running");
        });

        hasInitializedRef.current = true;
      } catch (error) {
        setStatus("error");
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    })();
  }, [files, project]);

  useEffect(() => {
    return () => {
      setPreviewUrl(null);
      const wc = globalWebContainerInstance;

      if (!wc) return;

      (async () => {
        const entries = await wc.fs.readdir("/");
        for (const entry of entries) {
          await wc.fs.rm(entry, { recursive: true, force: true });
        }
      })();
    };
  }, [projectId]);

  return {
    webContainerInstance,
    status,
    previewUrl,
    error,
    setStatus,
    setError,
  };
};
