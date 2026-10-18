'use client';

import React, { useState } from 'react';
import { Home, Search } from 'lucide-react';
import { PACKAGE_CATEGORIES } from '@/constants';
import { PackageCard } from '@/components/cards/PackageCard';
import type { Package } from '@/types';

interface StaysClientProps {
  initialPackages: Package[];
}

export function StaysClient({ initialPackages }: StaysClientProps) {
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const stayCategoryOptions = PACKAGE_CATEGORIES.filter(({ value }) =>
    ['villa', 'homestay', 'hotel', 'hostel', 'camping'].includes(value)
  );

  const stayPackages = initialPackages.filter((pkg) =>
    stayCategoryOptions.some(({ value }) => value === pkg.category)
  );

  const query = locationQuery.trim().toLowerCase();
  const filteredPackages = stayPackages.filter((pkg) => {
    const matchesLocation =
      !query ||
      `${pkg.city ?? ''} ${pkg.destinationName} ${pkg.state}`.toLowerCase().includes(query);
    const matchesCategory = !selectedCategory || pkg.category === selectedCategory;
    return matchesLocation && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="rounded-3xl bg-teal-900 p-8 sm:p-12 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal-800/80 px-3.5 py-1 text-xs font-semibold text-teal-200">
          <Home className="w-4 h-4" /> Luxury Villas, Houseboats & Homestays
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-5xl">Boutique Stays & Heritage Villas</h1>
        <p className="text-teal-100 text-sm max-w-2xl">
          Unwind in authentic heritage havelis in Rajasthan, luxury houseboats floating in Kerala backwaters, and cozy mountain pine chalets in Himachal.
        </p>
      </div>

      <section
        aria-label="Find a stay"
        className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_260px] sm:items-end"
      >
        <label className="space-y-1.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-600">City or State</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Search Jaipur, Manali, Alleppey, Goa..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </label>

        <label className="space-y-1.5">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-600">Stay Type</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          >
            <option value="">All Stay Types</option>
            {stayCategoryOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {filteredPackages.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPackages.map((pkg) => (
            <PackageCard key={pkg.id} packageData={pkg} compact />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-lg font-bold text-slate-900">No stays found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your location search or stay type filter.</p>
          {(locationQuery || selectedCategory) && (
            <button
              onClick={() => {
                setLocationQuery('');
                setSelectedCategory('');
              }}
              className="mt-4 text-sm font-semibold text-teal-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
