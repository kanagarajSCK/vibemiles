import React from 'react';
import Link from 'next/link';
import { Utensils, MapPin, Sparkles, Coffee, Search, X, Check, Filter } from 'lucide-react';
import { getPublishedPackages } from '@/server/db/packages';
import { PackageCard } from '@/components/cards/PackageCard';
import { ROUTES } from '@/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Food Experiences & Culinary Walks | VibeMiles',
  description: 'Savor royal thalis, Old Delhi street food walks, spice plantation tours, and regional delicacies with verified hosts.',
};

const FOOD_FORMATS = [
  'All Formats',
  'Street Food Walk',
  'Royal Thali',
  'Home Dining',
  'Chef Masterclass',
  'Plantation Lunch',
];

const DIETARY_OPTIONS = [
  { label: 'All Dietary', value: '' },
  { label: 'Veg / Pure Veg', value: 'Veg' },
  { label: 'Non-Veg', value: 'Non-Veg' },
  { label: 'Vegan', value: 'Vegan' },
  { label: 'Jain Accommodated', value: 'Jain' },
];

export default async function FoodPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    destination?: string;
    format?: string;
    dietary?: string;
    cuisine?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = params.q?.trim() || '';
  const destination = params.destination?.trim() || '';
  const selectedFormat = params.format?.trim() || '';
  const selectedDietary = params.dietary?.trim() || '';
  const selectedCuisine = params.cuisine?.trim() || '';

  const packages = await getPublishedPackages({
    category: 'food',
    q: query || undefined,
    destination: destination || undefined,
  });

  let displayedPackages = packages;

  if (selectedFormat && selectedFormat !== 'All Formats') {
    const fLow = selectedFormat.toLowerCase();
    displayedPackages = displayedPackages.filter((p) => {
      const meta = (p.metadata || {}) as Record<string, any>;
      const format = (meta.foodFormat || '').toLowerCase();
      return (
        format.includes(fLow) ||
        p.tags?.some((t) => t.toLowerCase().includes(fLow)) ||
        p.name.toLowerCase().includes(fLow)
      );
    });
  }

  if (selectedDietary) {
    const dLow = selectedDietary.toLowerCase();
    displayedPackages = displayedPackages.filter((p) => {
      const meta = (p.metadata || {}) as Record<string, any>;
      const dietary = Array.isArray(meta.foodDietaryOptions)
        ? meta.foodDietaryOptions
        : meta.foodDietaryOptions
        ? [meta.foodDietaryOptions]
        : [];
      return (
        dietary.some((d: string) => d.toLowerCase().includes(dLow)) ||
        p.tags?.some((t) => t.toLowerCase().includes(dLow)) ||
        p.description.toLowerCase().includes(dLow)
      );
    });
  }

  if (selectedCuisine) {
    const cLow = selectedCuisine.toLowerCase();
    displayedPackages = displayedPackages.filter((p) => {
      const meta = (p.metadata || {}) as Record<string, any>;
      const cuisines = Array.isArray(meta.foodCuisines)
        ? meta.foodCuisines
        : meta.foodCuisines
        ? [meta.foodCuisines]
        : [];
      return (
        cuisines.some((c: string) => c.toLowerCase().includes(cLow)) ||
        p.tags?.some((t) => t.toLowerCase().includes(cLow)) ||
        p.name.toLowerCase().includes(cLow) ||
        p.description.toLowerCase().includes(cLow)
      );
    });
  }

  const hasActiveFilters = Boolean(query || destination || (selectedFormat && selectedFormat !== 'All Formats') || selectedDietary || selectedCuisine);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-amber-950 via-amber-900 to-orange-950 p-8 sm:p-12 text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-800/70 border border-amber-600/40 px-3.5 py-1 text-xs font-semibold text-amber-200">
          <Utensils className="w-4 h-4 text-amber-400" />
          <span>Authentic Flavors & Culinary Trails</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
          Food Experiences & Guided Culinary Walks
        </h1>
        <p className="text-amber-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
          From secret street food alleys in Old Delhi to royal thalis in Jaipur, Malabar spice trails, and seaside coastal catch tastings—experience India one flavor at a time.
        </p>

        {/* Quick Style Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {FOOD_FORMATS.slice(1).map((chip) => {
            const isActive = selectedFormat.toLowerCase() === chip.toLowerCase();
            return (
              <Link
                key={chip}
                href={`/food?format=${encodeURIComponent(chip)}${destination ? `&destination=${encodeURIComponent(destination)}` : ''}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-400 text-amber-950 font-bold shadow-md'
                    : 'bg-white/10 backdrop-blur-md text-amber-200 border border-white/10 hover:bg-white/20'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" /> {chip}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <form method="GET" action="/food" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search food, dish, or experience..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              name="destination"
              defaultValue={destination}
              placeholder="Filter by city / destination..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-800 transition-colors"
            >
              Filter Experiences
            </button>
            {hasActiveFilters && (
              <Link
                href="/food"
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50 transition-colors"
                title="Reset Filters"
              >
                <X className="w-4 h-4" />
              </Link>
            )}
          </div>
        </form>

        {/* Dietary Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Dietary:
          </span>
          {DIETARY_OPTIONS.map((opt) => {
            const isSelected = selectedDietary === opt.value || (!selectedDietary && !opt.value);
            return (
              <Link
                key={opt.label}
                href={`/food?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  ...(destination ? { destination } : {}),
                  ...(selectedFormat ? { format: selectedFormat } : {}),
                  ...(opt.value ? { dietary: opt.value } : {}),
                }).toString()}`}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                  isSelected
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {destination ? `Food Experiences in ${destination}` : 'All Curated Food Experiences'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {displayedPackages.length} verified culinary {displayedPackages.length === 1 ? 'listing' : 'listings'}
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
          <Link
            href={ROUTES.EXPLORE}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
          >
            Explore all marketplace categories →
          </Link>
        </div>

        {displayedPackages.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedPackages.map((pkg) => (
              <PackageCard key={pkg.id} packageData={pkg} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Utensils className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No food experiences match your filters {destination ? `in ${destination}` : ''}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your dietary or format filters, or search another destination.
            </p>
            <div className="pt-2">
              <Link
                href="/food"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-800 transition-colors"
              >
                Reset Filters <Coffee className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
