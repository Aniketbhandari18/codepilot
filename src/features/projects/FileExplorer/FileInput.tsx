import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Doc } from "../../../../convex/_generated/dataModel";
import { ChevronRightIcon } from "lucide-react";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";

type Mode =
  | { type: "create"; itemType: "folder" | "file" }
  | { type: "rename"; itemType: "folder" | "file"; file: Doc<"files"> };

type Props = {
  mode: Mode;
  siblings: Doc<"files">[];
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

const FileInput = ({ mode, siblings, onSubmit, onCancel }: Props) => {
  const defaultValue = mode.type === "rename" ? mode.file.name : undefined;

  const [name, setName] = useState(defaultValue || "");
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // autoFocus inside input is not working properly possibly due to shadcn/radix ContextMenu closing which might be stealing focus.
    // This somehow works, i don't understand why but it works, so here we are.
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      if (mode.type === "rename") {
        // autoselect filename without extension for rename
        // If no extension, select all
        const lastDotIndex = name.lastIndexOf(".");

        if (lastDotIndex > 0) {
          inputRef.current?.setSelectionRange(0, lastDotIndex);
        } else {
          inputRef.current?.select();
        }
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const normalizedName = trimmedName.toLowerCase();

    if (!trimmedName) {
      setError("A file or folder name must be provided");
      return;
    }

    if (mode.type === "rename" && trimmedName === defaultValue) {
      onCancel();
      return;
    }

    const existing = siblings.find((f) => {
      if (f.normalizedName !== normalizedName) return false;

      if (mode.type === "rename") {
        return f._id !== mode.file._id;
      }

      return true;
    });

    if (existing) {
      setError(
        `A file or folder "${trimmedName}" already exists at this location. Please choose a different name`,
      );
      return;
    }

    onSubmit(trimmedName);
  };

  // If the user clicks away with an empty input or an existing error, we treat it as a cancel
  // Error is only shown when the user explicitly submits via Enter.
  const handleOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (error) {
      onCancel();
      setError(null);
      return;
    }

    if (!name.trim()) {
      onCancel();
      return;
    }

    handleSubmit();
  };

  return (
    <div className="flex gap-2 items-center mb-1.25">
      <div className="flex">
        {mode.itemType === "folder" && <ChevronRightIcon className="w-5 h-5" />}

        {mode.itemType === "file" && (
          <FileIcon className="w-7 h-5 ml-4" fileName={name.trim()} />
        )}

        {mode.itemType === "folder" && (
          <FolderIcon className="w-5 h-5" folderName={name.trim()} />
        )}
      </div>
      <div className="h-6 -ml-1">
        <input
          // autoFocus
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          onBlur={handleOnBlur}
          onKeyDown={handleKeyDown}
          className={`
          w-full rounded 
          bg-white/10 border outline-none
          ${error ? "border-red-500" : "border-white/30 focus:border-cyan-900"}
        `}
        />
        {error && (
          <div className="text-sm bg-red-600 px-1 relative z-50 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
export default FileInput;
