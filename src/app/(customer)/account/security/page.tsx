'use client';

import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function AccountSecurityPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-teal-700" /> Security & Password
        </h1>
        <p className="text-xs text-slate-500">Update account password and active session security.</p>
      </div>

      <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 max-w-xl">
        <Input label="Current Password" type="password" />
        <Input label="New Password" type="password" />
        <Input label="Confirm New Password" type="password" />
        <div className="pt-2">
          <Button variant="primary" size="md" leftIcon={<Lock className="w-4 h-4" />}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
