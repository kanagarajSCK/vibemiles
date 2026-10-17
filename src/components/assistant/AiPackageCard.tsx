'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Clock, ArrowRight, Tag } from 'lucide-react';
import type { Package } from '@/types';
import { Button } from '@/components/ui/Button';

interface AiPackageCardProps {
  packageData: Package;
  onSelect?: (pkg: Package) => void;
}

export const AiPackageCard: React.FC<AiPackageCardProps> = ({ packageData, onSelect }) => {
  const thumbnail = packageData.images?.[0] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80';
  const hasDiscount = packageData.discountPercent > 0;

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden text-left group">
      {/* Thumbnail */}
      <div className="relative w-full sm:w-44 h-36 sm:h-auto shrink-0 bg-slate-100 overflow-hidden">
        <Image
          src={thumbnail}
          alt={packageData.name}
          fill
          sizes="(max-width: 640px) 100vw, 180px"
          unoptimized
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {packageData.category}
          </span>
          {hasDiscount && (
            <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Tag className="w-2.5 h-2.5" /> {packageData.discountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 truncate">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{packageData.destinationName}, {packageData.state}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 shrink-0">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{packageData.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({packageData.reviewCount})</span>
            </div>
          </div>

          <Link href={`/packages/${packageData.slug}`} className="block">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
              {packageData.name}
            </h4>
          </Link>

          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {packageData.durationDays}D / {packageData.durationNights}N
            </span>
            <span className="text-slate-300">•</span>
            <span className="truncate text-slate-600">
              By {packageData.providerName || 'Verified Host'}
            </span>
          </div>

          {packageData.highlights && packageData.highlights.length > 0 && (
            <p className="text-[11px] text-slate-600 line-clamp-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <span className="font-semibold text-emerald-800">Highlights: </span>
              {packageData.highlights.slice(0, 3).join(' • ')}
            </p>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 gap-2">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Price</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-emerald-700">
                ₹{packageData.finalPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{packageData.basePrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <Link href={`/packages/${packageData.slug}`}>
            <Button
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs group-hover:shadow-md flex items-center gap-1.5 py-1.5 px-3"
              onClick={() => onSelect?.(packageData)}
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
