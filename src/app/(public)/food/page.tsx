import React from 'react';
import Link from 'next/link';
import { Utensils, MapPin, Sparkles, Coffee } from 'lucide-react';
import { getPublishedPackages } from '@/server/db/packages';
import { PackageCard } from '@/components/cards/PackageCard';
import { ROUTES } from '@/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Food Experiences & Culinary Walks | VibeMiles',
  description: 'Savor royal thalis, Old Delhi street food walks, spice plantation tours, and regional delicacies with verified hosts.',
};

export default async function FoodPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; destination?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = params.q?.trim() || '';
  const destination = params.destination?.trim() || '';

  const packages = await getPublishedPackages({
    category: 'food',
    q: query || undefined,
    destination: destination || undefined,
  });

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
          {['Street Food Walks', 'Royal Heritage Thali', 'Spice Plantation', 'Cooking Masterclasses', 'Vineyard & Tea Tastings'].map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-amber-200 border border-white/10"
            >
              <Sparkles className="w-3 h-3 text-amber-400" /> {chip}
            </span>
          ))}
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
              Showing {packages.length} verified culinary {packages.length === 1 ? 'listing' : 'listings'}
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <Utensils className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No food experiences found {destination ? `in ${destination}` : ''}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Our culinary partners are adding new food walks and chef dining experiences daily. Browse our general catalog or check back shortly.
            </p>
            <div className="pt-2">
              <Link
                href={ROUTES.EXPLORE}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-colors"
              >
                Browse Marketplace <Coffee className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
