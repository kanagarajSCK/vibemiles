import React from 'react';
import Link from 'next/link';
import { Clock, MapPin, ArrowRight, Star, Zap, Clock3, Bird, AlertCircle, Sunset } from 'lucide-react';
import { Deal, DealType } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DealCardProps {
  deal: Deal;
  timeRemaining?: string;
}

const DEAL_TYPE_CONFIG: Record<DealType, { label: string; emoji: string; badgeClass: string }> = {
  flash:        { label: 'Flash Deal',     emoji: '⚡', badgeClass: 'bg-rose-600 text-white' },
  limited_time: { label: 'Limited Time',   emoji: '⏳', badgeClass: 'bg-orange-500 text-white' },
  early_bird:   { label: 'Early Bird',     emoji: '🐦', badgeClass: 'bg-sky-600 text-white' },
  last_minute:  { label: 'Last Minute',    emoji: '🚀', badgeClass: 'bg-violet-600 text-white' },
  weekend:      { label: 'Weekend Deal',   emoji: '🌅', badgeClass: 'bg-amber-500 text-white' },
  family:       { label: 'Family Deal',    emoji: '👨‍👩‍👧‍👦', badgeClass: 'bg-teal-600 text-white' },
  couple:       { label: 'Couple Deal',    emoji: '💑', badgeClass: 'bg-rose-500 text-white' },
  group:        { label: 'Group Deal',     emoji: '🎒', badgeClass: 'bg-indigo-600 text-white' },
  seasonal:     { label: 'Seasonal Offer', emoji: '🍂', badgeClass: 'bg-emerald-700 text-white' },
  budget:       { label: 'Budget Deal',    emoji: '💰', badgeClass: 'bg-lime-600 text-white' },
};

export const DealCard: React.FC<DealCardProps> = ({ deal, timeRemaining }) => {
  const {
    id,
    packageSlug,
    packageName,
    packageImage,
    destinationName,
    state,
    durationDays,
    durationNights,
    dealType,
    title,
    discountType,
    discountValue,
    originalPrice,
    finalPrice,
    savingsAmount,
    rating,
    reviewCount,
    endDate,
    usageLimit,
    usedCount,
  } = deal;

  const config = DEAL_TYPE_CONFIG[dealType];
  const seatsLeft = usageLimit ? usageLimit - usedCount : null;
  const isFlash = dealType === 'flash';

  // Compute expiry display on client (using prop if provided)
  const expiry = timeRemaining ?? computeExpiry(endDate);

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300
      ${isFlash ? 'border-rose-200 hover:border-rose-400 hover:shadow-rose-100/60' : 'border-amber-100 hover:border-amber-300 hover:shadow-amber-50/60'}
      hover:shadow-lg bg-white`}>

      {/* Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <img
          src={packageImage}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

        {/* Deal Type Badge */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide shadow-lg z-10 ${config.badgeClass}`}>
          <span>{config.emoji}</span> {config.label}
        </span>

        {/* Discount Bubble */}
        <div className="absolute top-3 right-3 flex flex-col items-center justify-center h-14 w-14 rounded-full bg-white shadow-xl border-2 border-amber-400 z-10">
          <span className="text-sm font-black text-amber-600 leading-none">
            {discountType === 'percentage' ? `${discountValue}%` : `₹${(discountValue / 1000).toFixed(0)}K`}
          </span>
          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">OFF</span>
        </div>

        {/* Location chip */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs font-semibold text-white z-10">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>{destinationName}, {state}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {durationDays}D / {durationNights}N
          </span>
          <span className="flex items-center gap-1 font-semibold text-amber-700">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {rating} ({reviewCount})
          </span>
        </div>

        {/* Title */}
        <Link href={`/packages/${packageSlug}`}>
          <h3 className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors leading-snug">
            {title}
          </h3>
        </Link>

        {/* Price block */}
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 px-3 py-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 line-through block">{formatCurrency(originalPrice)}</span>
              <span className="text-xl font-black text-amber-700">{formatCurrency(finalPrice)}</span>
              <span className="text-xs text-slate-500"> / person</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">You Save</span>
              <span className="text-base font-extrabold text-emerald-600">{formatCurrency(savingsAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-0.5">
            {expiry && (
              <span
                suppressHydrationWarning
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold
                ${isFlash ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}
              >
                <Clock3 className="w-3 h-3" /> {expiry}
              </span>
            )}
            {seatsLeft !== null && seatsLeft <= 10 && (
              <span className="block text-[10px] font-semibold text-rose-600">
                🔥 Only {seatsLeft} seats left!
              </span>
            )}
          </div>

          <Link href={`/packages/${packageSlug}`}>
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold px-3 py-2 transition-colors shadow-sm">
              View Deal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

function computeExpiry(endDate: string): string {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 7) {
    return `Ends ${new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  }
  if (days > 0) return `Ends in ${days}d ${hours}h`;
  return `Ends in ${hours}h`;
}
