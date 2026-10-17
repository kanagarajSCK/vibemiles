import { BusinessCategory, Customer, Provider, User, UserRole, VerificationStatus } from '@/types';

// ─── Login & Register Params ──────────────────────────────────
export interface LoginParams {
  emailOrPhone: string;
  password?: string;
  otp?: string;
  role?: UserRole;
}

export interface RegisterParams {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: 'customer' | 'provider';
  businessName?: string;
  businessCategory?: BusinessCategory;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  requiresOtp?: boolean;
}

// ─── Production Auth Service ──────────────────────────────────
class AuthService {
  private _currentUser: User | null = null;

  /**
   * Authenticates user against PostgreSQL via /api/auth/login.
   * On success, server sets an HTTP-only secure session cookie.
   */
  async login(params: LoginParams): Promise<{ user: User; token: string }> {
    this._currentUser = null;
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        emailOrPhone: params.emailOrPhone,
        password: params.password,
        role: params.role,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Authentication failed (Status ${res.status}). Please check your credentials.`);
    }

    const user = this._mapToAppUser(data.user);
    this._currentUser = user;
    return { user, token: 'session-managed-by-http-cookie' };
  }

  /**
   * Registers a new customer or provider account via /api/auth/register.
   */
  async register(params: RegisterParams): Promise<{ user: User; requiresOtp: boolean }> {
    this._currentUser = null;
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fullName: params.fullName,
        email: params.email,
        phone: params.phone,
        password: params.password,
        role: params.role,
        businessName: params.businessName,
        businessCategory: params.businessCategory,
        city: params.city,
        state: params.state,
        pincode: params.pincode,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Registration failed (Status ${res.status}).`);
    }

    const user = this._mapToAppUser(data.user);
    this._currentUser = user;
    return { user, requiresOtp: false };
  }

  /**
   * Fetches current authenticated user from /api/auth/me using HTTP-only session cookie.
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        this._currentUser = null;
        return null;
      }

      const data = await res.json().catch(() => ({}));
      if (!data.user) {
        this._currentUser = null;
        return null;
      }

      const user = this._mapToAppUser(data.user);
      this._currentUser = user;
      return user;
    } catch {
      this._currentUser = null;
      return null;
    }
  }

  /**
   * Logs out user: calls /api/auth/logout which revokes the session in PostgreSQL and clears the cookie.
   */
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      this._currentUser = null;
    }
  }

  /**
   * Legacy mock OTP verification helper (preserved for demo UI components).
   * Note: In production Phase 3, real authentication uses password verification.
   */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    return code === '123456' || code.length === 6;
  }

  /**
   * Maps server sanitized user shape to application User/Customer/Provider types.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _mapToAppUser(data: any): User {
    if (!data) return data;

    if (data.role === 'customer') {
      const customer: Customer = {
        id: data.id,
        email: data.email,
        phone: data.phone || '',
        role: 'customer',
        fullName: data.customerProfile?.fullName || 'Traveler',
        avatar: data.customerProfile?.avatar || undefined,
        city: data.customerProfile?.city || undefined,
        state: data.customerProfile?.state || undefined,
        rewardPoints: data.customerProfile?.rewardPoints || 0,
        isVerified: data.customerProfile?.isVerified ?? false,
        isBlocked: data.customerProfile?.isBlocked ?? false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      return customer;
    }

    if (data.role === 'provider') {
      const provider: Provider = {
        id: data.id,
        email: data.email,
        phone: data.phone || '',
        role: 'provider',
        businessName: data.providerProfile?.businessName || 'Travel Partner',
        ownerName: data.providerProfile?.ownerName || 'Partner',
        businessCategory: (data.providerProfile?.businessCategory as BusinessCategory) || 'Tour Organizer',
        address: {
          line1: '',
          city: data.providerProfile?.city || 'Bengaluru',
          state: data.providerProfile?.state || 'Karnataka',
          pincode: '560001',
          country: 'India',
        },
        verificationStatus: (data.providerProfile?.verificationStatus as VerificationStatus) || 'pending',
        isActive: data.providerProfile?.isActive ?? true,
        rating: data.providerProfile?.rating || 0.0,
        reviewCount: data.providerProfile?.reviewCount || 0,
        totalPackages: 0,
        joinedAt: data.createdAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
      return provider;
    }

    return {
      id: data.id,
      email: data.email,
      phone: data.phone || '',
      role: data.role,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

export const authService = new AuthService();
