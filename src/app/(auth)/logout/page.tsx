'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    logout()
      .then(() => {
        router.push(ROUTES.LOGIN);
      })
      .catch(() => {
        router.push(ROUTES.HOME);
      });
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Signing out safely...</p>
      </div>
    </div>
  );
}
