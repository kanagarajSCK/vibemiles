import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Clock,
  Users,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
  Heart,
  Share2,
} from 'lucide-react';
import { getSessionUser } from '@/server/auth/guard';
import { getPackageBySlug } from '@/server/db/packages';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { RatingStars } from '@/components/ui/RatingStars';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import { DestinationWeather } from '@/components/weather';
import { PackageBookingSidebar } from '@/components/travel/PackageBookingSidebar';
import { PackageDetailWishlistButton } from '@/components/travel/PackageDetailWishlistButton';
import { PackageReviewsSection, PackageReviewsSkeleton } from '@/components/travel/PackageReviewsSection';

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const auth = await getSessionUser().catch(() => null);

  const pkg = await getPackageBySlug(resolvedParams.slug, {
    allowPreviewForUser: auth?.user ? { id: auth.user.id, role: auth.user.role } : undefined,
    requirePublished: !auth?.user || auth.user.role === 'customer',
  });

  if (!pkg) {
    notFound();
  }

  const isPreview = pkg.status !== 'PUBLISHED';

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 py-5 pb-16 sm:space-y-8 sm:px-6 sm:py-8 sm:pb-20 lg:px-8">
      {/* Moderation Preview Banner */}
      {isPreview && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Moderation Preview Mode:</strong> This package is currently in <strong>{pkg.status || 'PENDING REVIEW'}</strong> status. It is visible only to the listing owner and platform administrators.
            </span>
          </div>
          <Badge variant="warning" size="sm">PREVIEW</Badge>
        </div>
      )}

      {/* Breadcrumbs & Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href={ROUTES.HOME} className="hover:text-teal-700">Home</Link>
          <span>/</span>
          <Link href={ROUTES.PACKAGES} className="hover:text-teal-700">Packages</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate">{pkg.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="sm">{pkg.category.toUpperCase()}</Badge>
              <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                <span>{pkg.destinationName}, {pkg.state}</span>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{pkg.name}</h1>
          </div>

          <div className="flex items-center gap-4">
            <RatingStars rating={pkg.rating} reviewCount={pkg.reviewCount} size="lg" />
            <div className="flex items-center gap-2">
              <button className="rounded-full border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <PackageDetailWishlistButton packageData={pkg} />
            </div>
          </div>
        </div>
      </div>

      {/* IMAGE GALLERY GRID */}
      {(() => {
        const fallbackImage = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';
        const mainImage = (pkg.images && pkg.images[0]) || fallbackImage;
        const sideImages = pkg.images && pkg.images.length > 1 ? pkg.images.slice(1, 3) : [];

        return (
          <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:grid-cols-3 sm:gap-3 sm:rounded-3xl">
            <div className={`relative ${sideImages.length > 0 ? 'sm:col-span-2' : 'sm:col-span-3'} aspect-16/10 overflow-hidden`}>
              <Image
                src={mainImage}
                alt={pkg.name}
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
                unoptimized
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            {sideImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                {sideImages.map((img, i) => (
                  <div key={i} className="relative aspect-16/10 overflow-hidden">
                    <Image
                      src={img}
                      alt={`${pkg.name} ${i + 2}`}
                      fill
                      sizes="(min-width: 640px) 33vw, 50vw"
                      unoptimized
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* QUICK HIGHLIGHTS BAR */}
      <div className="grid grid-cols-2 gap-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-4 sm:gap-4 sm:divide-y-0 sm:divide-x sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 sm:h-10 sm:w-10">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-slate-400 block">Duration</span>
            <span className="text-sm font-bold text-slate-900">{pkg.durationDays} Days / {pkg.durationNights} Nights</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:pl-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 sm:h-10 sm:w-10">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-slate-400 block">Group Size</span>
            <span className="text-sm font-bold text-slate-900">Up to {pkg.maxGroupSize} Travelers</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:pl-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 sm:h-10 sm:w-10">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-slate-400 block">Cancellation</span>
            <span className="text-sm font-semibold text-emerald-700">{pkg.cancellationPolicy.freeCancellationDays} Days Free Cancellation</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:pl-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 sm:h-10 sm:w-10">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-slate-400 block">Tour Provider</span>
            <span className="block wrap-break-word text-sm font-bold text-slate-900">{pkg.providerName}</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID (LEFT DETAILS + RIGHT BOOKING WIDGET) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-10">
          {/* Overview */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">Trip Overview</h2>
            <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
              {pkg.description}
            </p>
          </section>

          {/* Day-by-Day Itinerary */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-5 sm:space-y-6 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">Day-by-Day Itinerary</h2>
            <div className="relative border-l-2 border-teal-600/30 pl-6 space-y-8 ml-3">
              {pkg.itinerary.map((day) => (
                <div key={day.day} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-7.75 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-white text-xs font-bold shadow-md">
                    {day.day}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">
                      Day {day.day}: {day.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{day.description}</p>
                    {day.meals && day.meals.length > 0 && (
                      <div className="pt-2 flex items-center gap-2 text-xs font-medium text-teal-800">
                        <span>Included Meals:</span>
                        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 border border-teal-200">
                          {day.meals.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Inclusions & Exclusions */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-5 sm:space-y-6 sm:p-6">
            <h2 className="text-xl font-bold text-slate-900">Package Inclusions & Exclusions</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> What is Included
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {pkg.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-sm text-rose-800 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" /> What is Excluded
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {pkg.exclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">✕</span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Provider Box */}
          <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 font-bold text-xl text-white">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{pkg.providerName}</h3>
                <p className="text-xs text-slate-400">Verified Travel Operator on Vibe Miles</p>
              </div>
            </div>
            <Link href={ROUTES.PROVIDER_HOME}>
              <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                View Provider Profile
              </Button>
            </Link>
          </section>

          {/* Traveler Reviews - Streamed via Suspense */}
          <React.Suspense
            fallback={
              <PackageReviewsSkeleton
                rating={pkg.rating}
                reviewCount={pkg.reviewCount}
              />
            }
          >
            <PackageReviewsSection
              packageId={pkg.id}
              rating={pkg.rating}
              reviewCount={pkg.reviewCount}
            />
          </React.Suspense>
        </div>

        {/* Right Column - Sticky Booking Widget */}
        <aside className="lg:col-span-1">
          <PackageBookingSidebar pkg={pkg} />
        </aside>
      </div>
    </div>
  );
}
