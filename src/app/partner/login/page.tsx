'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Building2, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';

export default function PartnerLoginPage() {
  const router = useRouter();
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'provider') {
        router.push(ROUTES.PROVIDER_DASHBOARD);
      } else if (user.role === 'admin') {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else {
        router.push(ROUTES.ACCOUNT_DASHBOARD);
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login({ emailOrPhone: email, password, role: 'provider' });
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Invalid partner credentials. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(13,148,136,0.2)_0%,_transparent_60%)]" />
        <div className="relative">
          <Link href={ROUTES.HOME} className="flex items-center gap-3">
            <Image src="/vibe-miles-logo.png" alt="Vibe Miles" width={120} height={120} className="h-10 w-auto object-contain" />
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">VIBE <span className="text-emerald-400">MILES</span></span>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest">Explore. Connect. Experience.</p>
            </div>
          </Link>
        </div>

        <div className="relative space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/15 border border-teal-500/30 px-3 py-1 text-xs font-bold text-teal-300">
              <Building2 className="w-3.5 h-3.5" /> Partner Dashboard
            </div>
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Manage your listings,<br />bookings & business<br />from one place.
            </h2>
          </div>

          <div className="space-y-3">
            {['Real-time booking notifications', 'Earnings & payout tracking', 'Customer reviews & analytics'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">© {new Date().getFullYear()} Vibe Miles. Partner Network.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="flex lg:hidden mb-8">
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <Image src="/vibe-miles-logo.png" alt="Vibe Miles" width={100} height={100} className="h-9 w-auto object-contain" />
            <span className="font-extrabold text-lg text-slate-900">VIBE <span className="text-emerald-700">MILES</span></span>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">Partner Sign In</h1>
            <p className="text-sm text-slate-500">Access your partner account and business dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email / Mobile"
              type="email"
              placeholder="partner@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            />

            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-teal-700" />
                Remember me
              </label>
              <Link href={ROUTES.FORGOT_PASSWORD} className="font-semibold text-teal-700 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full font-bold" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Sign In to Partner Dashboard
            </Button>
          </form>

          <div className="border-t border-slate-200 pt-6 space-y-3 text-sm text-center text-slate-500">
            <p>
              New to our partner network?{' '}
              <Link href={ROUTES.PARTNER_REGISTER} className="font-bold text-teal-700 hover:underline">
                List Your Business
              </Link>
            </p>
            <p>
              Looking for customer login?{' '}
              <Link href={ROUTES.LOGIN} className="font-semibold text-slate-700 hover:underline">
                Sign in as traveler →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
