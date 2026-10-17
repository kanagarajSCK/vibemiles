'use client';

import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TravelTypeId = 'solo' | 'couple' | 'family' | 'friends';

interface TravelTypeCardProps {
  id: TravelTypeId;
  image: string;
  title: string;
  subtitle: string;
  tagline: string;
  selected: boolean;
  onSelect: (id: TravelTypeId) => void;
  compact?: boolean;
}

export const TravelTypeCard: React.FC<TravelTypeCardProps> = ({
  id, image, title, subtitle, tagline, selected, onSelect, compact = false,
}) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${title} - ${subtitle}`}
      onClick={() => onSelect(id)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2',
        compact ? 'rounded-lg border-slate-200' : 'border-2',
        selected
          ? 'border-teal-600 shadow-md shadow-teal-100/80 scale-[1.01]'
          : 'border-slate-200 hover:border-teal-300 hover:-translate-y-0.5 hover:shadow-sm'
      )}
    >
      <div className={cn('relative w-full overflow-hidden bg-slate-100', compact ? 'aspect-16/10' : 'aspect-4/3')}>
        <Image
          src={image}
          alt={`${title} travel`}
          fill
          sizes="(max-width: 640px) 50vw, 180px"
          unoptimized
          className={cn('object-cover transition-transform duration-300', selected ? 'scale-[1.03]' : 'group-hover:scale-[1.04]')}
          priority={false}
        />
        <div className="absolute inset-x-0 bottom-0 h-5 bg-linear-to-t from-black/25 to-transparent" />
        <div
          className={cn(
            'absolute top-1.5 right-1.5 flex items-center justify-center rounded-full border-2 transition-all duration-200 shadow-sm',
            compact ? 'h-4 w-4' : 'h-5 w-5',
            selected ? 'border-teal-600 bg-teal-600 scale-100 opacity-100' : 'border-white/60 bg-white/70 scale-75 opacity-0 group-hover:scale-90 group-hover:opacity-60'
          )}
          aria-hidden="true"
        >
          {selected && <Check className={compact ? 'h-2.5 w-2.5 text-white' : 'h-3 w-3 text-white'} strokeWidth={3} />}
        </div>
        <div className={cn(
          'absolute bottom-1.5 left-1.5 rounded-full font-bold uppercase tracking-wider transition-all duration-200',
          compact ? 'px-1.5 py-0.5 text-[7px]' : 'px-2 py-0.5 text-[9px]',
          selected ? 'bg-teal-600 text-white' : 'bg-black/50 text-white/90 backdrop-blur-sm'
        )}>
          {tagline}
        </div>
      </div>
      <div className={cn('transition-colors duration-200', compact ? 'px-2 py-1.5' : 'px-3 py-2.5', selected ? 'bg-teal-50' : 'bg-white')}>
        <p className={cn('font-bold leading-tight transition-colors', compact ? 'text-[12px]' : 'text-sm', selected ? 'text-teal-800' : 'text-slate-800')}>{title}</p>
        <p className={cn('mt-0.5 leading-tight transition-colors', compact ? 'text-[10px]' : 'text-xs', selected ? 'text-teal-600' : 'text-slate-400')}>{subtitle}</p>
      </div>
    </button>
  );
};
