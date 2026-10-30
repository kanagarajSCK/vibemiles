import React from 'react';
import { getPublishedPackages } from '@/server/db/packages';
import { StaysClient } from '@/components/travel/StaysClient';

export const revalidate = 60;

export default async function StaysPage() {
  const initialPackages = await getPublishedPackages({
    categories: ['villa', 'homestay', 'hotel', 'hostel', 'camping'],
    take: 50,
  });
  return <StaysClient initialPackages={initialPackages} />;
}
