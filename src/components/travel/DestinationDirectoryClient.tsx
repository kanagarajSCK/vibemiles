'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DestinationCard } from '@/components/cards/DestinationCard';
import { DestinationAutocomplete } from '@/components/travel/DestinationAutocomplete';
import { ROUTES } from '@/constants';
import { type IndiaLocation } from '@/lib/india-locations';
import type { Destination } from '@/types';

interface DestinationDirectoryClientProps {
  initialDestinations: Destination[];
}

export function DestinationDirectoryClient({
  initialDestinations,
}: DestinationDirectoryClientProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const destinations = initialDestinations;

  const handleDestinationSelect = (destination: IndiaLocation) => {
    const params = new URLSearchParams();
    params.set('destinationId', destination.id);
    if (destination.slug) {
      params.set('destinationSlug', destination.slug);
    }
    router.push(`${ROUTES.PACKAGES}?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-3 text-center sm:space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
          Destination Directory
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900">Explore Travel Destinations</h1>
        <p className="text-slate-600 text-sm">
          From snow-capped Himalayan valleys to golden coastal beaches and royal heritage cities,
          discover your next adventure destination across all of India.
        </p>

        <div className="pt-2 max-w-md mx-auto text-left relative z-20">
          <DestinationAutocomplete
            value={searchValue}
            onChange={setSearchValue}
            onSelect={handleDestinationSelect}
          />
        </div>
      </div>

      {destinations.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-6 lg:grid-cols-4 relative z-0">
          {destinations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h3 className="text-lg font-bold text-slate-900">No destinations found</h3>
          <p className="text-sm text-slate-500 mt-1">
            Please check back soon for newly added destinations.
          </p>
        </div>
      )}
    </div>
  );
}
