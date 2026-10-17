import React from 'react';
import { CheckCircle2, ThumbsUp } from 'lucide-react';
import { Review } from '@/types';
import { RatingStars } from '@/components/ui/RatingStars';
import { formatDate } from '@/lib/utils';

export interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const {
    customerName,
    customerAvatar,
    rating,
    title,
    content,
    isVerifiedBooking,
    providerReply,
    providerReplyAt,
    helpfulCount,
    createdAt,
  } = review;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-teal-50">
            {customerAvatar ? (
              <img src={customerAvatar} alt={customerName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-teal-700">
                {customerName[0]}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <span>{customerName}</span>
              {isVerifiedBooking && (
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Traveler
                </span>
              )}
            </h4>
            <span className="text-xs text-slate-400">{formatDate(createdAt)}</span>
          </div>
        </div>

        <RatingStars rating={rating} size="sm" showNumber={false} />
      </div>

      <div className="space-y-1">
        <h5 className="font-bold text-slate-900 text-sm">{title}</h5>
        <p className="text-sm text-slate-600 leading-relaxed">{content}</p>
      </div>

      {providerReply && (
        <div className="rounded-xl bg-slate-50 border-l-4 border-teal-600 p-3.5 text-xs space-y-1">
          <span className="font-bold text-teal-800">Response from Tour Provider:</span>
          <p className="text-slate-600">{providerReply}</p>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
        <button className="flex items-center gap-1 hover:text-teal-700 transition-colors">
          <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({helpfulCount})
        </button>
      </div>
    </div>
  );
};
