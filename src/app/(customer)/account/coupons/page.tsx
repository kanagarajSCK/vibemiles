'use client';

import React from 'react';
import { Tag, Copy } from 'lucide-react';
import { MOCK_COUPONS } from '@/lib/mock-data';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AccountCouponsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-teal-700" /> Promotional Coupons & Vouchers
          </h1>
          <p className="text-xs text-slate-500">Active discount codes available for your bookings.</p>
        </div>
        <Badge variant="brand">{MOCK_COUPONS.length} Coupons Available</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MOCK_COUPONS.map((coupon) => (
          <div key={coupon.id} className="rounded-2xl border border-dashed border-teal-300 bg-teal-50/40 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-teal-800 text-lg">{coupon.code}</span>
              <Badge variant="warning">{coupon.discountValue}% OFF</Badge>
            </div>
            <p className="text-xs text-slate-600 font-medium">{coupon.description}</p>
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" leftIcon={<Copy className="w-3.5 h-3.5 text-teal-700" />}>
                Copy Code
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
