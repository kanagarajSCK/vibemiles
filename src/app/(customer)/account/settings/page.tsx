'use client';

import React from 'react';
import { Settings, Shield, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-700" /> Account Settings
        </h1>
        <p className="text-xs text-slate-500 font-medium">Notification preferences and language defaults.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 max-w-xl">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900">SMS Booking Alerts</h4>
            <p className="text-xs text-slate-500">Receive instant WhatsApp & SMS voucher alerts</p>
          </div>
          <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-slate-300 text-teal-700" />
        </div>
      </div>
    </div>
  );
}
