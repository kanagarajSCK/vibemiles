import React from 'react';
import { RatingStars } from '@/components/ui/RatingStars';
import { ReviewCard } from '@/components/cards/ReviewCard';
import { getReviewsForPackage } from '@/server/db/reviews';
import { ReviewCardSkeleton } from '@/components/ui/Skeleton';

export async function PackageReviewsSection({
  packageId,
  rating,
  reviewCount,
}: {
  packageId: string;
  rating: number;
  reviewCount: number;
}) {
  const reviews = await getReviewsForPackage(packageId);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">
          Traveler Reviews ({reviews.length > 0 ? reviews.length : reviewCount})
        </h2>
        <RatingStars rating={rating} reviewCount={reviews.length > 0 ? reviews.length : reviewCount} size="md" />
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">No Verified Traveler Reviews Yet</p>
          <p className="mt-1">Be the first verified adventurer to review this journey after your travel date!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <ReviewCard key={rev.id} review={rev} />
          ))}
        </div>
      )}
    </section>
  );
}

export function PackageReviewsSkeleton({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">
          Traveler Reviews ({reviewCount})
        </h2>
        <RatingStars rating={rating} reviewCount={reviewCount} size="md" />
      </div>
      <div className="space-y-4">
        {[...Array(Math.min(reviewCount || 2, 3))].map((_, i) => (
          <ReviewCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
