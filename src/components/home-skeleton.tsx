import { Skeleton } from "@/components/ui/skeleton";

export function HomeSkeleton() {
  return (
    <div className="space-y-8 px-4 py-6 md:px-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-40 shrink-0">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="mt-2 h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
