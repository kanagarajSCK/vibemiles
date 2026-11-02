import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, BookOpen, Landmark, Camera, MapPin, Search, X, Filter, Languages, Award } from 'lucide-react';
import { getPublishedPackages } from '@/server/db/packages';
import { PackageCard } from '@/components/cards/PackageCard';
import { ROUTES } from '@/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Hire Verified Local Guides & Storytellers | VibeMiles',
  description: 'Book licensed heritage guides, city historians, nature walk leaders, and cultural storytellers across India.',
};

const GUIDE_SPECIALIZATIONS = [
  'All Specializations',
  'Heritage & Monument Historians',
  'Spiritual & Temple Scholars',
  'Old City Walking Guides',
  'Photography & Golden Hour Walks',
  'Naturalists & Wildlife Guides',
];

const LANGUAGE_FILTERS = [
  { label: 'All Languages', value: '' },
  { label: 'English', value: 'English' },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'Tamil', value: 'Tamil' },
  { label: 'French', value: 'French' },
  { label: 'German', value: 'German' },
];

export default async function GuidesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    destination?: string;
    specialization?: string;
    language?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = params.q?.trim() || '';
  const destination = params.destination?.trim() || '';
  const selectedSpec = params.specialization?.trim() || '';
  const selectedLang = params.language?.trim() || '';

  const packages = await getPublishedPackages({
    category: 'guide',
    q: query || undefined,
    destination: destination || undefined,
  });

  let displayedPackages = packages;

  if (selectedSpec && selectedSpec !== 'All Specializations') {
    const sLow = selectedSpec.toLowerCase();
    displayedPackages = displayedPackages.filter((p) => {
      const meta = (p.metadata || {}) as Record<string, any>;
      const spec = (meta.guideSpecialization || meta.guideServiceCategory || '').toLowerCase();
      return (
        spec.includes(sLow) ||
        p.tags?.some((t) => t.toLowerCase().includes(sLow)) ||
        p.name.toLowerCase().includes(sLow)
      );
    });
  }

  if (selectedLang) {
    const lLow = selectedLang.toLowerCase();
    displayedPackages = displayedPackages.filter((p) => {
      const meta = (p.metadata || {}) as Record<string, any>;
      const langs = Array.isArray(meta.guideLanguages)
        ? meta.guideLanguages
        : meta.guideLanguages
        ? [meta.guideLanguages]
        : [];
      return (
        langs.some((l: string) => l.toLowerCase().includes(lLow)) ||
        p.tags?.some((t) => t.toLowerCase().includes(lLow)) ||
        p.description.toLowerCase().includes(lLow)
      );
    });
  }

  const hasActiveFilters = Boolean(query || destination || (selectedSpec && selectedSpec !== 'All Specializations') || selectedLang);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-800/60 border border-indigo-500/40 px-3.5 py-1 text-xs font-semibold text-indigo-200">
          <Compass className="w-4 h-4 text-indigo-300" />
          <span>Licensed Local Storytellers & Historians</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
          Hire Verified Local Guides
        </h1>
        <p className="text-indigo-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
          Unlock the untold stories of ancient monuments, secret temple corridors, heritage architecture, and living culture with certified local guides and passionate historians.
        </p>

        {/* Quick Guide Type Chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          {[
            { label: 'Heritage & Monument Historians', icon: Landmark },
            { label: 'Spiritual & Temple Scholars', icon: BookOpen },
            { label: 'Old City Walking Guides', icon: MapPin },
            { label: 'Photography & Golden Hour Walks', icon: Camera },
            { label: 'Naturalists & Wildlife Guides', icon: Compass },
          ].map((item) => {
            const isActive = selectedSpec.toLowerCase() === item.label.toLowerCase();
            return (
              <Link
                key={item.label}
                href={`/guides?specialization=${encodeURIComponent(item.label)}${destination ? `&destination=${encodeURIComponent(destination)}` : ''}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-400 text-indigo-950 font-bold shadow-md'
                    : 'bg-white/10 backdrop-blur-md text-indigo-200 border border-white/10 hover:bg-white/20'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 text-indigo-300" /> {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <form method="GET" action="/guides" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search guide name, landmark, topics..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              name="destination"
              defaultValue={destination}
              placeholder="Filter by city / destination (e.g. Agra, Jaipur)..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-800 transition-colors"
            >
              Filter Guides
            </button>
            {hasActiveFilters && (
              <Link
                href="/guides"
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50 transition-colors"
                title="Reset Filters"
              >
                <X className="w-4 h-4" />
              </Link>
            )}
          </div>
        </form>

        {/* Language Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Languages className="w-3.5 h-3.5 text-slate-400" /> Spoken Language:
          </span>
          {LANGUAGE_FILTERS.map((opt) => {
            const isSelected = selectedLang === opt.value || (!selectedLang && !opt.value);
            return (
              <Link
                key={opt.label}
                href={`/guides?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  ...(destination ? { destination } : {}),
                  ...(selectedSpec ? { specialization: selectedSpec } : {}),
                  ...(opt.value ? { language: opt.value } : {}),
                }).toString()}`}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-bold'
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
              {destination ? `Local Guides in ${destination}` : 'All Verified Local Guides'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {displayedPackages.length} verified guide {displayedPackages.length === 1 ? 'service' : 'services'}
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No local guides match your filters {destination ? `in ${destination}` : ''}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your language or specialization filters, or search another historical destination.
            </p>
            <div className="pt-2">
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-800 transition-colors"
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
