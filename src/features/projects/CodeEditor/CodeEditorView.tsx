import { Id } from "../../../../convex/_generated/dataModel";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { emmetHTML, emmetCSS, emmetJSX } from "emmet-monaco-es";

type Props = {
  fileId: Id<"files">;
  fileName: string;
  initialContent: string;
  onChange: (value: string) => void;
};

const THEME_URL =
  "https://raw.githubusercontent.com/brijeshb42/monaco-themes/master/themes/Night Owl.json";

const CodeEditorView = ({
  fileId,
  fileName,
  initialContent = "",
  onChange,
}: Props) => {
  // Load theme and configure monaco editor before it mounts
  const handleBeforeMount = async (monaco: typeof Monaco) => {
    emmetHTML(monaco, ["html", "php"]);
    emmetCSS(monaco, ["css", "scss", "less"]);
    emmetJSX(monaco, ["javascript", "typescript", "mdx"]);

    const theme = await fetch(THEME_URL).then((r) => r.json());

    monaco.editor.defineTheme("night-owl", theme);
    monaco.editor.setTheme("night-owl");

    // configure typescript compiler options for better intellisense
    const ext = fileName.split(".").pop()?.toLowerCase();
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
    // Format on save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  };

  return (
    <div className="h-full">
      <Editor
        path={`${fileId}/${fileName}`} // used for multi model support + automatically infers language
        defaultValue={initialContent}
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
