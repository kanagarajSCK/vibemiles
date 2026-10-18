'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { sanitizeRedirectPath, isValidInternalPath } from '@/lib/redirect';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || searchParams.get('redirect') || searchParams.get('returnUrl');
  const safeNext = sanitizeRedirectPath(nextParam, '');

  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (safeNext && isValidInternalPath(safeNext)) {
        router.push(safeNext);
      } else if (user.role === 'admin') {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else if (user.role === 'provider') {
        router.push(ROUTES.PROVIDER_DASHBOARD);
      } else {
        router.push(ROUTES.ACCOUNT_DASHBOARD);
      }
    }
  }, [authLoading, isAuthenticated, user, router, safeNext]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login({ emailOrPhone: email, password, role: 'customer' }, safeNext);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Incorrect email or password. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 via-white to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <Link href={ROUTES.HOME} className="inline-flex items-center justify-center transition-opacity hover:opacity-90">
            <Image
              src="/vibe-miles-logo.png"
              alt="Vibe Miles"
              width={260}
              height={90}
              className="h-16 sm:h-20 w-auto object-contain"
              priority
            />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Welcome back, Traveller!</h2>
            <p className="text-xs text-slate-500 mt-1">Sign in to access your bookings, trips, and rewards.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            placeholder="you@example.com"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            placeholder="Your password"
          />

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-teal-700" />
              Remember me
            </label>
            <Link href={ROUTES.FORGOT_PASSWORD} className="font-semibold text-teal-700 hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        {safeNext && (
          <div className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-2.5 text-center text-xs font-medium text-teal-800">
            Sign in is required to continue to your requested page.
          </div>
        )}

        {/* Register link */}
        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            href={safeNext ? `${ROUTES.REGISTER}?next=${encodeURIComponent(safeNext)}` : ROUTES.REGISTER}
            className="font-bold text-teal-700 hover:underline"
          >
            Create Account
          </Link>
        </div>

        {/* Partner entry point */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-700">Travel Business Owner?</p>
            <p className="text-[10px] text-slate-500">List your packages and grow with Vibe Miles</p>
          </div>
          <Link href={ROUTES.PARTNER_LOGIN}>
            <Button variant="outline" size="sm" leftIcon={<Building2 className="w-3.5 h-3.5 text-teal-700" />}>
              Partner Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 via-white to-emerald-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
