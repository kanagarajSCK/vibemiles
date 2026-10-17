'use client';

import React from 'react';
import { Tag, Plus } from 'lucide-react';
import { MOCK_COUPONS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AdminCouponsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-teal-700" /> Platform Coupons & Campaign Manager
          </h1>
          <p className="text-xs text-slate-500">Create promotional discount codes and holiday vouchers.</p>
        </div>
        <Button variant="accent" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Create New Coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MOCK_COUPONS.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-teal-800 text-base">{c.code}</span>
              <Badge variant="success">ACTIVE</Badge>
            </div>
            <p className="text-xs text-slate-600">{c.description}</p>
            <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 pt-2">
              <span>Usage Count: {c.usedCount} / {c.usageLimit}</span>
              <Button variant="ghost" size="sm">Deactivate</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
