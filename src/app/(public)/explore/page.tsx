import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPackages } from '@/server/db/packages';
import { PackageCard } from '@/components/cards/PackageCard';
import { PackagesFilters } from '@/components/travel/PackagesFilters';
import { EXPLORE_CATEGORIES, ROUTES } from '@/constants';
import { PackageCategory, SortOption } from '@/types';
import { getNearbyDestinations, type NearbyDestinationSuggestion } from '@/lib/india-locations';

export const metadata: Metadata = {
  title: 'Explore Marketplace Experiences | VibeMiles',
  description: 'Explore verified villas, homestays, hotels, hostels, camping, food tours, adventures, local guides, and cab services across India.',
};

export const revalidate = 60; // 60s cache on server

export default async function ExplorePage({
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
  const selectedCategory = params.category as PackageCategory | undefined;

  const packages = await getPublishedPackages({
    q: params.q,
    destination: params.destination,
    destinationId: params.destinationId,
    destinationSlug: params.destinationSlug,
    category: selectedCategory,
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

  const searchedLocation = (params.destination || params.q || '').trim();
  const nearbySuggestions: NearbyDestinationSuggestion[] = searchedLocation
    ? getNearbyDestinations(searchedLocation)
    : [];

  let recommendedPackages: typeof packages = [];
  if (packages.length === 0) {
    if (nearbySuggestions.length > 0) {
      for (const nearby of nearbySuggestions.slice(0, 3)) {
        try {
          const pkgs = await getPublishedPackages({
            destination: nearby.name,
            category: selectedCategory,
            take: 3,
          });
          if (pkgs.length > 0) {
            recommendedPackages.push(...pkgs);
          }
        } catch {
          // ignore error for fallback
        }
      }
    }

    if (recommendedPackages.length === 0) {
      try {
        recommendedPackages = await getPublishedPackages({
          take: 6,
          sort: 'recommended',
        });
      } catch {
        recommendedPackages = [];
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    recommendedPackages = recommendedPackages.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).slice(0, 6);
  }

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

  const currentCategoryObj = EXPLORE_CATEGORIES.find((c) => c.value === params.category);

  const buildTabHref = (targetCategory: string) => {
    const p = new URLSearchParams();
    if (params.destination) p.set('destination', params.destination);
    if (params.destinationId) p.set('destinationId', params.destinationId);
    if (params.destinationSlug) p.set('destinationSlug', params.destinationSlug);
    if (params.q) p.set('q', params.q);
    if (params.sort) p.set('sort', params.sort);
    if (params.minPrice) p.set('minPrice', params.minPrice);
    if (params.maxPrice) p.set('maxPrice', params.maxPrice);
    if (params.duration) p.set('duration', params.duration);
    if (params.travelType) p.set('travelType', params.travelType);
    if (params.vibe) p.set('vibe', params.vibe);
    if (targetCategory) p.set('category', targetCategory);
    const qStr = p.toString();
    return qStr ? `${ROUTES.EXPLORE}?${qStr}` : ROUTES.EXPLORE;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-5 sm:px-6 sm:py-8 sm:space-y-8 lg:px-8 lg:py-10 lg:space-y-8">
      {/* Header Banner */}
      <div className="travel-catalog-hero flex flex-col justify-between gap-2 rounded-2xl bg-slate-900 p-4 text-white shadow-xl md:flex-row md:items-center md:gap-6 md:p-6 lg:p-8">
        <div className="travel-catalog-hero-content max-w-xl">
          <span className="travel-catalog-eyebrow inline-flex items-center rounded-full border border-teal-500/30 bg-teal-950/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">
            Marketplace Catalog
          </span>
          <h1 className="travel-catalog-heading text-3xl font-extrabold leading-tight text-white md:max-w-[16ch] md:text-4xl">
            {currentCategoryObj ? `${currentCategoryObj.icon} ${currentCategoryObj.label}` : 'Explore Marketplace'}
          </h1>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="travel-catalog-description max-w-124 text-slate-300 md:text-sm md:leading-6">
              Browse verified villas, homestays, hotels, hostels, camping retreats, food experiences, outdoor adventures, local guides, and cab services across India.
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
                <span className="travel-catalog-stat-value block text-[1.5rem] font-black leading-none text-teal-300">
                  {packages.length}
                </span>
                <span className="travel-catalog-stat-label text-[10px] font-medium uppercase tracking-[0.12em] text-slate-300">
                  Active Listings
                </span>
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
            baseRoute={ROUTES.EXPLORE}
            categories={EXPLORE_CATEGORIES}
            allCategoriesLabel="All Categories"
            title="Filter Marketplace"
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

        {/* Explore Results */}
        <main className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Link
              href={buildTabHref('')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                !params.category
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>🌐</span> All Categories
            </Link>
            {EXPLORE_CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={buildTabHref(cat.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                  params.category === cat.value
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat.icon}</span> {cat.label}
              </Link>
            ))}
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">{packages.length} results</span>
              {currentCategoryObj && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                  {currentCategoryObj.icon} {currentCategoryObj.label}
                </span>
              )}
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
            <div className="space-y-6">
              {/* Not Available Notice & Nearby Suggestions */}
              <div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50/80 via-white to-amber-50/40 p-6 shadow-sm md:p-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-900">
                      <span>📍</span>
                      <span>No Listings Currently Available</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                      {searchedLocation
                        ? `Marketplace listings currently not available in "${searchedLocation}"`
                        : currentCategoryObj
                        ? `No ${currentCategoryObj.label} listings match your filters`
                        : 'No marketplace listings found matching your criteria'}
                    </h3>
                    <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                      {searchedLocation
                        ? `We do not have active listings in "${searchedLocation}" right now. However, you can explore wonderful verified offerings in nearby and popular destinations:`
                        : 'Try adjusting your filters, selecting All Categories, or searching for other destinations.'}
                    </p>
                  </div>
                  <Link
                    href={ROUTES.EXPLORE}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-teal-700"
                  >
                    Reset all filters
                  </Link>
                </div>

                {nearbySuggestions.length > 0 && (
                  <div className="mt-6 border-t border-amber-200/60 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Suggested Nearby Destinations
                      </span>
                      <span className="text-[11px] text-teal-700 font-medium">Click to view offerings</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {nearbySuggestions.map((dest) => (
                        <Link
                          key={dest.name}
                          href={`${ROUTES.EXPLORE}?destination=${encodeURIComponent(dest.name)}`}
                          className="group flex items-center gap-2 rounded-xl border border-teal-200/90 bg-white px-3.5 py-2 text-left shadow-xs transition hover:border-teal-500 hover:bg-teal-50/70 hover:shadow-sm"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100/80 text-teal-800 text-xs font-bold">
                            📍
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900">
                                {dest.name}
                              </span>
                              {dest.packageCount && dest.packageCount > 0 ? (
                                <span className="rounded-full bg-teal-100 px-1.5 py-0.2 text-[9px] font-bold text-teal-800">
                                  {dest.packageCount} {dest.packageCount === 1 ? 'offering' : 'offerings'}
                                </span>
                              ) : null}
                            </div>
                            <span className="block text-[10px] text-slate-400 leading-tight">
                              {dest.highlight || dest.state}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended Marketplace Offerings Grid */}
              {recommendedPackages.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">
                        {searchedLocation
                          ? `Recommended Offerings Near ${searchedLocation}`
                          : 'Explore Popular Marketplace Experiences'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Verified stays, adventures, and experiences available for booking
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {recommendedPackages.map((pkg) => (
                      <PackageCard key={pkg.id} packageData={pkg} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
