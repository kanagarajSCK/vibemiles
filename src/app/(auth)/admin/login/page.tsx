'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else if (user.role === 'provider') {
        router.push(ROUTES.PROVIDER_DASHBOARD);
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
      await login({ emailOrPhone: email, password, role: 'admin' });
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Invalid admin credentials. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900/20 via-slate-950 to-slate-950" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href={ROUTES.HOME} className="inline-flex items-center justify-center">
            <Image
              src="/vibe-miles-logo.png"
              alt="Vibe Miles"
              width={180}
              height={65}
              className="h-12 w-auto object-contain brightness-0 invert opacity-90"
              priority
            />
          </Link>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-rose-300">Super Admin Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Admin Sign In</h1>
            <p className="text-xs text-slate-400">
              Restricted access · Platform control center
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-8 shadow-2xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
                className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-600 focus:border-rose-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-xs font-semibold text-rose-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-rose-600 hover:bg-rose-700 border-rose-600"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Access Admin Panel
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600">
          Not an admin?{' '}
          <Link href={ROUTES.HOME} className="font-semibold text-slate-400 hover:text-white transition-colors">
            Return to Vibe Miles
          </Link>
        </p>
      </div>
    </div>
  );
}
