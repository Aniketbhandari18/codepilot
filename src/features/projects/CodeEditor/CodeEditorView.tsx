import { Doc, Id } from "../../../../convex/_generated/dataModel";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useRef } from "react";
import { getFilePath } from "../utils/getFilePath";

type Props = {
  fileMap: Map<Id<"files">, Doc<"files">>;
  file: Doc<"files">;
};

const DEBOUNCE_DELAY = 1000; // 1 second;

const CodeEditorView = ({ fileMap, file }: Props) => {
  const updateContent = useMutation(api.files.updateContent);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (pendingUpdateRef.current) {
        updateContent({
          fileId: file._id,
          content: pendingUpdateRef.current,
        });
        pendingUpdateRef.current = null;
      }
    };
  }, [file._id]);

  const onChange = (value: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    pendingUpdateRef.current = value;

    timeoutRef.current = setTimeout(() => {
      updateContent({
        fileId: file._id,
        content: value,
      });

      pendingUpdateRef.current = null;
    }, DEBOUNCE_DELAY);
  };

  if (file.type === "folder") return null;

  const handleOnMount = (
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco,
  ) => {
    // Format on save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  };

  const filePath = getFilePath(fileMap, file);
  const fileUri = `file:///${filePath}`;

  return (
    <div className="h-full">
      <Editor
        path={fileUri} // used for multi model support + automatically infers language
        defaultValue={file.content}
        theme="night-owl"
        onMount={handleOnMount}
        onChange={(value) => onChange(value || "")}
        options={{
          fontSize: 16,
          wordWrap: "on",
          tabSize: 2,
        }}
      />
    </div>
  );
};
export default CodeEditorView;
