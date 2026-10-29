import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, Mountain, Waves, Wind } from 'lucide-react';
import { getPublishedPackages } from '@/server/db/packages';
import { PackageCard } from '@/components/cards/PackageCard';
import { ROUTES } from '@/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Adventure Activities & Outdoor Thrills | VibeMiles',
  description: 'Book certified scuba diving, Himalayan treks, paragliding, river rafting, and camping adventures across India.',
};

export default async function AdventuresPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; destination?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = params.q?.trim() || '';
  const destination = params.destination?.trim() || '';

  const packages = await getPublishedPackages({
    category: 'adventure',
    q: query || undefined,
    destination: destination || undefined,
  });

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
          ].map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-teal-200 border border-white/10"
            >
              <item.icon className="w-3.5 h-3.5 text-teal-400" /> {item.label}
            </span>
          ))}
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
              Showing {packages.length} verified adventure {packages.length === 1 ? 'listing' : 'listings'}
            </p>
          </div>
          <Link
            href={ROUTES.EXPLORE}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
          >
            Explore all marketplace categories →
          </Link>
        </div>

        {packages.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} packageData={pkg} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No adventure activities found {destination ? `in ${destination}` : ''}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Our adventure organizers are adding new trekking expeditions, dive slots, and thrill packages. Explore our marketplace or try a different destination.
            </p>
            <div className="pt-2">
              <Link
                href={ROUTES.EXPLORE}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
              >
                Browse Marketplace <Sparkles className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
