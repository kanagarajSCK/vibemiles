import React from 'react';

export default function CancellationPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-6 text-slate-800 pb-20">
      <h1 className="text-3xl font-extrabold text-slate-900 border-b border-slate-200 pb-4">Cancellation & Refund Policy</h1>
      <p className="text-xs text-slate-500">Last updated: October 2026</p>
      <div className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">1. Standard Cancellation Rules</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cancellations 15+ days before departure: 100% full refund</li>
          <li>Cancellations 7-14 days before departure: 75% refund</li>
          <li>Cancellations within 3-6 days of departure: 50% refund</li>
          <li>Cancellations within 48 hours of departure: Non-refundable</li>
        </ul>
      </div>
    </div>
  );
}
