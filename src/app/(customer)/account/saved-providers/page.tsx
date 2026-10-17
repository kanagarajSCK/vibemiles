'use client';

import React from 'react';
import { Building2, Star } from 'lucide-react';
import { MOCK_PROVIDERS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';

export default function AccountSavedProvidersPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-teal-700" /> Saved Tour Operators
        </h1>
        <p className="text-xs text-slate-500">Verified travel operators and houseboats saved to your profile.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MOCK_PROVIDERS.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 font-bold text-white text-lg">
                {p.businessName[0]}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{p.businessName}</h4>
                <p className="text-xs text-slate-500">{p.businessCategory} • {p.address.city}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {p.rating} ({p.reviewCount} reviews)
              </div>
              <Badge variant="success">VERIFIED OPERATOR</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
