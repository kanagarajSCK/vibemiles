import React from 'react';
import { Skeleton, DestinationCardSkeleton } from '@/components/ui/Skeleton';

export default function DestinationsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-3 max-w-2xl">
        <Skeleton className="h-5 w-32 rounded-full" />
        <Skeleton className="h-10 w-80 rounded-lg" />
        <Skeleton className="h-4 w-full rounded" />
      </div>

      {/* Search Input Bar Skeleton */}
      <div className="max-w-md">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>

      {/* Grid of Destination Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <DestinationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
