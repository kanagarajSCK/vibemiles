'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, MapPin, Heart, ArrowRight } from 'lucide-react';
import { Package } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { RatingStars } from '@/components/ui/RatingStars';
import { Button } from '@/components/ui/Button';

export interface PackageCardProps {
  packageData: Package;
  compact?: boolean;
  onWishlistToggle?: (id: string) => void;
  isWishlisted?: boolean;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  packageData,
  compact = false,
  onWishlistToggle,
  isWishlisted = false,
}) => {
  const {
    id,
    slug,
    name,
    destinationName,
    state,
    durationDays,
    durationNights,
    maxGroupSize,
    basePrice,
    discountPercent,
    finalPrice,
    images,
    rating,
    reviewCount,
    category,
  } = packageData;

  const fallbackImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
  const [imgSrc, setImgSrc] = React.useState(images[0] || fallbackImage);

  return (
    <div className={cn(
      'group flex flex-col overflow-hidden border border-slate-200 bg-white shadow-card shadow-card-hover transition-all duration-300',
      compact ? 'package-card-compact rounded-lg sm:rounded-xl' : 'rounded-xl sm:rounded-2xl'
    )}>
      {/* Media & Overlay */}
      <div className={cn(
        'relative w-full overflow-hidden bg-slate-100',
        compact ? 'aspect-[2.1/1] sm:aspect-[2.5/1]' : 'aspect-4/3'
      )}>
        <Image
          src={imgSrc}
          alt={name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          unoptimized
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgSrc(fallbackImage)}
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className={cn('absolute z-10 flex flex-wrap', compact ? 'left-2 top-2 gap-1 sm:left-2.5 sm:top-2.5' : 'left-3 top-3 gap-1.5')}>
          <Badge variant="brand" size="sm" className={cn('border-teal-700/50 bg-teal-900/80 text-teal-100 backdrop-blur-md', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
            {category.toUpperCase()}
          </Badge>
          {discountPercent > 0 && (
            <Badge variant="warning" size="sm" className={cn('border-amber-600 bg-amber-500 font-bold text-white', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
              {discountPercent}% OFF
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onWishlistToggle?.(id);
          }}
          className={cn(
            'absolute z-10 flex items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md backdrop-blur-md transition-transform hover:scale-110 hover:bg-white active:scale-95',
            compact ? 'right-2 top-2 h-7 w-7 sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8' : 'right-3 top-3 h-8 w-8 sm:h-9 sm:w-9'
          )}
          aria-label="Add to wishlist"
        >
          <Heart className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
        </button>

        {/* Destination Chip */}
        <div className={cn('absolute bottom-3 left-3 z-10 flex items-center gap-1 font-semibold text-white', compact ? 'bottom-2 left-2 text-[10px] sm:bottom-2.5 sm:left-2.5' : 'text-[11px]')}>
          <MapPin className={cn('text-teal-400', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          <span>{destinationName}, {state}</span>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        'flex flex-1 flex-col justify-between',
        compact ? 'space-y-2 p-2.5 sm:p-3' : 'space-y-3 p-3 sm:space-y-4 sm:p-4'
      )}>
        <div className="space-y-2">
          <div className={cn('flex items-center justify-between gap-2 text-slate-500', compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs')}>
            <div className={cn('flex items-center', compact ? 'gap-1.5 sm:gap-2' : 'gap-2 sm:gap-3')}>
              <span className="flex items-center gap-1">
                <Clock className={cn('text-teal-700', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                {durationDays}D / {durationNights}N
              </span>
              <span className="flex items-center gap-1">
                <Users className={cn('text-teal-700', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                Max {maxGroupSize}
              </span>
            </div>
            <RatingStars rating={rating} reviewCount={reviewCount} size="sm" />
          </div>

          <Link href={`/packages/${slug}`} prefetch={true}>
            <h3 className={cn(
              'line-clamp-2 font-bold text-slate-900 transition-colors group-hover:text-teal-700',
              compact ? 'text-[13px] leading-tight sm:text-sm' : 'text-sm sm:text-base'
            )}>
              {name}
            </h3>
          </Link>
        </div>

        {/* Price & CTA */}
        <div className={cn('flex items-end justify-between border-t border-slate-100', compact ? 'gap-2 pt-2' : 'gap-3 pt-3')}>
          <div>
            {discountPercent > 0 && (
              <span className={cn('block text-slate-400 line-through', compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs')}>
                {formatCurrency(basePrice)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className={cn('font-medium text-slate-500', compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs')}>From</span>
              <span className={cn('font-extrabold text-teal-800', compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg')}>
                {formatCurrency(finalPrice)}
              </span>
              <span className={cn('text-slate-500', compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs')}>/ person</span>
            </div>
          </div>

          <Link href={`/packages/${slug}`} prefetch={true}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />} className={cn('whitespace-nowrap', compact ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-[11px] sm:text-xs')}>
              View Trip
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
