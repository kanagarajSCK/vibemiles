'use client';

import React from 'react';
import { Users, Mail, Phone } from 'lucide-react';
import { MOCK_CUSTOMERS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';

export default function ProviderCustomersPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-700" /> Customer Database Roster
        </h1>
        <p className="text-xs text-slate-500">Contact information and booking history of travelers who booked your packages.</p>
      </div>

      <div className="space-y-3">
        {MOCK_CUSTOMERS.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <img src={c.avatar} alt={c.fullName} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">{c.fullName}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-3">
                  <span><Mail className="w-3 h-3 inline mr-1" />{c.email}</span>
                  <span><Phone className="w-3 h-3 inline mr-1" />{c.phone}</span>
                </p>
              </div>
            </div>
            <Badge variant="success">ACTIVE TRAVELER</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
