import React from 'react';
import { Utensils } from 'lucide-react';
import { packageService } from '@/services/package.service';
import { PackageCard } from '@/components/cards/PackageCard';
import type { PackageCategory } from '@/types';

export const dynamic = 'force-dynamic';

export default async function FoodPage() {
  const allPackages = await packageService.getPackages({ category: 'food' as PackageCategory });
  const foodTours = allPackages.filter(
    (p) => p.category === 'food' || p.tags.includes('food') || p.tags.includes('culinary')
  );
  const displayList = foodTours.length > 0 ? foodTours : allPackages;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="rounded-3xl bg-amber-950 p-8 sm:p-12 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-800/60 px-3.5 py-1 text-xs font-semibold text-amber-200">
          <Utensils className="w-4 h-4 text-amber-400" /> Culinary Trails & Spice Tours
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-5xl">Authentic Food & Cultural Walks</h1>
        <p className="text-amber-100 text-sm max-w-2xl">
          Savor Royal Rajasthani thalis, Old Delhi street food walks, Malabar spice plantation tours, and coastal seafood dining experiences.
        </p>
      </div>

      {displayList.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {displayList.map((pkg) => (
            <PackageCard key={pkg.id} packageData={pkg} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Utensils className="mx-auto h-10 w-10 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No culinary packages found</h3>
          <p className="text-sm text-slate-500 mt-1">Check back soon or explore our general travel catalog.</p>
        </div>
      )}
    </div>
  );
}
