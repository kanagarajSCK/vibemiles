import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, BookOpen, Landmark, Camera, MapPin } from 'lucide-react';
import { getPublishedPackages } from '@/server/db/packages';
import { PackageCard } from '@/components/cards/PackageCard';
import { ROUTES } from '@/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Hire Verified Local Guides & Storytellers | VibeMiles',
  description: 'Book licensed heritage guides, city historians, nature walk leaders, and cultural storytellers across India.',
};

export default async function GuidesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; destination?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const query = params.q?.trim() || '';
  const destination = params.destination?.trim() || '';

  const packages = await getPublishedPackages({
    category: 'guide',
    q: query || undefined,
    destination: destination || undefined,
  });

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
          ].map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-medium text-indigo-200 border border-white/10"
            >
              <item.icon className="w-3.5 h-3.5 text-indigo-300" /> {item.label}
            </span>
          ))}
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
              Showing {packages.length} verified guide {packages.length === 1 ? 'service' : 'services'}
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No local guides found {destination ? `in ${destination}` : ''}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Local guides and historians in this region are registering their walking tours. Explore our marketplace or search another historical destination.
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
