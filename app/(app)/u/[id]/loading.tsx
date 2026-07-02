import { Skeleton } from "@/components/Skeleton";

/** Member profile ghost: avatar + identity, stat tiles, heatmap. */
export default function MemberProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-pill" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="mt-6 h-40 w-full" />
      <Skeleton className="mt-6 h-48 w-full" />
    </main>
  );
}
