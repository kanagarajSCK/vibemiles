'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/types';
import { authService, LoginParams, RegisterParams } from '@/services/auth.service';
import { ROUTES } from '@/constants';

import { isValidInternalPath } from '@/lib/redirect';

// ─── Context Shape ────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isProvider: boolean;
  isAdmin: boolean;
  login: (params: LoginParams, nextRedirect?: string | null) => Promise<void>;
  register: (params: RegisterParams, nextRedirect?: string | null) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session from cookie on mount
  useEffect(() => {
    authService.getCurrentUser().then((u) => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await authService.getCurrentUser();
    setUser(u);
  }, []);

  const login = useCallback(async (params: LoginParams, nextRedirect?: string | null) => {
    const { user: loggedIn } = await authService.login(params);
    setUser(loggedIn);

    if (nextRedirect && isValidInternalPath(nextRedirect)) {
      router.push(nextRedirect);
      return;
    }

    // Role-based redirect after login
    if (loggedIn.role === 'admin') {
      router.push(ROUTES.ADMIN_DASHBOARD);
    } else if (loggedIn.role === 'provider') {
      router.push(ROUTES.PROVIDER_DASHBOARD);
    } else {
      router.push(ROUTES.ACCOUNT_DASHBOARD);
    }
  }, [router]);

  const register = useCallback(async (params: RegisterParams, nextRedirect?: string | null) => {
    const { user: registered } = await authService.register(params);
    setUser(registered);

    if (nextRedirect && isValidInternalPath(nextRedirect) && registered.role === 'customer') {
      router.push(nextRedirect);
      return registered;
    }

    // Role-based redirect after registration
    if (registered.role === 'admin') {
      router.push(ROUTES.ADMIN_DASHBOARD);
    } else if (registered.role === 'provider') {
      router.push(ROUTES.PROVIDER_DASHBOARD);
    } else {
      router.push(ROUTES.ACCOUNT_DASHBOARD);
    }
    return registered;
  }, [router]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    router.push(ROUTES.HOME);
  }, [router]);

  const role = user?.role ?? null;

  const value: AuthContextValue = {
    user,
    role,
    isLoading,
    isAuthenticated: !!user,
    isCustomer: role === 'customer',
    isProvider: role === 'provider',
    isAdmin: role === 'admin',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

// ─── Optional: conditional hook (won't throw outside provider) ──
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
