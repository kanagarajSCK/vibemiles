'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';

export default function OtpVerificationPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['5', '8', '2', '9', '1', '4']);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push(ROUTES.ACCOUNT_DASHBOARD);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 border border-teal-200">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Enter OTP Security Code</h2>
          <p className="text-xs text-slate-500 mt-1">We sent a 6-digit verification code to +91 98765 43210</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const copy = [...otp];
                  copy[idx] = e.target.value;
                  setOtp(copy);
                }}
                className="h-12 w-12 rounded-xl border border-slate-300 text-center font-mono text-xl font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            ))}
          </div>

          <Button type="submit" variant="accent" size="lg" className="w-full font-bold shadow-md" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Verify OTP & Complete Setup
          </Button>
        </form>

        <p className="text-xs text-slate-400">
          Didn&apos;t receive the code? <button className="font-bold text-teal-700 hover:underline">Resend OTP (30s)</button>
        </p>
      </div>
    </div>
  );
}
