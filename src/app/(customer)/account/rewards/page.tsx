'use client';

import React from 'react';
import { Gift, Award, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AccountRewardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Gift className="w-6 h-6 text-amber-500" /> Reward Points & Tier Loyalty
          </h1>
          <p className="text-xs text-slate-500">Earn 5% cashback points on every completed booking.</p>
        </div>
        <Badge variant="warning">SILVER TIER TRAVELER</Badge>
      </div>

      {/* Balance Card */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 to-amber-600 p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-100">Available Points Balance</span>
          <h2 className="text-4xl font-black text-white mt-1">2,450 Points</h2>
          <p className="text-xs text-amber-100 mt-1">Equivalent to ₹2,450 discount on your next trip booking.</p>
        </div>
        <Button variant="secondary" size="md" className="bg-slate-900 text-white hover:bg-slate-800">
          Redeem Points Now
        </Button>
      </div>
    </div>
  );
}
