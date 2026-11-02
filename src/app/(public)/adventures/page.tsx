import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, Mountain, Waves, Wind, Search, MapPin, X, Filter } from 'lucide-react';
import { getPublishedPackages } from '@/server/db/packages';
import { PackageCard } from '@/components/cards/PackageCard';
import { ROUTES } from '@/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Adventure Activities & Outdoor Thrills | VibeMiles',
  description: 'Book certified scuba diving, Himalayan treks, paragliding, river rafting, and camping adventures across India.',
};

const ADVENTURE_TYPES = [
  'All Types',
  'Trekking & Hiking',
  'Scuba Diving & Snorkeling',
  'Paragliding & Sky Sports',
  'White Water Rafting',
  'Desert & Jungle Safaris',
];

const DIFFICULTY_LEVELS = [
  { label: 'All Levels', value: '' },
  { label: 'Easy / Beginner', value: 'Easy' },
  { label: 'Moderate', value: 'Moderate' },
  { label: 'Strenuous', value: 'Strenuous' },
  { label: 'Extreme / Technical', value: 'Extreme' },
];

export default async function AdventuresPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    destination?: string;
    type?: string;
    difficulty?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = params.q?.trim() || '';
  const destination = params.destination?.trim() || '';
  const selectedType = params.type?.trim() || '';
  const selectedDifficulty = params.difficulty?.trim() || '';

  const packages = await getPublishedPackages({
    category: 'adventure',
    q: query || undefined,
    destination: destination || undefined,
  });

  let displayedPackages = packages;

  if (selectedType && selectedType !== 'All Types') {
    const tLow = selectedType.toLowerCase();
    displayedPackages = displayedPackages.filter((p) => {
      const meta = (p.metadata || {}) as Record<string, any>;
      const catType = (meta.advCategory || '').toLowerCase();
      return (
        catType.includes(tLow) ||
        p.tags?.some((t) => t.toLowerCase().includes(tLow)) ||
        p.name.toLowerCase().includes(tLow)
      );
    });
  }

  if (selectedDifficulty) {
    const diffLow = selectedDifficulty.toLowerCase();
    displayedPackages = displayedPackages.filter((p) => {
      const meta = (p.metadata || {}) as Record<string, any>;
      const difficulty = (meta.advDifficulty || '').toLowerCase();
      return (
        difficulty.includes(diffLow) ||
        p.tags?.some((t) => t.toLowerCase().includes(diffLow)) ||
        p.description.toLowerCase().includes(diffLow)
      );
    });
  }

  const hasActiveFilters = Boolean(query || destination || (selectedType && selectedType !== 'All Types') || selectedDifficulty);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-teal-950 to-emerald-950 p-8 sm:p-12 text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-800/60 border border-teal-500/40 px-3.5 py-1 text-xs font-semibold text-teal-200">
          <Mountain className="w-4 h-4 text-teal-300" />
          <span>High Adrenaline & Certified Instructors</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
          Adventure Activities & Expeditions
        </h1>
        <p className="text-teal-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
          Trek breathtaking Himalayan passes, dive vibrant Andaman coral reefs, paraglide above Bir Billing valleys, and conquer raging Ganges rapids with verified safety leaders.
        </p>

        {/* Quick Style Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { label: 'Trekking & Hiking', icon: Mountain },
            { label: 'Scuba Diving & Snorkeling', icon: Waves },
            { label: 'Paragliding & Sky Sports', icon: Wind },
            { label: 'White Water Rafting', icon: Waves },
            { label: 'Desert & Jungle Safaris', icon: Compass },
          ].map((item) => {
            const isActive = selectedType.toLowerCase() === item.label.toLowerCase();
            return (
              <Link
                key={item.label}
                href={`/adventures?type=${encodeURIComponent(item.label)}${destination ? `&destination=${encodeURIComponent(destination)}` : ''}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-400 text-teal-950 font-bold shadow-md'
                    : 'bg-white/10 backdrop-blur-md text-teal-200 border border-white/10 hover:bg-white/20'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 text-teal-300" /> {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <form method="GET" action="/adventures" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search trek, dive, rafting, paragliding..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              name="destination"
              defaultValue={destination}
              placeholder="Filter by destination (e.g. Manali, Rishikesh)..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
            >
              Filter Adventures
            </button>
            {hasActiveFilters && (
              <Link
                href="/adventures"
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50 transition-colors"
                title="Reset Filters"
              >
                <X className="w-4 h-4" />
              </Link>
            )}
          </div>
        </form>

        {/* Difficulty Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Difficulty:
          </span>
          {DIFFICULTY_LEVELS.map((opt) => {
            const isSelected = selectedDifficulty === opt.value || (!selectedDifficulty && !opt.value);
            return (
              <Link
                key={opt.label}
                href={`/adventures?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  ...(destination ? { destination } : {}),
                  ...(selectedType ? { type: selectedType } : {}),
                  ...(opt.value ? { difficulty: opt.value } : {}),
                }).toString()}`}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                  isSelected
                    ? 'bg-teal-100 text-teal-900 border border-teal-300 font-bold'
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
              {destination ? `Adventures in ${destination}` : 'All Outdoor Adventures & Activities'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {displayedPackages.length} verified adventure {displayedPackages.length === 1 ? 'listing' : 'listings'}
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No adventure activities match your filters {destination ? `in ${destination}` : ''}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Our adventure organizers are adding new trekking expeditions, dive slots, and thrill packages. Try resetting your filters.
            </p>
            <div className="pt-2">
              <Link
                href="/adventures"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
              >
                Reset Filters <Sparkles className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
