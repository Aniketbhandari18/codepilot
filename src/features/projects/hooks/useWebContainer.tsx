import { IFSWatcher, WebContainer } from "@webcontainer/api";
import { useEffect, useRef, useState } from "react";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { buildFileTree } from "../Preview/utils/buildFileTree";
import { getFilePath } from "../utils/getFilePath";
import { resolveFileByPath, resolveParentId } from "../utils/resolveFilePath";

type Props = {
  projectId: Id<"projects">;
};

let globalWebContainerInstance: WebContainer | null = null;

export const useWebContainer = ({ projectId }: Props) => {
  const [webContainerInstance, setWebContainerInstance] =
    useState<WebContainer | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  const previousFilesRef = useRef<Doc<"files">[] | null>(null);

  const filesRef = useRef<Doc<"files">[]>([]);
  const isSyncingFromConvexRef = useRef(false);
  const watchCleanupRef = useRef<IFSWatcher | null>(null);

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

  const createFile = useMutation(api.files.createFile).withOptimisticUpdate(
    (localStore, args) => {
      const tempId = crypto.randomUUID() as Id<"files">;

      const existingFiles = localStore.getQuery(api.files.getFiles, {
        projectId: args.projectId,
      });

      if (!existingFiles) return;

      const newFile = {
        _id: tempId,
        _creationTime: Date.now(),
        projectId: args.projectId,
        parentId: args.parentId,
        name: args.name.trim(),
        normalizedName: args.name.trim().toLowerCase(),
        type: args.type,
        content: args.type === "file" ? "" : undefined,
        updatedAt: Date.now(),
        isOptimistic: true,
      };

      localStore.setQuery(api.files.getFiles, { projectId: args.projectId }, [
        ...existingFiles,
        newFile,
      ]);
    },
  );
  const updateContent = useMutation(api.files.updateContent);
  const deleteFile = useMutation(api.files.deleteFile).withOptimisticUpdate(
    (localStore, args) => {
      const existingFiles = localStore.getQuery(api.files.getFiles, {
        projectId: projectId,
      });

      if (!existingFiles) return;

      const updatedFiles = existingFiles.filter(
        (file) => file._id !== args.fileId,
      );

      localStore.setQuery(
        api.files.getFiles,
        { projectId: projectId },
        updatedFiles,
      );
    },
  );

  // Keep filesRef fresh so watcher callbacks always have current data
  useEffect(() => {
    if (files) filesRef.current = files;
  }, [files]);

  // Helper to suppress the watcher while we write from Convex→WC
  const wcWrite = async (fn: () => Promise<unknown>) => {
    isSyncingFromConvexRef.current = true;
    try {
      await fn();
    } finally {
      setTimeout(() => (isSyncingFromConvexRef.current = false), 100);
    }
  };

  // Boot WebContainer and set up WC→Convex watcher
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

        // WC→Convex watcher
        const unwatch = wc.fs.watch(
          project.name,
          { recursive: true },
          async (event, filename) => {
            if (!filename || isSyncingFromConvexRef.current) return;

            const filenameStr = filename.toString();

            const relativePath = filenameStr.startsWith(project.name + "/")
              ? filenameStr.slice(project.name.length + 1)
              : filenameStr;

            if (!relativePath) return;

            const currentFiles = filesRef.current;

            try {
              if (event === "rename") {
                try {
                  // Try readdir first — succeeds if it's a directory
                  await wc.fs.readdir(`${project.name}/${relativePath}`);

                  // It's a folder
                  const alreadyExists = resolveFileByPath(
                    currentFiles,
                    relativePath,
                    projectId,
                  );
                  if (alreadyExists) return;

                  const segments = relativePath.split("/").filter(Boolean);
                  const name = segments[segments.length - 1];
                  const parentId = resolveParentId(
                    currentFiles,
                    relativePath,
                    projectId,
                  );

                  if (parentId === null) {
                    console.warn(
                      "Parent folder not found in Convex for",
                      relativePath,
                    );
                    return;
                  }

                  await createFile({
                    projectId,
                    parentId,
                    name,
                    type: "folder",
                  });
                } catch {
                  // readdir failed — try reading as a file
                  try {
                    const content = await wc.fs.readFile(
                      `${project.name}/${relativePath}`,
                      "utf-8",
                    );

                    // It's a file
                    const alreadyExists = resolveFileByPath(
                      currentFiles,
                      relativePath,
                      projectId,
                    );
                    if (alreadyExists) return;

                    const segments = relativePath.split("/").filter(Boolean);
                    const name = segments[segments.length - 1];
                    const parentId = resolveParentId(
                      currentFiles,
                      relativePath,
                      projectId,
                    );

                    if (parentId === null) {
                      console.warn(
                        "Parent folder not found in Convex for",
                        relativePath,
                      );
                      return;
                    }

                    await createFile({
                      projectId,
                      parentId,
                      name,
                      type: "file",
                      content,
                    });
                  } catch {
                    // Both failed — path doesn't exist → deleted
                    const fileRecord = resolveFileByPath(
                      currentFiles,
                      relativePath,
                      projectId,
                    );
                    if (fileRecord) {
                      await deleteFile({ fileId: fileRecord._id });
                    }
                  }
                }
              } else if (event === "change") {
                const content = await wc.fs.readFile(
                  `${project.name}/${relativePath}`,
                  "utf-8",
                );

                const fileRecord = resolveFileByPath(
                  currentFiles,
                  relativePath,
                  projectId,
                );

                if (!fileRecord) return;

                await updateContent({ fileId: fileRecord._id, content });
              }
            } catch (err) {
              console.error("WC→Convex sync error:", err);
            }
          },
        );

        watchCleanupRef.current = unwatch;
        hasInitializedRef.current = true;
      } catch (error) {
        setStatus("error");
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    })();
  }, [files, project]);

  // Cleanup on projectId change
  useEffect(() => {
    return () => {
      watchCleanupRef.current?.close();
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

  // Convex→WC sync (using wcWrite to suppress the watcher)
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
              await wcWrite(() =>
                wc.fs.mkdir(newFilePath, { recursive: true }),
              );
            }
            // Create file
            else {
              await wcWrite(() =>
                wc.fs.writeFile(newFilePath, newFile.content!),
              );
            }
          }

          // NewFile exists in previousFiles
          else {
            const filePath = getFilePath(previousFilesMap, oldFile);
            if (!filePath) continue;

            const oldFilePath = `${project.name}/${filePath}`;

            if (oldFile.name !== newFile.name) {
              await wcWrite(() => wc.fs.rename(oldFilePath, newFilePath));
            }

            // File content update
            if (
              oldFile.type === "file" &&
              oldFile.content !== newFile.content
            ) {
              await wcWrite(() =>
                wc.fs.writeFile(newFilePath, newFile.content!),
              );
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
            await wcWrite(() =>
              wc.fs.rm(oldFilePath, { recursive: true, force: true }),
            );
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
