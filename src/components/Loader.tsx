import { cn } from "@/lib/utils";

export default function Loader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full h-12 w-12 border-b-2 border-white/60",
        className,
      )}
    />
  );
}
