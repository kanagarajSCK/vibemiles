import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Award, Headphones,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { getFeaturedPackages } from '@/server/db/packages';
import { getDestinations } from '@/server/db/destinations';
import { MOCK_REVIEWS } from '@/lib/mock-data';
import { PackageCard } from '@/components/cards/PackageCard';
import { DestinationCard } from '@/components/cards/DestinationCard';
import { ReviewCard } from '@/components/cards/ReviewCard';
import { Button } from '@/components/ui/Button';
import { PACKAGE_CATEGORIES, ROUTES } from '@/constants';
import { PublicHeader } from '@/components/navigation/PublicHeader';
import { PublicFooter } from '@/components/navigation/PublicFooter';
import { HeroSlider } from '@/components/travel/HeroSlider';
import { HomeHeroSearch } from '@/components/travel/HomeHeroSearch';

export const revalidate = 60; // Cache static sections for 60 seconds on server

export default async function HomePage() {
  const [featuredPackages, destinations] = await Promise.all([
    getFeaturedPackages(6),
    getDestinations(),
  ]);

  const popularDestinations = destinations.filter((d) => d.isPopular);

  return (
    <div className="vibemiles-public flex min-h-screen flex-col bg-slate-50">
      <PublicHeader />
      <main className="flex-1">
        <div className="space-y-8 pb-10 sm:space-y-16 sm:pb-16">

          {/* ─── HERO SECTION ─── */}
          <section className="relative flex min-h-[42vh] items-center bg-slate-950 py-4 text-white sm:min-h-[calc(100svh-5rem)] sm:py-16">
            <HeroSlider interval={6000} />

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[320px] space-y-2 text-center sm:max-w-3xl sm:space-y-6">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-950/80 px-3 py-1.5 text-[11px] font-semibold text-teal-300 backdrop-blur-md sm:gap-2 sm:px-4 sm:text-xs">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Public Marketplace Demo · Explore Devotional Yatras & International Travel</span>
                </div>

                <h1 className="text-[clamp(1.8rem,6vw,2.4rem)] font-extrabold leading-[1.12] tracking-tight text-white sm:text-[clamp(3rem,5vw,5rem)] sm:leading-[1.08]">
                  Explore <span className="text-teal-400">Devotional Trips</span> & <span className="text-emerald-400">Foreign Holidays</span>
                </h1>

                <p className="mx-auto max-w-[320px] text-[14px] leading-6 text-slate-200 sm:max-w-2xl sm:text-lg sm:text-slate-300">
                  Book verified temple yatras, sacred spiritual pilgrimages, and curated international holidays directly from local experts.
                </p>
              </div>

              {/* ─── HERO SEARCH BAR (CLIENT COMPONENT) ─── */}
              <HomeHeroSearch />

              {/* Quick Tag Pills */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-300 sm:mt-6 sm:gap-2 sm:text-xs">
                <span className="font-semibold text-slate-400">Popular Searches:</span>
                <Link href="/devotional-trips?destination=Varanasi" className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20 transition-colors sm:px-3">
                  🛕 Kashi Yatra
                </Link>
                <Link href="/foreign-trips?country=Dubai" className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20 transition-colors sm:px-3">
                  ✈️ Dubai Holiday
                </Link>
                <Link href="/devotional-trips?destination=Tirupati" className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20 transition-colors sm:px-3">
                  🛕 Tirupati Balaji
                </Link>
                <Link href="/foreign-trips?country=Bali" className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20 transition-colors sm:px-3">
                  ✈️ Bali Vacation
                </Link>
                <Link href="/packages?category=tour" className="rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20 transition-colors sm:px-3">
                  Manali Volvo
                </Link>
              </div>
            </div>
          </section>

          {/* ─── POPULAR DEVOTIONAL & SACRED DESTINATIONS ─── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Sacred Places · Demo Preview</span>
                <h2 className="text-3xl font-extrabold text-slate-900">Devotional Trips & Destinations</h2>
              </div>
              <Link href={ROUTES.DEVOTIONAL_TRIPS}>
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View All Devotional Trips
                </Button>
              </Link>
            </div>
            {popularDestinations.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                {popularDestinations.map((dest) => (
                  <DestinationCard key={dest.id} destination={dest} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                <p>No popular destinations at the moment.</p>
              </div>
            )}
          </section>

          {/* ─── FEATURED PACKAGES ─── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Curated Travel · Demo Preview</span>
                <h2 className="text-3xl font-extrabold text-slate-900">Handpicked Tour Packages</h2>
              </div>
              <Link href={ROUTES.PACKAGES}>
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Browse All Packages
                </Button>
              </Link>
            </div>
            {featuredPackages.length > 0 ? (
              <div className="mx-auto grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
                {featuredPackages.map((pkg) => (
                  <PackageCard key={pkg.id} packageData={pkg} compact />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                <p>No featured packages at the moment.</p>
                <Link href={ROUTES.PACKAGES} className="inline-block mt-2 text-sm font-semibold text-teal-700 hover:underline">
                  Browse the marketplace →
                </Link>
              </div>
            )}
          </section>

          {/* ─── WHY CHOOSE US ─── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Verified Local Experts</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Every tour operator, driver, and homestay host is rigorously verified for trust, safety, and background credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Best Price Guarantee</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Direct marketplace pricing with zero hidden fees. Book authentic experiences with guaranteed transparent rates.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">24/7 On-Trip Support</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    From booking confirmation to the end of your journey, our dedicated local support team is always just a call away.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ─── BROWSE BY CATEGORY ─── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Trip Styles</span>
              <h2 className="text-3xl font-extrabold text-slate-900">Find Your Travel Style</h2>
              <p className="text-sm text-slate-600">Explore curated journeys crafted for every kind of traveller</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {PACKAGE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.value}
                  href={`${ROUTES.PACKAGES}?category=${cat.value}`}
                  className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-600 hover:shadow-md transition-all text-center"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <span className="mt-3 text-sm font-bold text-slate-900 group-hover:text-teal-700">{cat.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ─── CUSTOMER REVIEWS ─── */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Traveller Stories</span>
                <h2 className="text-3xl font-extrabold text-slate-900">Loved by 10,000+ Explorers</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_REVIEWS.slice(0, 3).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </section>

        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
