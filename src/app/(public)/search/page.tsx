import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { getPublishedPackages } from '@/server/db/packages';
import { PackageCard } from '@/components/cards/PackageCard';
import { SearchForm } from '@/components/travel/SearchForm';
import { PACKAGE_CATEGORIES, ROUTES } from '@/constants';
import type { PackageCategory } from '@/types';
import { getNearbyDestinations, type NearbyDestinationSuggestion } from '@/lib/india-locations';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = (params.q || params.destination || '').trim();
  const category = PACKAGE_CATEGORIES.find(
    ({ value }) => value === params.category?.trim().toLowerCase()
  )?.value;

  const packages = await getPublishedPackages({
    q: searchTerm || undefined,
    category: category as PackageCategory | undefined,
    take: 24,
  });
  const categoryLabel = PACKAGE_CATEGORIES.find(({ value }) => value === category)?.label;

  const nearbySuggestions: NearbyDestinationSuggestion[] = searchTerm
    ? getNearbyDestinations(searchTerm)
    : [];

  let recommendedPackages: typeof packages = [];
  if (packages.length === 0) {
    if (nearbySuggestions.length > 0) {
      for (const nearby of nearbySuggestions.slice(0, 3)) {
        try {
          const pkgs = await getPublishedPackages({
            destination: nearby.name,
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

    const seen = new Set<string>();
    recommendedPackages = recommendedPackages.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).slice(0, 6);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Search Results</span>
          <h1 className="search-results-heading mt-1 flex min-w-0 items-start gap-2 text-xl font-extrabold leading-tight text-slate-900 sm:text-2xl">
            <Search className="mt-1 h-4 w-4 shrink-0 text-teal-700 sm:h-5 sm:w-5" />
            <span className="min-w-0 break-words">
              Showing matches for &quot;{searchTerm || categoryLabel || 'All Destinations'}&quot;
            </span>
          </h1>
        </div>
        <span className="self-start whitespace-nowrap text-xs font-semibold text-slate-500 sm:self-auto sm:text-sm">
          {packages.length} trips found
        </span>
      </div>

      <SearchForm initialSearch={searchTerm} initialCategory={category} />

      {packages.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} packageData={pkg} compact />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Location Not Available Notice */}
          <div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50/80 via-white to-amber-50/40 p-6 shadow-sm md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-900">
                  <span>📍</span>
                  <span>Location Currently Not Available</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {searchTerm
                    ? `Tours currently not available in "${searchTerm}"`
                    : 'No matching trips found'}
                </h3>
                <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {searchTerm
                    ? `We do not have direct tour packages in "${searchTerm}" at the moment. Explore these popular nearby travel destinations with verified holiday packages:`
                    : 'Try searching for a different destination, keyword, or category.'}
                </p>
              </div>
              <Link
                href={ROUTES.PACKAGES}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-teal-700"
              >
                Browse all packages
              </Link>
            </div>

            {nearbySuggestions.length > 0 && (
              <div className="mt-6 border-t border-amber-200/60 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Suggested Nearby Destinations
                  </span>
                  <span className="text-[11px] text-teal-700 font-medium">Click to view tours</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {nearbySuggestions.map((dest) => (
                    <Link
                      key={dest.name}
                      href={`${ROUTES.PACKAGES}?destination=${encodeURIComponent(dest.name)}`}
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
                              {dest.packageCount} {dest.packageCount === 1 ? 'tour' : 'tours'}
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

          {/* Recommended Packages Grid */}
          {recommendedPackages.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {searchTerm
                      ? `Recommended Tours Near ${searchTerm}`
                      : 'Explore Popular Tour Packages'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Handpicked verified packages available for booking
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedPackages.map((pkg) => (
                  <PackageCard key={pkg.id} packageData={pkg} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
