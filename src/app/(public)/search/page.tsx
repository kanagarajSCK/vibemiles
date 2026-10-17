import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { packageService } from '@/services/package.service';
import { PackageCard } from '@/components/cards/PackageCard';
import { SearchForm } from '@/components/travel/SearchForm';
import { PACKAGE_CATEGORIES } from '@/constants';

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

  const packages = await packageService.getPackages({
    q: searchTerm || undefined,
    category,
    take: 24,
  });
  const categoryLabel = PACKAGE_CATEGORIES.find(({ value }) => value === category)?.label;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Search Results</span>
          <h1 className="search-results-heading mt-1 flex min-w-0 items-start gap-2 text-xl font-extrabold leading-tight text-slate-900 sm:text-2xl">
            <Search className="mt-1 h-4 w-4 shrink-0 text-teal-700 sm:h-5 sm:w-5" />
            <span className="min-w-0 break-words">Showing matches for &quot;{searchTerm || categoryLabel || 'All Destinations'}&quot;</span>
          </h1>
        </div>
        <span className="self-start whitespace-nowrap text-xs font-semibold text-slate-500 sm:self-auto sm:text-sm">{packages.length} trips found</span>
      </div>

      <SearchForm initialSearch={searchTerm} initialCategory={category} />

      {packages.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} packageData={pkg} compact />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-lg font-bold text-slate-900">No matching trips found</h3>
          <p className="text-sm text-slate-500 mt-1">Try searching for a different destination, keyword, or category.</p>
          <Link href="/packages" className="inline-flex mt-4 text-sm font-semibold text-teal-700 hover:underline">
            Browse all packages →
          </Link>
        </div>
      )}
    </div>
  );
}
