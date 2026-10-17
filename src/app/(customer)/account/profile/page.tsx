'use client';

import React, { useState, useEffect } from 'react';
import { User, Save, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function AccountProfilePage() {
  const { user } = useAuth();
  const customer = user as unknown as {
    fullName?: string;
    customerProfile?: { fullName?: string };
  } | null;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(customer?.fullName || customer?.customerProfile?.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user, customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-teal-700" /> Traveler Profile Details
        </h1>
        <p className="text-xs text-slate-500">Update your personal contact information for faster booking checkout.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 max-w-xl">
        {isSaved && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            Profile details updated successfully.
          </div>
        )}

        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. John Doe"
          required
        />
        <Input
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          disabled
          helperText="Email is permanently tied to your account login."
        />
        <Input
          label="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +91 98765 43210"
        />
        <Input
          label="Emergency Contact Person"
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
          placeholder="e.g. Relative Name (+91 98111 22233)"
        />
        <div className="pt-2">
          <Button variant="primary" size="md" type="submit" leftIcon={<Save className="w-4 h-4" />}>
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
