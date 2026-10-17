'use client';

import React from 'react';
import { Settings, Save } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-700" /> Platform Global Settings & GST Tax Configuration
        </h1>
        <p className="text-xs text-slate-500">Marketplace commission percentage, GST rate, and email gateway credentials.</p>
      </div>

      <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 max-w-xl">
        <Input label="Default Platform Commission Rate (%)" defaultValue="15" />
        <Input label="Government GST Rate (%)" defaultValue="5" />
        <Input label="Platform Support Email" defaultValue="support@vibemiles.com" />
        <Input label="Platform Support Helpline" defaultValue="+91 1800 123 4567" />
        <div className="pt-2">
          <Button variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
            Save Global System Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
