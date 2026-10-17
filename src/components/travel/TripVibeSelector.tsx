'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TripVibeSelectorProps {
  label: string;
  vibes: string[];
  selected: string;
  onSelect: (vibe: string) => void;
}

export const TripVibeSelector: React.FC<TripVibeSelectorProps> = ({
  label,
  vibes,
  selected,
  onSelect,
}) => {
  const handleClick = (vibe: string) => {
    onSelect(selected === vibe ? '' : vibe);
  };

  return (
    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {vibes.map((vibe) => {
          const isSelected = selected === vibe;
          return (
            <button
              key={vibe}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleClick(vibe)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1',
                'active:scale-95',
                isSelected
                  ? 'border-teal-700 bg-teal-700 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
              )}
            >
              {vibe}
            </button>
          );
        })}
      </div>
    </div>
  );
};
