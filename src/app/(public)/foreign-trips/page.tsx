import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldAlert, FileText,
  CreditCard, CheckCircle2,
} from 'lucide-react';
import { packageService } from '@/services/package.service';
import { PackageCard } from '@/components/cards/PackageCard';
import { DestinationCard } from '@/components/cards/DestinationCard';
import { ForeignPackageComparison } from '@/components/travel/ForeignPackageComparison';
import type { SortOption } from '@/types';

export const metadata: Metadata = {
  title: 'Foreign Trips & International Holidays | VibeMiles',
  description: 'Explore verified international tour packages to Dubai, Bali, Thailand, and exotic global destinations with transparent pricing, visa guidance, and reliable tour operators.',
};

export const revalidate = 60; // 60s ISR

interface ForeignTripsPageProps {
  searchParams: Promise<{
    country?: string;
    destination?: string;
    minPrice?: string;
    maxPrice?: string;
    duration?: string;
    sort?: string;
  }>;
}

export default async function ForeignTripsPage({ searchParams }: ForeignTripsPageProps) {
  const params = await searchParams;

  // Fetch all packages and destinations in parallel
  const [allPackages, destinations] = await Promise.all([
    packageService.getPackages(
      {
        destination: params.destination || params.country,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        duration: params.duration ? Number(params.duration) : undefined,
        take: 30,
      },
      (params.sort as SortOption) || 'recommended'
    ),
    packageService.getDestinations(),
  ]);

  // Filter for international / foreign packages
  const foreignPackages = allPackages.filter((pkg) => {
    const isForeignCategory = pkg.category === 'foreign';
    const hasForeignTag = pkg.tags.some((t) =>
      ['foreign', 'international', 'dubai', 'bali', 'thailand', 'singapore', 'uae', 'indonesia'].includes(t.toLowerCase())
    );
    const hasInternationalTitle = /dubai|bali|thailand|phuket|bangkok|singapore|international/i.test(pkg.name);
    return isForeignCategory || hasForeignTag || hasInternationalTitle;
  });

  const displayPackages = foreignPackages.length > 0 ? foreignPackages : allPackages;

  // Filter international destinations
  const internationalDestinations = destinations.filter(
    (d) =>
      d.country !== 'India' ||
      d.tags.some((t) => ['foreign', 'international', 'dubai', 'bali', 'thailand', 'singapore'].includes(t.toLowerCase())) ||
      ['dubai', 'bali', 'thailand', 'bangkok', 'phuket', 'singapore'].some((s) =>
        d.slug.toLowerCase().includes(s) || d.name.toLowerCase().includes(s)
      )
  );

  return (
    <div className="space-y-8 pb-12 sm:space-y-12 sm:pb-16 bg-slate-50 min-h-screen">
      {/* ─── FOREIGN TRIPS HERO SECTION ─── */}
      <section className="relative overflow-hidden bg-slate-950 py-12 text-white sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-950/60 px-3.5 py-1 text-xs font-semibold text-teal-300 backdrop-blur-md">
            <span>✈️</span>
            <span>Curated International Holidays & Vacations</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Foreign Trips & <span className="text-teal-400">International Tours</span>
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Discover extraordinary international destinations. From Dubai desert safaris and tropical Bali pool villas to Bangkok temples, explore curated itineraries with verified operators.
          </p>

          {/* Quick Country Browsing Chips */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Popular Countries:</span>
            <Link
              href="/foreign-trips?country=Dubai"
              className="rounded-full bg-white/10 px-3 py-1 text-slate-200 hover:bg-white/20 transition-colors"
            >
              🇦🇪 Dubai (UAE)
            </Link>
            <Link
              href="/foreign-trips?country=Bali"
              className="rounded-full bg-white/10 px-3 py-1 text-slate-200 hover:bg-white/20 transition-colors"
            >
              🇮🇩 Bali (Indonesia)
            </Link>
            <Link
              href="/foreign-trips?country=Thailand"
              className="rounded-full bg-white/10 px-3 py-1 text-slate-200 hover:bg-white/20 transition-colors"
            >
              🇹🇭 Thailand (Bangkok & Phuket)
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* ─── GROUNDED VISA & PASSPORT GUIDELINES ADVISORY ─── */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-4 sm:p-6 text-slate-800 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                International Travel & Visa Disclosure
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <strong>General Guidance Only:</strong> VibeMiles is an independent travel marketplace and does <em>NOT</em> issue visas, process immigration applications, or guarantee visa approvals. All Indian passport holders must hold a passport valid for at least 6 months from their departure date. Unless explicitly stated under a package&apos;s inclusions, international round-trip airfare, visa fees, foreign municipal taxes, and overseas medical insurance are excluded and must be arranged by the traveller.
              </p>
            </div>
          </div>
        </div>

        {/* ─── ACTIVE PACKAGES SECTION ─── */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Verified Global Itineraries
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Featured Foreign Tour Packages
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
                ✈️
              </div>
              <h3 className="text-lg font-bold text-slate-900">No international packages found</h3>
              <p className="text-sm text-slate-500 mt-1">
                Please try adjusting your country filter or check back soon for newly published international itineraries.
              </p>
              <Link
                href="/foreign-trips"
                className="inline-flex mt-4 text-sm font-semibold text-teal-700 hover:underline"
              >
                Clear filters and view all foreign trips →
              </Link>
            </div>
          )}
        </section>

        {/* ─── PACKAGE COMPARISON MATRIX ─── */}
        {displayPackages.length >= 2 && (
          <ForeignPackageComparison packages={displayPackages} />
        )}

        {/* ─── POPULAR INTERNATIONAL DESTINATIONS ─── */}
        {internationalDestinations.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Global Gateways
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  Popular International Destinations
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {internationalDestinations.map((dest) => (
                <DestinationCard key={dest.id} destination={dest} />
              ))}
            </div>
          </section>
        )}

        {/* ─── PASSPORT & VISA CHECKLIST ─── */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
          <div className="max-w-xl space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Traveller Checklist
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Essential Guide for International Travel
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">6-Month Passport Validity</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ensure your Indian passport has at least 6 months validity from the planned return date and at least two blank visa pages.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Visa Requirements</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Check whether your destination offers Visa on Arrival (VoA, e.g. Bali), e-Visa (e.g. UAE, Malaysia), or requires advance embassy application.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Transparent Inclusions</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hotel accommodations, airport transfers, and guided sightseeing are provided by verified operators. Airfare is booked separately.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
