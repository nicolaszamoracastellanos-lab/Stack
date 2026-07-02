import { Skeleton, SkeletonCard } from "@/components/Skeleton";

/** Group detail ghost: header, recap block, member rows, feed. */
export default function GroupDetailLoading() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-pill" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="mt-6 h-40 w-full" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="mt-6 space-y-4">
        <SkeletonCard />
      </div>
    </main>
  );
}
