import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-6 text-slate-800 pb-20">
      <h1 className="text-3xl font-extrabold text-slate-900 border-b border-slate-200 pb-4">Privacy Policy & Data Security</h1>
      <p className="text-xs text-slate-500">Last updated: October 2026</p>
      <div className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-slate-900">1. Data Collection</h2>
        <p>We collect personal information necessary to process trip reservations, issue digital vouchers, and verify traveler identification.</p>
        <h2 className="text-lg font-bold text-slate-900">2. Data Security</h2>
        <p>All transactions and payment credentials are encrypted using 256-bit SSL protocols.</p>
      </div>
    </div>
  );
}
