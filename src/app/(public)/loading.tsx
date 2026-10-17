import React from 'react';
import { Skeleton, PackageCardSkeleton } from '@/components/ui/Skeleton';

export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 sm:px-6 lg:px-8">
      {/* Header Bar Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
      </div>

      {/* Grid of Card Skeletons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <PackageCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
