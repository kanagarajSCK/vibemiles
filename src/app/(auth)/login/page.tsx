'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, Building2, UserCheck, LogOut } from 'lucide-react';
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

  const { login, user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isSwitchRequested = searchParams.get('switch') === 'true' || searchParams.get('prompt') === 'login';

  useEffect(() => {
    if (isSwitchRequested && isAuthenticated) {
      logout();
    }
  }, [isSwitchRequested, isAuthenticated, logout]);

  if (!authLoading && isAuthenticated && user && !isSwitchRequested) {
    const customer = user as unknown as { fullName?: string; customerProfile?: { fullName?: string } } | null;
    const provider = user as unknown as { businessName?: string; providerProfile?: { businessName?: string } } | null;
    const displayName =
      customer?.fullName ||
      customer?.customerProfile?.fullName ||
      provider?.businessName ||
      provider?.providerProfile?.businessName ||
      user.email?.split('@')[0] ||
      'Traveler';

    const targetDashboard =
      safeNext && isValidInternalPath(safeNext)
        ? safeNext
        : user.role === 'admin'
        ? ROUTES.ADMIN_DASHBOARD
        : user.role === 'provider'
        ? ROUTES.PROVIDER_DASHBOARD
        : ROUTES.ACCOUNT_DASHBOARD;

    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 via-white to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-center">
          <Link href={ROUTES.HOME} className="inline-flex items-center justify-center transition-opacity hover:opacity-90">
            <Image
              src="/vibe-miles-logo.png"
              alt="Vibe Miles"
              width={220}
              height={80}
              className="h-16 w-auto object-contain mx-auto"
              priority
            />
          </Link>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-teal-700 shadow-xs">
            <UserCheck className="h-7 w-7" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Already Signed In</h2>
            <p className="mt-1 text-xs text-slate-500">
              You are currently signed in as
            </p>
            <p className="mt-1 text-base font-bold text-slate-900">
              {displayName}
            </p>
            <p className="text-xs text-slate-500">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-700">
              Role: {user.role}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md justify-center"
              onClick={() => router.push(targetDashboard)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {safeNext ? 'Continue to Requested Page' : 'Continue to Dashboard'}
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full justify-center text-slate-700"
              onClick={async () => {
                setIsLoading(true);
                await logout();
                setIsLoading(false);
              }}
              isLoading={isLoading}
            >
              Sign In to a Different Account
            </Button>

            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push(ROUTES.HOME);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors pt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out & Return Home
            </button>
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
