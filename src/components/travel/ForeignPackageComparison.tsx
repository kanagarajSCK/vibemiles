'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight, Scale } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Package } from '@/types';

interface ForeignPackageComparisonProps {
  packages: Package[];
}

export function ForeignPackageComparison({ packages }: ForeignPackageComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    packages.slice(0, 3).map((p) => p.id)
  );

  if (packages.length < 2) return null;

  const selectedPackages = packages.filter((p) => selectedIds.includes(p.id));

  const togglePackage = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      } else {
        setSelectedIds([...selectedIds.slice(1), id]);
      }
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
            <Scale className="h-4 w-4" />
            <span>Interactive Comparison</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Compare International Packages
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Compare duration, price, inclusions, and exclusions side-by-side.
          </p>
        </div>

        {/* Selection Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">Select up to 3:</span>
          {packages.map((pkg) => {
            const isSelected = selectedIds.includes(pkg.id);
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => togglePackage(pkg.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {pkg.destinationName || pkg.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-[600px]">
          {selectedPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4"
            >
              <div>
                <span className="inline-block rounded-md bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800">
                  {pkg.destinationName}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1.5 line-clamp-2">
                  {pkg.name}
                </h3>
              </div>

              <div className="border-y border-slate-200/80 py-3 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    ₹{pkg.finalPrice.toLocaleString('en-IN')}
                  </span>
                  {pkg.discountPercent > 0 && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{pkg.basePrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {pkg.durationDays} Days / {pkg.durationNights} Nights per traveller
                </p>
              </div>

              {/* Highlights */}
              <div className="space-y-1.5 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Trip Highlights
                </span>
                <ul className="space-y-1 text-xs text-slate-700">
                  {pkg.highlights.slice(0, 3).map((h, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusions Transparency */}
              <div className="space-y-1 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 text-[11px] text-amber-900">
                <span className="font-bold flex items-center gap-1">
                  <X className="h-3 w-3 text-amber-700" /> Essential Exclusions:
                </span>
                <p className="text-amber-800 leading-tight">
                  Flights, entry visa fees, and personal travel insurance are not included unless specified.
                </p>
              </div>

              <Link href={`/packages/${pkg.slug}`} className="block pt-2">
                <Button variant="primary" size="sm" className="w-full justify-center">
                  <span>View Package Details</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
