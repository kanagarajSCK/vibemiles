import * as jose from 'jose';
import type { UserRole as AppUserRole } from '@/types';

export const SESSION_COOKIE_NAME = 'vibe_session';
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionTokenPayload {
  userId: string;
  role: AppUserRole;
  sessionId: string;
  exp?: number;
  iat?: number;
}

/**
 * Returns the HMAC-SHA256 secret key encoded for jose.
 * Pure Edge & Node.js compatible (Web Crypto API).
 */
export function getAuthSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET environment variable is missing in production');
    }
    // Safe development fallback
    return new TextEncoder().encode('vibemiles-development-secret-key-min-32-chars-long!');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Signs a session payload using HMAC-SHA256 (JWT). Edge and Node.js compatible.
 */
export async function signSessionToken(payload: {
  userId: string;
  role: AppUserRole;
  sessionId: string;
}): Promise<string> {
  const secret = getAuthSecretKey();
  return new jose.SignJWT({
    userId: payload.userId,
    role: payload.role,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

/**
 * Verifies the JWT signature and expiration.
 * Edge-compatible (pure Web Crypto via jose, does not hit the database).
 */
export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  if (!token) return null;
  try {
    const secret = getAuthSecretKey();
    const { payload } = await jose.jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      role: payload.role as AppUserRole,
      sessionId: payload.sessionId as string,
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}
