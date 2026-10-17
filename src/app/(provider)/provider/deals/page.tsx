'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Tag, Clock, Pause, Play, BarChart3, Zap } from 'lucide-react';
import { MOCK_DEALS } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DealStatus } from '@/types';

const STATUS_BADGE: Record<DealStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  active:    { label: 'Active',     variant: 'success' },
  paused:    { label: 'Paused',     variant: 'warning' },
  expired:   { label: 'Expired',    variant: 'error' },
  scheduled: { label: 'Scheduled',  variant: 'neutral' },
};

// In a real app provider deals would come from the session userId; we mock prov-1
const PROVIDER_ID = 'prov-1';

export default function ProviderDealsPage() {
  const myDeals = MOCK_DEALS.filter((d) => d.providerId === PROVIDER_ID);
  const [deals, setDeals] = useState(myDeals);

  const togglePause = (id: string) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: d.status === 'active' ? 'paused' : 'active' }
          : d
      )
    );
  };

  const totalSavings = deals.reduce((s, d) => s + d.savingsAmount * d.usedCount, 0);
  const activeCount = deals.filter((d) => d.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Deals & Promotions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and manage limited-time offers for your travel packages.
          </p>
        </div>
        <Button
          variant="accent"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => alert('Create Deal form coming in the next sprint!')}
        >
          Create Deal
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Deals', value: deals.length, icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Active Now', value: activeCount, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Total Redemptions', value: deals.reduce((s, d) => s + d.usedCount, 0), icon: BarChart3, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
          { label: 'Customer Savings', value: `₹${(totalSavings / 1000).toFixed(0)}K`, icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Deals Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700">All My Deals</h2>
        </div>

        {deals.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🏷️</p>
            <h3 className="font-bold text-slate-800 text-lg">No deals yet</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">Create your first deal to attract more travelers.</p>
            <Button variant="primary" size="sm" onClick={() => alert('Create Deal form coming soon!')}>
              Create Your First Deal
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {deals.map((deal) => {
              const badge = STATUS_BADGE[deal.status];
              const seatsUsed = deal.usageLimit ? `${deal.usedCount}/${deal.usageLimit}` : deal.usedCount;
              const endShort = new Date(deal.endDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: '2-digit',
              });

              return (
                <div key={deal.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50 transition-colors">
                  {/* Left info */}
                  <div className="flex items-center gap-4">
                    <Image
                      src={deal.packageImage}
                      alt={deal.packageName}
                      width={80}
                      height={56}
                      unoptimized
                      className="h-14 w-20 rounded-xl object-cover shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={badge.variant} size="sm">{badge.label.toUpperCase()}</Badge>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                          {deal.dealType.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm truncate">{deal.title}</h3>
                      <p className="text-xs text-slate-500 truncate">
                        {deal.packageName} · Ends {endShort}
                      </p>
                    </div>
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-6 sm:shrink-0">
                    {/* Pricing info */}
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-slate-400 line-through block">
                        {formatCurrency(deal.originalPrice)}
                      </span>
                      <span className="text-sm font-extrabold text-amber-700">
                        {formatCurrency(deal.finalPrice)}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-semibold">
                        Save {formatCurrency(deal.savingsAmount)}
                      </span>
                    </div>

                    {/* Redemptions */}
                    <div className="text-center hidden sm:block">
                      <span className="text-lg font-extrabold text-slate-800">{seatsUsed}</span>
                      <p className="text-[10px] text-slate-400">Redeemed</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/packages/${deal.packageSlug}`}>
                        <Button variant="ghost" size="sm" className="text-xs">View</Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        leftIcon={deal.status === 'active'
                          ? <Pause className="w-3.5 h-3.5" />
                          : <Play className="w-3.5 h-3.5" />}
                        onClick={() => togglePause(deal.id)}
                      >
                        {deal.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tip card */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4">
        <span className="text-2xl shrink-0">💡</span>
        <div>
          <h4 className="font-bold text-amber-900 text-sm">Pro Tip: Flash Deals convert best</h4>
          <p className="text-xs text-amber-700 mt-0.5">
            Flash Deals with 20%+ discount and a 7-day window consistently get 3× more bookings than standard offers.
            Consider running a Flash Deal on your most popular package this weekend.
          </p>
        </div>
      </div>
    </div>
  );
}
