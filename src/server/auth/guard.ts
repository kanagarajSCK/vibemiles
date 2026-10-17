import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, validateDbSession, SanitizedUser } from './session';
import type { UserRole } from '@/types';

export interface AuthContextResult {
  user: SanitizedUser;
  sessionId: string;
}

/**
 * Retrieves the current authenticated user and session from request cookies.
 * Server-only.
 */
export async function getSessionUser(customCookieValue?: string): Promise<AuthContextResult | null> {
  let token = customCookieValue;

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // In non-request context
      return null;
    }
  }

  if (!token) {
    return null;
  }

  return validateDbSession(token);
}

/**
 * Enforces that a request is authenticated.
 * Returns the authenticated user or throws/returns a 401 response.
 */
export async function requireAuth(): Promise<AuthContextResult> {
  const result = await getSessionUser();
  if (!result) {
    throw new AuthError('Authentication required.', 401);
  }
  return result;
}

/**
 * Enforces that an authenticated user has one of the required roles.
 * Returns the authenticated user or throws a 403 Forbidden error.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthContextResult> {
  const auth = await requireAuth();
  if (!allowedRoles.includes(auth.user.role)) {
    throw new AuthError('Access denied: insufficient permissions.', 403);
  }
  return auth;
}

/**
 * Prevents Insecure Direct Object Reference (IDOR) attacks.
 * Verifies that the requested resource belongs to the current user, or the current user is an admin.
 */
export function verifyOwnership(resourceOwnerId: string, currentUserId: string, currentUserRole: UserRole): boolean {
  if (currentUserRole === 'admin') {
    return true; // Admins have elevated access
  }
  return resourceOwnerId === currentUserId;
}

/**
 * Custom error class for API auth failures.
 */
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }

  toResponse() {
    return NextResponse.json(
      { error: this.message },
      { status: this.statusCode }
    );
  }
}
