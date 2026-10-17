'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Reset your password</h2>
          <p className="text-xs text-slate-500">Enter your registered email address to receive password reset instructions.</p>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-teal-50 p-6 text-center space-y-3 border border-teal-200">
            <CheckCircle2 className="w-10 h-10 text-teal-700 mx-auto" />
            <h4 className="font-bold text-sm text-slate-900">Reset Link Dispatched</h4>
            <p className="text-xs text-slate-600">We&apos;ve sent a password reset link to {email}</p>
            <Link href={ROUTES.LOGIN}>
              <Button variant="primary" size="sm" className="mt-2">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            />
            <Button type="submit" variant="primary" size="lg" className="w-full font-bold shadow-md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Send Reset Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
