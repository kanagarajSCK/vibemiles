'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Check, ArrowRight, Calendar } from 'lucide-react';
import type { PackageComparisonResult } from '@/server/ai/types';
import { Button } from '@/components/ui/Button';

interface AiComparisonTableProps {
  comparison: PackageComparisonResult;
}

export const AiComparisonTable: React.FC<AiComparisonTableProps> = ({ comparison }) => {
  if (!comparison || comparison.packages.length === 0) return null;

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Side-by-Side Marketplace Comparison
        </h4>
        <span className="text-[11px] text-slate-400">
          {comparison.packages.length} Packages Compared
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="p-3 font-semibold text-slate-500 w-32 shrink-0">Feature</th>
              {comparison.packages.map((pkg) => (
                <th key={pkg.id} className="p-3 font-bold text-slate-900 min-w-[180px]">
                  <Link href={`/packages/${pkg.slug}`} className="hover:text-emerald-700 transition-colors">
                    {pkg.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Price Row */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Price</td>
              {comparison.packages.map((pkg) => (
                <td key={pkg.id} className="p-3">
                  <div className="font-extrabold text-emerald-700 text-sm">
                    ₹{pkg.finalPrice.toLocaleString('en-IN')}
                  </div>
                  {pkg.discountPercent > 0 && (
                    <div className="text-[10px] text-slate-400 line-through">
                      ₹{pkg.basePrice.toLocaleString('en-IN')} ({pkg.discountPercent}% OFF)
                    </div>
                  )}
                </td>
              ))}
            </tr>

            {/* Duration */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Duration</td>
              {comparison.packages.map((pkg) => (
                <td key={pkg.id} className="p-3 text-slate-700 font-medium">
                  {pkg.duration}
                </td>
              ))}
            </tr>

            {/* Destination */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Destination</td>
              {comparison.packages.map((pkg) => (
                <td key={pkg.id} className="p-3 text-slate-700">
                  {pkg.destination}, {pkg.state}
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Rating</td>
              {comparison.packages.map((pkg) => (
                <td key={pkg.id} className="p-3">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{pkg.rating.toFixed(1)}</span>
                    <span className="text-slate-400 font-normal text-[10px]">({pkg.reviewCount})</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Key Inclusions */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Top Inclusions</td>
              {comparison.packages.map((pkg) => (
                <td key={pkg.id} className="p-3 space-y-1">
                  {pkg.topInclusions.slice(0, 3).map((inc, i) => (
                    <div key={i} className="flex items-start gap-1 text-[11px] text-slate-700">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </td>
              ))}
            </tr>

            {/* Next Departure */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Next Departure</td>
              {comparison.packages.map((pkg) => (
                <td key={pkg.id} className="p-3 text-slate-700 text-[11px]">
                  {pkg.nextAvailableDate ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                      {pkg.nextAvailableDate}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Check listing</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Host */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Tour Operator</td>
              {comparison.packages.map((pkg) => (
                <td key={pkg.id} className="p-3 text-slate-600 text-[11px]">
                  {pkg.providerName}
                </td>
              ))}
            </tr>

            {/* Action */}
            <tr>
              <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Action</td>
              {comparison.packages.map((pkg) => (
                <td key={pkg.id} className="p-3">
                  <Link href={`/packages/${pkg.slug}`}>
                    <Button size="sm" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-1">
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
