import { Skeleton } from "@/components/ui/skeleton"

export function ResultSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-8">
      {/* Skeleton for Tab triggers */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Main Content Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 space-y-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="pt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  )
}