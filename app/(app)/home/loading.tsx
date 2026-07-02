import { Skeleton, SkeletonCard } from "@/components/Skeleton";

/** Home ghost: top bar, ring + streak snapshot, then feed cards. */
export default function HomeLoading() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-11 w-11 rounded-pill" />
      </div>
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-[184px] w-[184px] rounded-pill" />
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-14 w-full" />
      </div>
      <div className="mt-8 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}
