'use client';

import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AdminDisputesPage() {
  const disputes = [
    { id: '1', bookingRef: 'VIBE-2026-X892', customer: 'Rahul Sharma', provider: 'Himalayan Expeditions', issue: 'Vehicle delay during airport pickup', status: 'open' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" /> Customer-Provider Dispute Center
          </h1>
          <p className="text-xs text-slate-500">Arbitrate conflict resolutions between travelers and tour operators.</p>
        </div>
        <Badge variant="warning">{disputes.length} Open Dispute</Badge>
      </div>

      <div className="space-y-4">
        {disputes.map((d) => (
          <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono font-bold text-teal-800 text-xs">{d.bookingRef}</span>
                <h4 className="font-bold text-sm text-slate-900">{d.issue}</h4>
                <p className="text-xs text-slate-500">Traveler: {d.customer} vs Operator: {d.provider}</p>
              </div>
              <Badge variant="warning">UNDER ARBITRATION</Badge>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm">Issue Partial Refund</Button>
              <Button variant="primary" size="sm">Resolve & Close Dispute</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
