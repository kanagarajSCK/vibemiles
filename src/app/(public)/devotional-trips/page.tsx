import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles, Clock, ShieldCheck, Info,
} from 'lucide-react';
import { getPublishedPackages } from '@/server/db/packages';
import { getDestinations } from '@/server/db/destinations';
import { PackageCard } from '@/components/cards/PackageCard';
import { DestinationCard } from '@/components/cards/DestinationCard';
import type { SortOption } from '@/types';

export const metadata: Metadata = {
  title: 'Devotional Trips & Spiritual Yatras | VibeMiles',
  description: 'Explore verified temple tours, spiritual yatras, Ganga aartis, and sacred pilgrimage journeys across Varanasi, Tirupati, Haridwar, and more.',
};

export const revalidate = 60; // 60s ISR

interface DevotionalTripsPageProps {
  searchParams: Promise<{
    destination?: string;
    minPrice?: string;
    maxPrice?: string;
    duration?: string;
    sort?: string;
  }>;
}

export default async function DevotionalTripsPage({ searchParams }: DevotionalTripsPageProps) {
  const params = await searchParams;

  // Fetch all packages and sacred destinations in parallel
  const [allPackages, destinations] = await Promise.all([
    getPublishedPackages({
      destination: params.destination,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      duration: params.duration ? Number(params.duration) : undefined,
      take: 30,
      sort: (params.sort as SortOption) || 'recommended',
    }),
    getDestinations(),
  ]);

  // Filter for devotional & spiritual packages
  const devotionalPackages = allPackages.filter((pkg) => {
    const isDevotionalCategory = pkg.category === 'devotional';
    const hasDevotionalTag = pkg.tags.some((t) =>
      ['devotional', 'spiritual', 'temple', 'pilgrimage', 'kashi', 'darshan', 'balaji'].includes(t.toLowerCase())
    );
    const hasDevotionalTitle = /temple|yatra|pilgrimage|darshan|ganga aarti|spiritual|kashi|tirupati/i.test(pkg.name);
    return isDevotionalCategory || hasDevotionalTag || hasDevotionalTitle;
  });

  // Display list fallback to all packages if database is being populated
  const displayPackages = devotionalPackages.length > 0 ? devotionalPackages : allPackages;

  // Filter sacred destinations
  const sacredDestinations = destinations.filter((d) =>
    d.tags.some((t) => ['devotional', 'spiritual', 'temple', 'ganga', 'pilgrimage'].includes(t.toLowerCase())) ||
    ['varanasi', 'tirupati', 'rishikesh', 'haridwar', 'ayodhya', 'puri', 'rameswaram', 'madurai'].some((s) =>
      d.slug.toLowerCase().includes(s) || d.name.toLowerCase().includes(s)
    )
  );

  return (
    <div className="space-y-8 pb-12 sm:space-y-12 sm:pb-16 bg-slate-50 min-h-screen">
      {/* ─── DEVOTIONAL HERO SECTION ─── */}
      <section className="relative overflow-hidden bg-slate-950 py-12 text-white sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-950/60 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
            <span>🛕</span>
            <span>Sacred Pilgrimages & Spiritual Yatras</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Devotional Trips & <span className="text-teal-400">Sacred Journeys</span>
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Journey to India&apos;s holiest temples, riverside ghats, and spiritual retreats. Book verified pilgrimage itineraries with comfortable stays, local guidance, and transparent inclusions.
          </p>

          {/* Quick Sacred Destination Chips */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Popular Sacred Routes:</span>
            <Link
              href="/devotional-trips?destination=Varanasi"
              className="rounded-full bg-white/10 px-3 py-1 text-slate-200 hover:bg-white/20 transition-colors"
            >
              Kashi Vishwanath (Varanasi)
            </Link>
            <Link
              href="/devotional-trips?destination=Tirupati"
              className="rounded-full bg-white/10 px-3 py-1 text-slate-200 hover:bg-white/20 transition-colors"
            >
              Tirumala Balaji (Tirupati)
            </Link>
            <Link
              href="/devotional-trips?destination=Rishikesh"
              className="rounded-full bg-white/10 px-3 py-1 text-slate-200 hover:bg-white/20 transition-colors"
            >
              Haridwar & Rishikesh
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* ─── GROUNDED DARSHAN ADVISORY CARD ─── */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-6 text-slate-800 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Devotee Advisory & Darshan Guidelines
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Special entry passes, VIP queues, and seva tickets are governed exclusively by respective temple trusts (e.g. Tirumala Tirupati Devasthanams, Shri Kashi Vishwanath Temple Trust). VibeMiles packages provide transport, comfortable accommodations, pooja orientation, and experienced local guidance. Official darshan tickets must be procured directly under your verified identity from authorized temple trust portals.
              </p>
            </div>
          </div>
        </div>

        {/* ─── ACTIVE PACKAGES SECTION ─── */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Verified Pilgrimage Itineraries
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Available Devotional Packages
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {displayPackages.length} package{displayPackages.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>

          {displayPackages.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayPackages.map((pkg) => (
                <PackageCard key={pkg.id} packageData={pkg} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3 text-2xl">
                🛕
              </div>
              <h3 className="text-lg font-bold text-slate-900">No devotional packages found</h3>
              <p className="text-sm text-slate-500 mt-1">
                Please try adjusting your destination filter or check back soon for newly published pilgrimage routes.
              </p>
              <Link
                href="/devotional-trips"
                className="inline-flex mt-4 text-sm font-semibold text-teal-700 hover:underline"
              >
                Clear filters and view all devotional trips →
              </Link>
            </div>
          )}
        </section>

        {/* ─── SACRED DESTINATIONS DIRECTORY ─── */}
        {sacredDestinations.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Holy Places
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Sacred Destinations Across India
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {sacredDestinations.map((dest) => (
                <DestinationCard key={dest.id} destination={dest} />
              ))}
            </div>
          </section>
        )}

        {/* ─── SPIRITUAL TRAVEL FEATURES ─── */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
          <div className="max-w-xl space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Why Book With VibeMiles
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Thoughtfully Designed for Devotees & Families
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Verified Local Yatra Guides</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Trained guides familiar with sanctum protocols, temple queue complexes, dress codes, and local rituals.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Senior & Family Friendly</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Comfortable AC vehicles, doorstep pickup options, hygienic vegetarian meals, and pacing designed for elders.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Transparent Pricing</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                No hidden fees. Every inclusion (hotel, meals, boat rides) and exclusion (special poojas, dakshina) is clearly declared.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
