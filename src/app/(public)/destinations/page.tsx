import React from 'react';
import { getDestinations } from '@/server/db/destinations';
import { DestinationDirectoryClient } from '@/components/travel/DestinationDirectoryClient';

export const revalidate = 60;

export default async function DestinationsPage() {
  const destinations = await getDestinations();
  return <DestinationDirectoryClient initialDestinations={destinations} />;
}
