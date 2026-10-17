import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MapPin, Calendar, Thermometer, Sparkles, CheckCircle2 } from 'lucide-react';
import { packageService } from '@/services/package.service';
import { PackageCard } from '@/components/cards/PackageCard';
import { RatingStars } from '@/components/ui/RatingStars';
import { DestinationWeather } from '@/components/weather';

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const destination = await packageService.getDestinationBySlug(resolvedParams.slug);

  if (!destination) {
    notFound();
  }

  const packages = await packageService.getPackages({ destination: destination.name });

  return (
    <div className="space-y-8 pb-10 sm:space-y-12 sm:pb-16">
      {/* DESTINATION HERO */}
      <section className="relative overflow-hidden bg-slate-950 py-12 text-white sm:py-20">
        <div className="absolute inset-0">
          <Image
            src={destination.heroImage}
            alt={destination.name}
            width={1600}
            height={900}
            unoptimized
            priority
            className="h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 backdrop-blur-md">
            <MapPin className="w-3.5 h-3.5" />
            <span>{destination.state}, {destination.country}</span>
          </div>

          <h1 className="text-4xl font-extrabold text-white sm:text-6xl">{destination.name}</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-200 sm:text-lg">{destination.description}</p>

          <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span><strong>Best Time:</strong> {destination.bestTimeToVisit}</span>
            </div>
            {destination.averageTemperature && (
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-teal-400" />
                <span><strong>Avg Temp:</strong> {destination.averageTemperature}</span>
              </div>
            )}
            <RatingStars rating={destination.rating} reviewCount={destination.reviewCount} size="sm" />
          </div>
        </div>
      </section>

      {/* HIGHLIGHTED ACTIVITIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" /> Top Things to Do in {destination.name}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-2">
            {destination.topActivities.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                <span className="text-sm font-semibold text-slate-800">{activity}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE WEATHER & FORECAST */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Live Conditions</span>
          <h2 className="text-2xl font-extrabold text-slate-900">Weather in {destination.name}</h2>
        </div>
        <DestinationWeather city={destination.name} state={destination.state} />
      </section>

      {/* PACKAGES FOR THIS DESTINATION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Available Packages</span>
            <h2 className="text-2xl font-extrabold text-slate-900">Trips in {destination.name}</h2>
          </div>
        </div>

        {packages.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} packageData={pkg} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No packages currently available for this destination.</p>
        )}
      </section>
    </div>
  );
}
