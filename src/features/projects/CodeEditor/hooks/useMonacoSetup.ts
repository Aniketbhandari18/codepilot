// This file is a setup for monaco
// It sets theme, emmet, typescript compiler options, inline suggestion and formatter(prettier)

import type * as Monaco from "monaco-editor";
import { emmetCSS, emmetHTML, emmetJSX } from "emmet-monaco-es";
import nightOwlTheme from "../theme.json";
import * as prettier from "prettier";
import { useEffect, useRef } from "react";
import axios from "axios";
import { prettierPlugins } from "../prettierPlugins";
export const useMonacoSetup = (monaco: typeof Monaco | null) => {
  let aiProviderDisposable: Monaco.IDisposable;
  let formatProviderDisposable: Monaco.IDisposable;

  const abortControllerRef = useRef<AbortController | null>(null);

  const setup = async (monaco: typeof Monaco) => {
    // Set theme
    monaco.editor.defineTheme(
      "night-owl",
      nightOwlTheme as Monaco.editor.IStandaloneThemeData,
    );
    monaco.editor.setTheme("night-owl");

    // Set up Emmet
    emmetHTML(monaco, ["html", "php"]);
    emmetCSS(monaco, ["css", "scss", "less"]);
    emmetJSX(monaco, ["javascript", "typescript", "mdx"]);

    // Set up TypeScript compiler options
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
      allowImportingTsExtensions: true,
    });
    monaco.typescript.typescriptDefaults.setEagerModelSync(true);

    // Inline suggestions
    aiProviderDisposable = monaco.languages.registerInlineCompletionsProvider(
      "*",
      {
        provideInlineCompletions: async (model, position, context, token) => {
          // "model" is the current active model
          return new Promise((resolve) => {
            const timeout = setTimeout(async () => {
              abortControllerRef.current?.abort();
              abortControllerRef.current = new AbortController();

              // Extract the filename from the model's URI, eg:
              // model.uri = file:///src/App.tsx
              // model.uri.path = src/App.tsx
              // model.uri.path.split("/").pop() = App.tsx
              const filename = model.uri.path.split("/").pop();

              let previousLines = "";
              if (position.lineNumber > 1) {
                previousLines = model.getValueInRange({
                  startLineNumber: 1,
                  startColumn: 1,
                  endLineNumber: position.lineNumber - 1,
                  endColumn: model.getLineMaxColumn(position.lineNumber - 1),
                });
              }
              let nextLines = "";
              if (position.lineNumber < model.getLineCount()) {
                nextLines = model.getValueInRange({
                  startLineNumber: position.lineNumber + 1,
                  startColumn: 1,
                  endLineNumber: model.getLineCount(),
                  endColumn: model.getLineMaxColumn(model.getLineCount()),
                });
              }

              const textBeforeCursor = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              });
              const textAfterCursor = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: model.getLineMaxColumn(position.lineNumber),
              });

              try {
                const { data } = await axios.post(
                  "/api/ai/inline-completion",
                  {
                    fileName: filename,
                    previousLines,
                    textBeforeCursor,
                    textAfterCursor,
                    nextLines,
                  },
                  {
                    signal: abortControllerRef.current.signal,
                  },
                );
                console.log(data);
                const suggestion = data.suggestion as string;

                resolve({
                  items: [
                    {
                      insertText: suggestion,
                      range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                      },
                    },
                  ],
                });
              } catch (error) {
                resolve({ items: [] });
              }
            }, 500);

            token.onCancellationRequested(() => {
              console.log("cancelled");
              abortControllerRef.current?.abort();
              clearTimeout(timeout);
              resolve({ items: [] });
            });
          });
        },
        disposeInlineCompletions() {},
      },
    );

    // Register Prettier as the document formatter
    formatProviderDisposable =
      monaco.languages.registerDocumentFormattingEditProvider("*", {
        async provideDocumentFormattingEdits(model) {
          // "model" is the current active model
          try {
            // Extract the filename from the model's URI, eg:
            // model.uri = file:///src/App.tsx
            // model.uri.path = src/App.tsx
            // model.uri.path.split("/").pop() = App.tsx
            const filename = model.uri.path.split("/").pop();

            const formatted = await prettier.format(model.getValue(), {
              filepath: filename, // automatically infers which parser to use based on filename
              plugins: prettierPlugins,
            });

            return [{ range: model.getFullModelRange(), text: formatted }];
          } catch (error) {
            return [];
          }
        },
      });
  };

  useEffect(() => {
    if (!monaco) return;

    setup(monaco);

    return () => {
      if (aiProviderDisposable) aiProviderDisposable.dispose();
      if (formatProviderDisposable) formatProviderDisposable.dispose();
    };
  }, [monaco]);
};
