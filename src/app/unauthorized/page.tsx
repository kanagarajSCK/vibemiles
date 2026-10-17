'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ShieldOff, Home, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import { useAuthOptional } from '@/context/AuthContext';

function getDashboard(role: string | null | undefined) {
  if (role === 'admin') return ROUTES.ADMIN_DASHBOARD;
  if (role === 'provider') return ROUTES.PROVIDER_DASHBOARD;
  if (role === 'customer') return ROUTES.ACCOUNT_DASHBOARD;
  return ROUTES.HOME;
}

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '';
  const auth = useAuthOptional();
  const role = auth?.role;

  const areaLabel = from.startsWith('/admin')
    ? 'Admin Control Center'
    : from.startsWith('/provider')
    ? 'Provider Partner Portal'
    : from.startsWith('/account')
    ? 'Customer Account'
    : 'this area';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="inline-flex items-center justify-center">
          <Image
            src="/vibe-miles-logo.png"
            alt="Vibe Miles"
            width={160}
            height={60}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Shield Icon */}
        <div className="relative mx-auto h-28 w-28">
          <div className="absolute inset-0 rounded-full bg-rose-100 animate-pulse" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-rose-50 border-2 border-rose-200">
            <ShieldOff className="h-12 w-12 text-rose-500" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900">Access Restricted</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            You don&apos;t have permission to access <span className="font-semibold text-slate-700">{areaLabel}</span>.
            {role && (
              <> Your current role is{' '}<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 capitalize"><Lock className="w-2.5 h-2.5" />{role}</span>.</>
            )}
          </p>
        </div>

        {/* Role-specific info box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Why am I seeing this?</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
              Each section of Vibe Miles is restricted to its own role.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
              Customer, Partner, and Admin portals are completely isolated.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
              Log in with the correct account to access this area.
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {role ? (
            <Link href={getDashboard(role)}>
              <Button variant="primary" size="lg" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
                Go to My Dashboard
              </Button>
            </Link>
          ) : (
            <Link href={ROUTES.LOGIN}>
              <Button variant="primary" size="lg" className="w-full" leftIcon={<Lock className="w-4 h-4" />}>
                Sign In
              </Button>
            </Link>
          )}
          <Link href={ROUTES.HOME}>
            <Button variant="outline" size="md" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
