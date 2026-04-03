import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded-lg", className)} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm">
      <Skeleton className="w-10 h-10 rounded-xl mb-3" />
      <Skeleton className="w-16 h-8 mb-1" />
      <Skeleton className="w-24 h-3 mb-2" />
      <Skeleton className="w-20 h-3" />
    </div>
  );
}

export function FamilyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-11 h-11 rounded-full" />
        <div>
          <Skeleton className="w-20 h-4 mb-1" />
          <Skeleton className="w-14 h-3" />
        </div>
      </div>
      <Skeleton className="w-full h-3 mb-3" />
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
      <Skeleton className="w-16 h-5 rounded-full" />
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="w-12 h-4" />
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <Skeleton className="w-32 h-4 mb-1" />
        <Skeleton className="w-24 h-3" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="w-48 h-8 mb-2" />
          <Skeleton className="w-36 h-4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-32 h-10 rounded-xl" />
          <Skeleton className="w-28 h-10 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="w-full h-64 rounded-2xl" />
        </div>
        <Skeleton className="w-full h-64 rounded-2xl" />
      </div>
    </div>
  );
}
