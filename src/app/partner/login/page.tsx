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
  const { login, user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authLoading && isAuthenticated && user) {
    const isPartner = user.role === 'provider';
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
        <div className="max-w-md w-full space-y-6 rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl text-center text-white">
          <Link href={ROUTES.HOME} className="inline-flex items-center justify-center">
            <Image src="/vibe-miles-logo.png" alt="Vibe Miles" width={220} height={80} className="h-16 w-auto object-contain mx-auto" />
          </Link>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-900/60 border border-teal-700 text-teal-400">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Already Signed In</h2>
            <p className="mt-1 text-xs text-slate-400">
              Current session: <span className="text-white font-semibold">{user.email}</span>
            </p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-950 border border-teal-800 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
              Role: {user.role}
            </div>
            {!isPartner && (
              <p className="mt-3 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-xl p-2.5">
                You are currently signed in as a traveler ({user.email}). To access the partner portal, please sign in with your partner account.
              </p>
            )}
          </div>
          <div className="space-y-3 pt-2">
            {isPartner ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center font-bold"
                onClick={() => router.push(ROUTES.PROVIDER_DASHBOARD)}
              >
                Go to Partner Dashboard
              </Button>
            ) : (
              <Button
                variant="outline"
                size="md"
                className="w-full justify-center border-slate-700 text-slate-300 hover:bg-slate-900"
                onClick={() => router.push(ROUTES.ACCOUNT_DASHBOARD)}
              >
                Return to Traveler Dashboard
              </Button>
            )}
            <Button
              variant={isPartner ? 'outline' : 'primary'}
              size={isPartner ? 'md' : 'lg'}
              className="w-full justify-center font-bold"
              onClick={async () => {
                await logout();
              }}
            >
              Sign In to a Different Partner Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
