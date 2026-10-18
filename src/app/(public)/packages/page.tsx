import React from 'react';
import { getPublishedPackages } from '@/server/db/packages';
import { PackageCard } from '@/components/cards/PackageCard';
import { PackagesFilters } from '@/components/travel/PackagesFilters';
import { ROUTES } from '@/constants';
import { PackageCategory, SortOption } from '@/types';

export const revalidate = 60; // 60s cache on server

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{
    destination?: string;
    destinationId?: string;
    destinationSlug?: string;
    q?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    duration?: string;
    minDuration?: string;
    maxDuration?: string;
    travelType?: string;
    vibe?: string;
  }>;
}) {
  const params = await searchParams;
  const packages = await getPublishedPackages({
    q: params.q,
    destination: params.destination,
    destinationId: params.destinationId,
    destinationSlug: params.destinationSlug,
    category: params.category as PackageCategory,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    duration: params.duration ? Number(params.duration) : undefined,
    minDuration: params.minDuration ? Number(params.minDuration) : undefined,
    maxDuration: params.maxDuration ? Number(params.maxDuration) : undefined,
    travelType: params.travelType,
    vibe: params.vibe,
    take: 24,
    sort: (params.sort as SortOption) || 'recommended',
  });

  const activeFiltersCount = [
    params.q,
    params.destination,
    params.destinationId,
    params.category,
    params.travelType,
    params.vibe,
    params.minPrice,
    params.maxPrice,
    params.duration,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-5 sm:px-6 sm:py-8 sm:space-y-8 lg:px-8 lg:py-10 lg:space-y-8">
      {/* Header Banner */}
      <div className="travel-catalog-hero flex flex-col justify-between gap-2 rounded-2xl bg-slate-900 p-4 text-white shadow-xl md:flex-row md:items-center md:gap-6 md:p-6 lg:p-8">
        <div className="travel-catalog-hero-content max-w-xl">
          <span className="travel-catalog-eyebrow inline-flex items-center rounded-full border border-teal-500/30 bg-teal-950/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">
            Travel Catalog
          </span>
          <h1 className="travel-catalog-heading text-3xl font-extrabold leading-tight text-white md:max-w-[14ch] md:text-4xl">
            Browse All Tour Packages
          </h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="travel-catalog-description max-w-124 text-slate-300 md:text-sm md:leading-6">
              Filter through verified tours, hill station expeditions, houseboat cruises, and heritage retreats across India.
            </p>
            <div className="travel-catalog-meta flex items-center gap-2 self-start sm:self-auto">
              {params.travelType && (
                <span className="travel-catalog-badge inline-flex items-center gap-1 rounded-full bg-teal-800 px-2 py-0.5 text-[10px] font-bold text-teal-200 align-middle">
                  {params.travelType === 'solo' && '🧭 Solo'}
                  {params.travelType === 'couple' && '💑 Couple'}
                  {params.travelType === 'family' && '👨‍👩‍👧‍👦 Family'}
                  {params.travelType === 'friends' && '🎒 Friends'}
                  {params.vibe && ` · ${params.vibe}`}
                </span>
              )}
              <div className="travel-catalog-stat flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2.5 py-1.5 backdrop-blur-md">
                <span className="travel-catalog-stat-value block text-[1.5rem] font-black leading-none text-teal-300">{packages.length}</span>
                <span className="travel-catalog-stat-label text-[10px] font-medium uppercase tracking-[0.12em] text-slate-300">Active Packages</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid + Sidebar Filter */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 lg:gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 space-y-4 lg:space-y-6">
          <PackagesFilters
            defaultDestination={params.destination}
            defaultDestinationId={params.destinationId}
            defaultCategory={params.category}
            defaultSort={params.sort}
            defaultMinPrice={params.minPrice}
            defaultMaxPrice={params.maxPrice}
            defaultTravelType={(params.travelType as 'solo' | 'couple' | 'family' | 'friends') || ''}
            defaultVibe={params.vibe || ''}
          />
        </aside>

        {/* Packages Results */}
        <main className="lg:col-span-3 space-y-4 sm:space-y-6">
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">{packages.length} results</span>
              {params.travelType && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                  {params.travelType === 'solo' && '🧭'}{params.travelType === 'couple' && '💑'}{params.travelType === 'family' && '👨‍👩‍👧‍👦'}{params.travelType === 'friends' && '🎒'} {params.travelType}
                </span>
              )}
              {params.vibe && (
                <span className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {params.vibe}
                </span>
              )}
              {params.q && (
                <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  🔍 &quot;{params.q}&quot;
                </span>
              )}
              {params.destination && (
                <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                  📍 {params.destination}
                </span>
              )}
            </div>
          )}

          {packages.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} packageData={pkg} compact />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <h3 className="text-lg font-bold text-slate-900">No packages found</h3>
              <p className="text-sm text-slate-500 mt-1">
                {params.destination
                  ? `No verified tour packages currently available in "${params.destination}".`
                  : 'Try adjusting your filters or search keyword.'}
              </p>
              <a href={ROUTES.PACKAGES} className="inline-flex mt-4 text-sm font-semibold text-teal-700 hover:underline">
                Reset all filters →
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
