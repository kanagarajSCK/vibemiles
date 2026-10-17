'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardOptions {
  /** The role required to access this page */
  requiredRole: UserRole;
  /** Where to redirect if unauthenticated */
  redirectTo?: string;
}

/**
 * Client-side secondary auth guard.
 * Complements the middleware — handles hydration edge cases
 * and provides loading state to pages.
 */
export function useAuthGuard({ requiredRole, redirectTo }: AuthGuardOptions) {
  const router = useRouter();
  const { user, role, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const loginPage =
        requiredRole === 'admin'
          ? '/admin/login'
          : requiredRole === 'provider'
          ? '/partner/login'
          : '/login';
      router.replace(redirectTo ?? loginPage);
      return;
    }

    if (role !== requiredRole) {
      router.replace(`/unauthorized?role=${role}`);
    }
  }, [isLoading, isAuthenticated, role, requiredRole, redirectTo, router]);

  return { user, role, isLoading, isAuthenticated };
}
