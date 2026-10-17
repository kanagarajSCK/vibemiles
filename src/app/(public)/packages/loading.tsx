import React from 'react';
import { Skeleton, PackageCardSkeleton } from '@/components/ui/Skeleton';

export default function PackagesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-5 sm:px-6 sm:py-8 sm:space-y-8 lg:px-8 lg:py-10">
      {/* Header Banner Skeleton */}
      <div className="rounded-2xl bg-slate-900 p-6 sm:p-8 text-white space-y-4">
        <Skeleton className="h-5 w-28 rounded-full bg-slate-800" />
        <Skeleton className="h-10 w-72 rounded-lg bg-slate-800" />
        <Skeleton className="h-4 w-96 max-w-full rounded bg-slate-800" />
      </div>

      {/* Main Grid + Sidebar Filter */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 lg:gap-8">
        {/* Sidebar Filters Skeleton */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </aside>

        {/* Packages Results Skeleton Grid */}
        <main className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <PackageCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
