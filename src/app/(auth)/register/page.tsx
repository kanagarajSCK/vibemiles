'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Phone, Lock, ArrowRight, UserCheck, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { sanitizeRedirectPath, isValidInternalPath } from '@/lib/redirect';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') || searchParams.get('redirect') || searchParams.get('returnUrl');
  const safeNext = sanitizeRedirectPath(nextParam, '');

  const { register, user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authLoading && isAuthenticated && user) {
    const targetDashboard =
      safeNext && isValidInternalPath(safeNext) && user.role === 'customer'
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
              You already have an active session as
            </p>
            <p className="mt-1 text-base font-bold text-slate-900">{user.email}</p>
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
              Continue to Dashboard
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full justify-center text-slate-700"
              onClick={async () => {
                await logout();
              }}
            >
              Register a New / Different Account
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await register({
        fullName,
        email,
        phone,
        password,
        role,
      }, safeNext);
      // AuthContext.register sets state and navigates to the target page or dashboard
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Registration failed. Please check your details.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center space-y-2">
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
          <h2 className="text-2xl font-extrabold text-slate-900">Create your account</h2>
          <p className="text-xs text-slate-500">Join thousands of travelers exploring India.</p>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`rounded-lg py-2 transition-all ${
              role === 'customer' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            I am a Traveler
          </button>
          <button
            type="button"
            onClick={() => setRole('provider')}
            className={`rounded-lg py-2 transition-all ${
              role === 'provider' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            I am a Tour Operator
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="Mobile Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
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
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-md"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </form>

        <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            href={safeNext ? `${ROUTES.LOGIN}?next=${encodeURIComponent(safeNext)}` : ROUTES.LOGIN}
            className="font-bold text-teal-700 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
