import { Doc } from "../../../../convex/_generated/dataModel";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { emmetHTML, emmetCSS, emmetJSX } from "emmet-monaco-es";
import nightOwlTheme from "./theme.json";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useEffect, useRef } from "react";

type Props = {
  file: Doc<"files">;
};

const DEBOUNCE_DELAY = 1000; // 1 second;

const CodeEditorView = ({ file }: Props) => {
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

  // Load theme and configure monaco editor before it mounts
  const handleBeforeMount = async (monaco: typeof Monaco) => {
    emmetHTML(monaco, ["html", "php"]);
    emmetCSS(monaco, ["css", "scss", "less"]);
    emmetJSX(monaco, ["javascript", "typescript", "mdx"]);

    // configure typescript compiler options for better intellisense
    const ext = file.name.split(".").pop()?.toLowerCase();
    const isJsOrTsFile =
      ext === "js" || ext === "ts" || ext === "jsx" || ext === "tsx";

    if (isJsOrTsFile) {
      monaco.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.typescript.ScriptTarget.ES2016,
        allowNonTsExtensions: true,
        moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.typescript.ModuleKind.CommonJS,
        noEmit: true,
        typeRoots: ["node_modules/@types"],
        jsx: monaco.typescript.JsxEmit.ReactJSX,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      });

      // fetch react types
      const [reactTypes, reactJsxRuntime] = await Promise.all([
        fetch("https://unpkg.com/@types/react/index.d.ts").then((r) =>
          r.text(),
        ),
        fetch("https://unpkg.com/@types/react/jsx-runtime.d.ts").then((r) =>
          r.text(),
        ),
      ]);

      monaco.typescript.typescriptDefaults.addExtraLib(
        reactTypes,
        "file:///node_modules/@types/react/index.d.ts",
      );

      monaco.typescript.typescriptDefaults.addExtraLib(
        reactJsxRuntime,
        "file:///node_modules/@types/react/jsx-runtime.d.ts",
      );
    }
  };

  const handleOnMount = (
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco,
  ) => {
    // Set theme
    monaco.editor.defineTheme(
      "night-owl",
      nightOwlTheme as Monaco.editor.IStandaloneThemeData,
    );
    monaco.editor.setTheme("night-owl");

    // Format on save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  };

  return (
    <div className="h-full">
      <Editor
        path={`${file._id}/${file.name}`} // used for multi model support + automatically infers language
        defaultValue={file.content}
        beforeMount={handleBeforeMount}
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
