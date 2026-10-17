import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  reviewCount?: number;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  showNumber = true,
  reviewCount,
  className,
}) => {
  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: maxStars }).map((_, i) => {
          const isFilled = i < Math.floor(rating);
          const isHalf = i === Math.floor(rating) && rating % 1 >= 0.4;
          return (
            <Star
              key={i}
              className={cn(
                starSizes[size],
                isFilled || isHalf
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-100 text-slate-300'
              )}
            />
          );
        })}
      </div>
      {showNumber && (
        <span className={cn('font-semibold text-slate-800', textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={cn('text-slate-500', textSizes[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
};
