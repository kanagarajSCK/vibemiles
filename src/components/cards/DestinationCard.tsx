import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { Destination } from '@/types';
import { RatingStars } from '@/components/ui/RatingStars';

export interface DestinationCardProps {
  destination: Destination;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({ destination }) => {
  const { slug, name, state, heroImage, packageCount, rating, isTrending } = destination;

  return (
    <Link href={`/destinations/${slug}`} className="group relative flex aspect-auto flex-col overflow-hidden rounded-xl bg-white shadow-card shadow-card-hover sm:aspect-[4/5] sm:rounded-2xl">
      <div className="relative aspect-[1.35/1] w-full shrink-0 overflow-hidden bg-slate-100 sm:absolute sm:inset-0 sm:h-full">
        <Image
          src={heroImage}
          alt={`${name}, ${state}`}
          fill
          sizes="(max-width: 359px) 100vw, (max-width: 639px) 50vw, (max-width: 1023px) 50vw, 25vw"
          unoptimized
          className="object-cover transition-transform duration-700 group-hover:scale-105 sm:opacity-85"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent sm:block" />

      {/* Top Trending Badge */}
      {isTrending && (
        <div className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-1 text-[10px] font-bold text-white shadow-md sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
          🔥 Trending Destination
        </div>
      )}

      {/* Content at Bottom */}
      <div className="flex min-h-0 flex-1 flex-col justify-end p-2.5 text-slate-900 sm:absolute sm:inset-x-0 sm:bottom-0 sm:p-5 sm:text-white">
        <div className="mb-1 hidden items-center gap-1 text-[10px] font-semibold leading-tight text-teal-700 sm:flex sm:gap-1.5 sm:text-xs sm:text-teal-300">
          <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          <span>{state}, India</span>
        </div>

        <h3 className="text-sm font-bold leading-tight text-slate-900 transition-colors group-hover:text-teal-700 sm:text-xl sm:text-white sm:group-hover:text-teal-300">
          {name}
        </h3>

        <div className="mt-1 flex items-center justify-between gap-1 border-t border-slate-100 pt-1.5 text-[10px] leading-tight text-slate-500 sm:mt-2 sm:border-white/10 sm:pt-3 sm:text-xs sm:text-slate-300">
          <span>{packageCount} Packages</span>
          <div className="destination-card-rating flex shrink-0 items-center gap-1 font-semibold text-amber-500 sm:text-amber-300">
            <RatingStars rating={rating} showNumber size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
};
