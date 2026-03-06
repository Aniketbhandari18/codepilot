import { Skeleton } from "@/components/ui/skeleton";

const Row = ({ indent = 0 }: { indent?: number }) => {
  return (
    <div
      className="flex items-center gap-2 py-1"
      style={{ paddingLeft: `${indent * 24}px` }}
    >
      <Skeleton className="h-4 w-4 rounded-full shrink-0" />
      <Skeleton className="h-3.5 w-full" />
    </div>
  );
};

const FileExplorerSkeleton = () => {
  return (
    <div className="space-y-1 px-1">
      <Row />
      <Row />

      <Row indent={1} />

      <Row indent={2} />
      <Row indent={2} />

      <Row indent={1} />

      <Row />
      <Row />
      <Row />
      <Row />
    </div>
  );
};

export default FileExplorerSkeleton;
