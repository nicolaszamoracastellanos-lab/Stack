import { Skeleton, SkeletonCard } from "@/components/Skeleton";

/** Groups list ghost: heading then group cards. */
export default function GroupsLoading() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <Skeleton className="h-9 w-40" />
      <div className="mt-6 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}
