'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, MapPin, Heart, ArrowRight, Utensils, Compass, Mountain, Languages, Award, Sparkles } from 'lucide-react';
import { Package } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { RatingStars } from '@/components/ui/RatingStars';
import { Button } from '@/components/ui/Button';
import { useWishlist } from '@/context/WishlistContext';

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
  isWishlisted: propIsWishlisted,
}) => {
  const { isWishlisted: checkWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = propIsWishlisted !== undefined ? propIsWishlisted : checkWishlist(packageData.id);
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

  const meta = (packageData.metadata || {}) as Record<string, any>;
  const cat = category.toLowerCase();

  // Category specific extracts
  const foodCuisines = Array.isArray(meta.foodCuisines) ? meta.foodCuisines : (typeof meta.foodCuisines === 'string' && meta.foodCuisines ? [meta.foodCuisines] : []);
  const foodDietary = Array.isArray(meta.foodDietaryOptions) ? meta.foodDietaryOptions : (typeof meta.foodDietaryOptions === 'string' && meta.foodDietaryOptions ? [meta.foodDietaryOptions] : []);
  const foodFormat = meta.foodFormat || '';
  const foodHours = meta.foodOpeningTime && meta.foodClosingTime ? `${meta.foodOpeningTime} - ${meta.foodClosingTime}` : null;
  const foodCapacity = meta.foodTableCapacity ? `Seats ${meta.foodTableCapacity}` : (maxGroupSize ? `Max ${maxGroupSize}` : null);

  const advType = meta.advCategory || '';
  const advDifficulty = meta.advDifficulty || '';
  const advDuration = meta.advDurationHours ? `${meta.advDurationHours}h` : (durationDays > 0 ? `${durationDays}D / ${durationNights}N` : null);
  const advMinAge = meta.advMinAge ? `Age ${meta.advMinAge}+` : null;

  const guideSpecialization = meta.guideSpecialization || meta.guideServiceCategory || '';
  const guideLanguages = Array.isArray(meta.guideLanguages) ? meta.guideLanguages : (typeof meta.guideLanguages === 'string' && meta.guideLanguages ? [meta.guideLanguages] : []);
  const guideExperience = meta.guideExperienceYears ? `${meta.guideExperienceYears} Yrs Exp` : null;
  const guideTourFormat = meta.guideTourFormat || '';

  let priceUnit = '/ person';
  let ctaLabel = 'View Trip';
  if (cat === 'food') {
    priceUnit = '/ guest';
    ctaLabel = 'View Menu';
  } else if (cat === 'adventure') {
    priceUnit = '/ participant';
    ctaLabel = 'View Activity';
  } else if (cat === 'guide') {
    priceUnit = meta.guidePricingType === 'hourly' ? '/ hr' : meta.guidePricingType === 'half_day' ? '/ 4 hrs' : meta.guidePricingType === 'full_day' ? '/ day' : '/ booking';
    ctaLabel = 'View Guide';
  } else if (cat === 'villa' || cat === 'homestay' || cat === 'hostel') {
    priceUnit = '/ night';
    ctaLabel = 'View Stay';
  } else if (cat === 'cab') {
    priceUnit = '/ trip';
    ctaLabel = 'View Cab';
  }

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
          {(() => {
            const cat = category.toLowerCase();
            if (cat === 'devotional') {
              return (
                <Badge variant="warning" size="sm" className={cn('border-amber-400/50 bg-amber-950/85 text-amber-300 font-bold backdrop-blur-md inline-flex items-center gap-1', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
                  <span>🛕</span> DEVOTIONAL
                </Badge>
              );
            }
            if (cat === 'food') {
              return (
                <Badge variant="warning" size="sm" className={cn('border-orange-500/50 bg-orange-950/85 text-orange-200 font-bold backdrop-blur-md inline-flex items-center gap-1', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
                  <span>🍽️</span> FOOD EXPERIENCE
                </Badge>
              );
            }
            if (cat === 'adventure') {
              return (
                <Badge variant="brand" size="sm" className={cn('border-sky-500/50 bg-sky-950/85 text-sky-200 font-bold backdrop-blur-md inline-flex items-center gap-1', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
                  <span>🧗</span> ADVENTURE
                </Badge>
              );
            }
            if (cat === 'guide') {
              return (
                <Badge variant="brand" size="sm" className={cn('border-indigo-500/50 bg-indigo-950/85 text-indigo-200 font-bold backdrop-blur-md inline-flex items-center gap-1', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
                  <span>🧭</span> LOCAL GUIDE
                </Badge>
              );
            }
            if (cat === 'cab') {
              return (
                <Badge variant="brand" size="sm" className={cn('border-emerald-500/50 bg-emerald-950/85 text-emerald-200 font-bold backdrop-blur-md inline-flex items-center gap-1', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
                  <span>🚗</span> CAB SERVICE
                </Badge>
              );
            }
            if (cat === 'villa') {
              return (
                <Badge variant="brand" size="sm" className={cn('border-teal-500/50 bg-teal-950/85 text-teal-200 font-bold backdrop-blur-md inline-flex items-center gap-1', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
                  <span>🏡</span> VILLA
                </Badge>
              );
            }
            if (cat === 'homestay') {
              return (
                <Badge variant="brand" size="sm" className={cn('border-amber-500/50 bg-amber-950/85 text-amber-200 font-bold backdrop-blur-md inline-flex items-center gap-1', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
                  <span>🏠</span> HOMESTAY
                </Badge>
              );
            }
            if (cat === 'hostel') {
              return (
                <Badge variant="brand" size="sm" className={cn('border-purple-500/50 bg-purple-950/85 text-purple-200 font-bold backdrop-blur-md inline-flex items-center gap-1', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
                  <span>🛏️</span> HOSTEL
                </Badge>
              );
            }
            return (
              <Badge variant="brand" size="sm" className={cn('border-teal-700/50 bg-teal-900/80 text-teal-100 backdrop-blur-md', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
                {category.toUpperCase()}
              </Badge>
            );
          })()}
          {discountPercent > 0 && (
            <Badge variant="warning" size="sm" className={cn('border-amber-600 bg-amber-500 font-bold text-white', compact ? 'px-1.5 py-0 text-[9px]' : 'text-[10px]')}>
              {discountPercent}% OFF
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onWishlistToggle) {
              onWishlistToggle(id);
            } else {
              toggleWishlist(id, packageData);
            }
          }}
          className={cn(
            'absolute z-10 flex items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-90',
            compact ? 'right-2 top-2 h-7 w-7 sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8' : 'right-3 top-3 h-8 w-8 sm:h-9 sm:w-9',
            isWishlisted
              ? 'bg-rose-50/95 text-rose-500 ring-2 ring-rose-400/50 hover:bg-white'
              : 'bg-white/85 text-slate-700 hover:bg-white hover:text-rose-500'
          )}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isWishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
        >
          <Heart
            className={cn(
              compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
              'transition-all duration-200',
              isWishlisted
                ? 'fill-rose-500 text-rose-500 scale-110'
                : 'text-slate-600 hover:text-rose-500'
            )}
          />
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
          {/* Category-Aware Highlights Meta Row */}
          <div className={cn('flex items-center justify-between gap-2 text-slate-500', compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs')}>
            {cat === 'food' ? (
              <div className={cn('flex flex-wrap items-center', compact ? 'gap-1.5' : 'gap-2')}>
                {foodHours && (
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Clock className={cn('text-amber-600', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                    {foodHours}
                  </span>
                )}
                {foodCapacity && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Users className={cn('text-amber-600', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                    {foodCapacity}
                  </span>
                )}
                {!foodHours && !foodCapacity && foodFormat && (
                  <span className="flex items-center gap-1 font-medium text-amber-800">
                    <Utensils className={cn('text-amber-600', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                    {foodFormat}
                  </span>
                )}
              </div>
            ) : cat === 'adventure' ? (
              <div className={cn('flex flex-wrap items-center', compact ? 'gap-1.5' : 'gap-2')}>
                {advDuration && (
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Clock className={cn('text-sky-600', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                    {advDuration}
                  </span>
                )}
                {advDifficulty && (
                  <span className={cn(
                    'rounded-md px-1.5 py-0.5 font-bold uppercase tracking-wider',
                    compact ? 'text-[8px]' : 'text-[9px]',
                    advDifficulty.toLowerCase().includes('easy')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : advDifficulty.toLowerCase().includes('mod')
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  )}>
                    {advDifficulty}
                  </span>
                )}
                {advMinAge && (
                  <span className="text-slate-500 font-medium">
                    {advMinAge}
                  </span>
                )}
              </div>
            ) : cat === 'guide' ? (
              <div className={cn('flex flex-wrap items-center', compact ? 'gap-1.5' : 'gap-2')}>
                {guideExperience && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Award className={cn('text-indigo-600', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                    {guideExperience}
                  </span>
                )}
                {guideTourFormat && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Users className={cn('text-indigo-600', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                    {guideTourFormat}
                  </span>
                )}
                {!guideExperience && !guideTourFormat && guideSpecialization && (
                  <span className="flex items-center gap-1 font-medium text-indigo-700">
                    <Compass className={cn('text-indigo-600', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
                    {guideSpecialization}
                  </span>
                )}
              </div>
            ) : (
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
            )}

            {reviewCount > 0 ? (
              <RatingStars rating={rating} reviewCount={reviewCount} size="sm" />
            ) : (
              <span className={cn('font-medium text-slate-400', compact ? 'text-[9px]' : 'text-[10px]')}>
                ★ New Listing
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/packages/${slug}`} prefetch={true}>
            <h3 className={cn(
              'line-clamp-2 font-bold text-slate-900 transition-colors group-hover:text-teal-700',
              compact ? 'text-[13px] leading-tight sm:text-sm' : 'text-sm sm:text-base'
            )}>
              {name}
            </h3>
          </Link>

          {/* Category Context Tags */}
          {cat === 'food' && (foodCuisines.length > 0 || foodDietary.length > 0) && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {foodCuisines.slice(0, 2).map((c: string, i: number) => (
                <span key={i} className="inline-block rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-800 border border-amber-200/60">
                  {c}
                </span>
              ))}
              {foodDietary.slice(0, 2).map((d: string, i: number) => (
                <span key={i} className="inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-800 border border-emerald-200/60">
                  {d}
                </span>
              ))}
            </div>
          )}

          {cat === 'adventure' && (advType || advDifficulty) && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {advType && (
                <span className="inline-block rounded-md bg-sky-50 px-1.5 py-0.5 text-[9px] font-medium text-sky-800 border border-sky-200/60">
                  {advType}
                </span>
              )}
            </div>
          )}

          {cat === 'guide' && (guideLanguages.length > 0 || guideSpecialization) && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {guideLanguages.slice(0, 2).map((lang: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-0.5 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-medium text-indigo-800 border border-indigo-200/60">
                  <Languages className="w-2.5 h-2.5 text-indigo-600" /> {lang}
                </span>
              ))}
              {guideSpecialization && (
                <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
                  {guideSpecialization}
                </span>
              )}
            </div>
          )}
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
              <span className={cn('text-slate-500', compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs')}>{priceUnit}</span>
            </div>
          </div>

          <Link href={`/packages/${slug}`} prefetch={true}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />} className={cn('whitespace-nowrap', compact ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-[11px] sm:text-xs')}>
              {ctaLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
