'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PACKAGE_CATEGORIES, ROUTES } from '@/constants';
import { TravelTypeSelector, TRAVEL_TYPES, type TravelTypeId } from '@/components/travel/TravelTypeSelector';
import { DestinationAutocomplete, type DestinationOption } from '@/components/travel/DestinationAutocomplete';

export function HomeHeroSearch() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search state
  const [destination, setDestination] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<DestinationOption | null>(null);
  const [category, setCategory] = useState('');
  const [travelDate, setTravelDate] = useState('2026-10-01');
  const [travelType, setTravelType] = useState<TravelTypeId | ''>('');
  const [tripVibe, setTripVibe] = useState('');

  // Companion popover
  const [companionOpen, setCompanionOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCompanionOpen(false);
      }
    };
    if (companionOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [companionOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (selectedDestination) {
      params.set('destinationId', selectedDestination.id);
      params.set('destinationSlug', selectedDestination.slug || '');
    }
    if (category) params.set('category', category);
    if (travelDate) params.set('travelDate', travelDate);
    if (travelType) params.set('travelType', travelType);
    if (tripVibe) params.set('vibe', tripVibe);

    startTransition(() => {
      router.push(`${ROUTES.PACKAGES}?${params.toString()}`);
    });
  };

  const activeType = TRAVEL_TYPES.find((t) => t.id === travelType);
  const companionLabel = activeType
    ? `${activeType.emoji} ${activeType.title}${tripVibe ? ` · ${tripVibe}` : ''}`
    : "Who's coming?";

  return (
    <div className="mx-auto mt-4 w-full max-w-105 rounded-2xl border border-white/70 bg-white/95 p-3 text-slate-900 shadow-2xl backdrop-blur-xl sm:mt-10 sm:max-w-4xl sm:border-white/20 sm:p-6">
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {/* Destination */}
          <div className="space-y-1 relative z-30">
            <label className="flex items-center gap-1 text-xs font-semibold uppercase leading-3 tracking-wider text-slate-600 sm:leading-normal">
              <MapPin className="w-3.5 h-3.5 text-teal-600" /> Destination
            </label>
            <DestinationAutocomplete
              value={destination}
              onChange={(value) => {
                setDestination(value);
                setSelectedDestination(null);
              }}
              onSelect={setSelectedDestination}
            />
          </div>

          {/* Who's Coming Along? — popover trigger */}
          <div className="space-y-1" ref={popoverRef}>
            <label className="flex items-center gap-1 text-xs font-semibold uppercase leading-3 tracking-wider text-slate-600 sm:leading-normal">
              <Users className="w-3.5 h-3.5 text-teal-600" /> Travelling With
            </label>
            <div className="relative">
              <button
                type="button"
                id="companion-trigger"
                aria-haspopup="dialog"
                aria-expanded={companionOpen}
                onClick={() => setCompanionOpen((o) => !o)}
                className="flex min-h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[15px] focus:border-teal-600 focus:bg-white focus:outline-none hover:border-teal-400 transition-colors sm:min-h-0 sm:py-2 sm:text-sm"
              >
                <span className={travelType ? 'text-teal-800 font-semibold' : 'text-slate-400'}>
                  {companionLabel}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    companionOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Popover */}
              {companionOpen && (
                <div
                  role="dialog"
                  aria-label="Who's coming along?"
                  className="absolute top-full left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-0 z-100 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-105 max-h-[75vh] sm:max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-150"
                >
                  <div className="mb-3 space-y-0.5">
                    <p className="font-bold text-sm text-slate-900">Who&apos;s Coming Along?</p>
                    <p className="text-xs text-slate-400">Tell us who you&apos;re travelling with</p>
                  </div>
                  <TravelTypeSelector
                    selected={travelType}
                    onSelect={setTravelType}
                    selectedVibe={tripVibe}
                    onSelectVibe={setTripVibe}
                    compact
                  />
                  {travelType && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setTravelType('');
                          setTripVibe('');
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompanionOpen(false)}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
                      >
                        Done ✓
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Trip Category */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-semibold uppercase leading-3 tracking-wider text-slate-600 sm:leading-normal">
              <Search className="w-3.5 h-3.5 text-teal-600" /> Trip Category
            </label>
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none sm:min-h-0 sm:py-2 sm:text-sm"
            >
              <option value="">All Categories</option>
              {PACKAGE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Travel Date */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-semibold uppercase leading-3 tracking-wider text-slate-600 sm:leading-normal">
              <Calendar className="w-3.5 h-3.5 text-teal-600" /> Travel Date
            </label>
            <input
              type="date"
              name="travelDate"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              min="2026-09-18"
              className="min-h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none cursor-pointer sm:min-h-0 sm:py-2 sm:text-sm"
            />
          </div>
        </div>

        {/* Hidden inputs + submit */}
        <input type="hidden" name="destinationId" value={selectedDestination?.id ?? ''} />
        <input type="hidden" name="destinationSlug" value={selectedDestination?.slug ?? ''} />
        <input type="hidden" name="travelType" value={travelType} />
        <input type="hidden" name="vibe" value={tripVibe} />

        <div className="mt-3 sm:mt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isPending}
            className="min-h-12 w-full font-bold shadow-md shadow-teal-700/30"
            leftIcon={<Search className="w-4 h-4" />}
          >
            {isPending ? 'Searching Packages...' : 'Search Packages'}
          </Button>
        </div>
      </form>
    </div>
  );
}
