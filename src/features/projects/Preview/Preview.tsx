import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2Icon,
  RefreshCwIcon,
  SquareArrowOutUpRight,
} from "lucide-react";
import { useState } from "react";

type Props = {
  url: string | null;
  status: "idle" | "booting" | "ready" | "installing" | "running" | "error";
};

const Preview = ({ url, status }: Props) => {
  const [reloadKey, setReloadKey] = useState(0);

  const reloadPreivew = () => {
    setReloadKey((prev) => prev + 1);
  };

  if (!url) {
    if (status === "booting") {
      return (
        <div className="size-full flex items-center justify-center text-muted-foreground bg-background-secondary">
          <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
            <Loader2Icon className="size-6 animate-spin" />
            <p className="text-sm font-medium">Booting WebContainer...</p>
          </div>
        </div>
      );
    }
    if (status === "installing") {
      return (
        <div className="size-full flex items-center justify-center text-muted-foreground bg-background-secondary">
          <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
            <Loader2Icon className="size-6 animate-spin" />
            <p className="text-sm font-medium">Installing dependencies...</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-full flex items-center justify-center bg-background-secondary">
          No preview yet
        </div>
      );
    }
  }
  return (
    <div className="h-full">
      <div className="flex justify-between items-center gap-1 bg-[#1a1d23] p-1">
        {/* Reload */}
        <Button
          size="sm"
          variant="ghost"
          className="h-full p-2"
          disabled={!url}
          onClick={reloadPreivew}
          title="Restart container"
        >
          <RefreshCwIcon className="size-4" />
        </Button>

        {/* Url */}
        <div className="flex-1">
          <Input
            value={url}
            readOnly
            className="rounded-full bg-[#11151b]! text-white/70 focus-visible:ring-0"
          />
        </div>

        {/* Open preview in seperate tab */}
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="h-full p-2"
          disabled={!url}
          title="Open Preivew in seperate tab"
        >
          <a href={url} target="_blank">
            <SquareArrowOutUpRight className="size-4" />
          </a>
        </Button>
      </div>

      {/* Preview iframe*/}
      <iframe key={reloadKey} src={url} className="h-full w-full bg-white" />
    </div>
  );
};
export default Preview;
