import { WebContainer } from "@webcontainer/api";
import { useEffect, useRef, useState } from "react";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { buildFileTree } from "../Preview/utils/buildFileTree";
import { getFilePath } from "../utils/getFilePath";

type Props = {
  projectId: Id<"projects">;
};

let globalWebContainerInstance: WebContainer | null = null;

export const useWebContainer = ({ projectId }: Props) => {
  const [webContainerInstance, setWebContainerInstance] =
    useState<WebContainer | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  const previousFilesRef = useRef<Doc<"files">[] | null>(null);

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

  // sync files
  useEffect(() => {
    if (!files) return;

    const previousFiles = previousFilesRef.current;
    const newFiles = files;

    previousFilesRef.current = newFiles;

    if (!previousFiles) return;

    if (!project || !globalWebContainerInstance) return;

    const wc = globalWebContainerInstance;

    const previousFilesMap = new Map(previousFiles.map((f) => [f._id, f]));
    const newFilesMap = new Map(newFiles.map((f) => [f._id, f]));

    (async () => {
      try {
        for (const newFile of newFiles) {
          // Skip optimistic files
          if ((newFile as any).isOptimistic) {
            continue;
          }

          const oldFile = previousFilesMap.get(newFile._id);

          const filePath = getFilePath(newFilesMap, newFile);
          if (!filePath) continue;

          const newFilePath = `${project.name}/${filePath}`;

          // NewFile doesn't exist in previousFiles
          if (oldFile === undefined) {
            // Create folder
            if (newFile.type === "folder") {
              await wc.fs.mkdir(newFilePath, { recursive: true });
            }
            // Create file
            else await wc.fs.writeFile(newFilePath, newFile.content!);
          }

          // NewFile exists in previousFiles
          else {
            const filePath = getFilePath(previousFilesMap, oldFile);
            if (!filePath) continue;

            const oldFilePath = `${project.name}/${filePath}`;

            if (oldFile.name !== newFile.name) {
              await wc.fs.rename(oldFilePath, newFilePath);
            }

            // File content update
            if (
              oldFile.type === "file" &&
              oldFile.content !== newFile.content
            ) {
              await wc.fs.writeFile(newFilePath, newFile.content!);
            }
          }
        }

        // Handle file delete
        for (const oldFile of previousFiles) {
          // Skip optimistic files
          if ((oldFile as any).isOptimistic) {
            continue;
          }

          const newFile = newFilesMap.get(oldFile._id);

          const filePath = getFilePath(previousFilesMap, oldFile);

          if (!filePath) continue;

          const oldFilePath = `${project.name}/${filePath}`;

          // Delete file if it doesn't exist in newFiles
          if (!newFile) {
            await wc.fs.rm(oldFilePath, { recursive: true, force: true });
          }
        }
      } catch (error) {
        console.log("error:", error);
      }
    })();
  }, [files]);

  return {
    webContainerInstance,
    status,
    previewUrl,
    error,
    setStatus,
    setError,
  };
};
