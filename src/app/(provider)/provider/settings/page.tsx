'use client';

import React from 'react';
import { Settings, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ProviderSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-700" /> Business Settings & Verification KYC
        </h1>
        <p className="text-xs text-slate-500">Legal business profile, PAN/GST verification, and payout bank details.</p>
      </div>

      <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 max-w-xl">
        <Input label="Business Legal Name" defaultValue="Himalayan Expeditions & Stays" />
        <Input label="Owner / Authorized Director Name" defaultValue="Vikram Singh" />
        <Input label="Business PAN Number" defaultValue="ABCDE1234F" />
        <Input label="GSTIN Number (Optional)" defaultValue="02ABCDE1234F1Z5" />
        <Input label="Bank Account Number" defaultValue="50100234912834" />
        <Input label="Bank IFSC Code" defaultValue="HDFC0001234" />
        <div className="pt-2">
          <Button variant="primary" size="md">
            Save Verification Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
