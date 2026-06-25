import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { WebContainer, WebContainerProcess } from "@webcontainer/api";

import "@xterm/xterm/css/xterm.css";
import { Doc } from "../../../../convex/_generated/dataModel";

type Props = {
  files: Doc<"files">[] | undefined;
  webContainerInstance: WebContainer | null;
  setStatus: Dispatch<
    SetStateAction<
      "idle" | "booting" | "ready" | "installing" | "running" | "error"
    >
  >;
  setError: Dispatch<SetStateAction<string | null>>;
  cwd: string;
};

const TerminalView = ({
  files,
  webContainerInstance,
  setStatus,
  cwd,
}: Props) => {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const activeProcessRef = useRef<WebContainerProcess | null>(null);

  useEffect(() => {
    if (!terminalContainerRef.current || !webContainerInstance) return;

    const packageJsonFile = files?.find(
      (f) =>
        f.parentId === undefined &&
        f.name === "package.json" &&
        f.type === "file",
    );
    let parsedPackageJsonFile: any = null;

    try {
      parsedPackageJsonFile = JSON.parse(packageJsonFile?.content || "");
    } catch {}

    const terminal = new Terminal({
      convertEol: true,
      theme: { background: "#1b1f27" },
    });

    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.open(terminalContainerRef.current);

    fitAddon.fit();

    let shellProcess: WebContainerProcess | null = null;

    // start shell
    (async () => {
      let promptReady = false;
      shellProcess = await webContainerInstance.spawn("jsh", [], {
        cwd: cwd,
      });

      const input = shellProcess.input.getWriter();

      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal.write(data);

            if (!promptReady && data.includes("❯")) {
              promptReady = true;

              if (parsedPackageJsonFile) {
                (async () => {
                  setStatus("installing");

                  // run npm install
                  terminal.write("npm install\n");
                  const installProcess = await webContainerInstance.spawn(
                    "npm",
                    ["install"],
                    {
                      cwd: cwd,
                    },
                  );
                  activeProcessRef.current = installProcess;
                  setStatus("installing");

                  installProcess.output.pipeTo(
                    new WritableStream({
                      write(data) {
                        terminal.write(data);
                      },
                    }),
                  );

                  const exitCode = await installProcess.exit;
                  activeProcessRef.current = null;
                  if (exitCode === 0) {
                    input.write("\r");
                  } else return;

                  if (parsedPackageJsonFile.scripts?.dev) {
                    input.write("npm run dev\n");
                  } else if (parsedPackageJsonFile.scripts?.start) {
                    input.write("npm start\n");
                  }

                  setStatus("ready");
                })();
              }

              setStatus("ready");

              // wire user input only after prompt is ready
              terminal.onData((data) => {
                // Handle Ctrl+C for killing npm install process
                if (data === "\u0003" && activeProcessRef.current) {
                  activeProcessRef.current.kill();
                  activeProcessRef.current = null;

                  terminal.write("^C");
                  input.write("\n");

                  setStatus("ready");

                  return;
                }
                input.write(data);
              });
            }
          },
        }),
      );
    })();

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });

    resizeObserver.observe(terminalContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      shellProcess?.kill();
      terminal.dispose();
    };
  }, [webContainerInstance]);

  if (!webContainerInstance) return null;

  return (
    <div
      ref={terminalContainerRef}
      className="h-full w-full pt-1 pl-1 bg-[#1b1f27]"
    />
  );
};
export default TerminalView;
