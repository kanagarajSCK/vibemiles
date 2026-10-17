'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { MOCK_PACKAGES } from '@/lib/mock-data';
import { PackageCard } from '@/components/cards/PackageCard';
import { Badge } from '@/components/ui/Badge';

export default function AccountWishlistPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Saved Wishlist
          </h1>
          <p className="text-xs text-slate-500">Your favorite saved tour packages and stays.</p>
        </div>
        <Badge variant="brand">{MOCK_PACKAGES.length} Saved Trips</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {MOCK_PACKAGES.map((pkg) => (
          <PackageCard key={pkg.id} packageData={pkg} isWishlisted />
        ))}
      </div>
    </div>
  );
}
