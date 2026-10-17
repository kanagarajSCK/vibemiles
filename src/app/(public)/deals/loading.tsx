import React from 'react';
import { Skeleton, DealCardSkeleton } from '@/components/ui/Skeleton';

export default function DealsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Hero Banner Skeleton */}
      <div className="relative overflow-hidden bg-slate-900 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <Skeleton className="h-6 w-36 rounded-full bg-slate-800" />
          <Skeleton className="h-12 w-96 max-w-full rounded-lg bg-slate-800" />
          <Skeleton className="h-5 w-80 max-w-full rounded bg-slate-800" />
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl w-full px-4 py-8 space-y-8 sm:px-6 lg:px-8">
        {/* Deal Types Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-xl" />
          ))}
        </div>

        {/* Deals Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <DealCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
