import React from 'react';
import Link from 'next/link';
import { dealService } from '@/services/deal.service';
import { DealCard } from '@/components/cards/DealCard';
import { DEAL_TYPES, ROUTES } from '@/constants';
import { DealType } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Travel Deals & Offers | Vibe Miles',
  description: 'Exclusive travel deals, limited-time discounts and special offers on tours, stays and experiences across India.',
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const activeType = (params.type as DealType | '') || '';

  const deals = await dealService.getDeals({
    dealType: activeType || undefined,
  });

  const flashCount = deals.filter((d) => d.dealType === 'flash' && d.status === 'active').length;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-amber-50 via-white to-orange-50">

      {/* ── HERO BANNER ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900">
        {/* decorative glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-64 w-64 -translate-y-1/2 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-64 w-64 translate-y-1/2 rounded-full bg-orange-500/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 sm:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/30 px-4 py-1.5">
                <span className="text-amber-400 text-sm">🔥</span>
                <span className="text-xs font-bold tracking-wider text-amber-300 uppercase">Limited Time Offers</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
                Travel More.{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Pay Less.
                </span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg max-w-xl">
                Exclusive travel offers, limited-time discounts and special deals on India&apos;s best tours, stays and experiences.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-4 shrink-0">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4 text-center">
                <span className="block text-3xl font-black text-amber-400">{deals.length}</span>
                <span className="text-xs text-slate-400 font-medium">Active Deals</span>
              </div>
              {flashCount > 0 && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-sm px-5 py-4 text-center">
                  <span className="block text-3xl font-black text-rose-400">⚡ {flashCount}</span>
                  <span className="text-xs text-slate-400 font-medium">Flash Deals</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER CHIPS ──────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
            {DEAL_TYPES.map((dt) => {
              const isActive = activeType === dt.value;
              return (
                <Link
                  key={dt.value}
                  href={dt.value ? `${ROUTES.DEALS}?type=${dt.value}` : ROUTES.DEALS}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold border transition-all whitespace-nowrap
                    ${isActive
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700'
                    }`}
                >
                  <span>{dt.emoji}</span>
                  {dt.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DEALS GRID ────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">

        {/* Active filter notice */}
        {activeType && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Showing <span className="text-amber-600 font-bold">{deals.length}</span> deals
              {' '}for{' '}
              <span className="capitalize text-amber-700">{activeType.replace('_', ' ')}</span>
            </p>
            <Link href={ROUTES.DEALS} className="text-xs font-semibold text-amber-700 hover:underline">
              Clear filter ×
            </Link>
          </div>
        )}

        {deals.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 text-6xl">🏷️</div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">No active deals right now</h2>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
              Check back soon — our partners are always adding new exclusive offers and seasonal specials.
            </p>
            <div className="flex gap-3">
              <Link
                href={ROUTES.PACKAGES}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 text-white px-4 py-2 text-sm font-bold hover:bg-amber-600 transition-colors"
              >
                Explore All Packages →
              </Link>
              <Link
                href={ROUTES.DESTINATIONS}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Browse Destinations
              </Link>
            </div>
          </div>
        )}

        {/* Bottom note */}
        {deals.length > 0 && (
          <p className="mt-12 text-center text-xs text-slate-400">
            All deals are verified by Vibe Miles. Prices shown are per person before GST.{' '}
            <Link href={ROUTES.PACKAGES} className="font-semibold text-amber-600 hover:underline">
              Browse all packages without filters →
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
