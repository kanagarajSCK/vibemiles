import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { UserRole as AppUserRole } from '@/types';
import { UserRole as PrismaUserRole, UserStatus } from '@prisma/client';

export * from './token';
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionTokenPayload,
} from './token';

export interface SanitizedUser {
  id: string;
  email: string;
  phone: string | null;
  role: AppUserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  customerProfile?: {
    id: string;
    fullName: string;
    avatar: string | null;
    city: string | null;
    state: string | null;
    rewardPoints: number;
    isVerified: boolean;
    isBlocked: boolean;
  } | null;
  providerProfile?: {
    id: string;
    businessName: string;
    ownerName: string;
    businessCategory: string;
    city: string;
    state: string;
    verificationStatus: string;
    isActive: boolean;
    rating: number;
    reviewCount: number;
  } | null;
}

/**
 * Maps Prisma UserRole enum to application lowercase UserRole string.
 */
export function mapPrismaRole(role: PrismaUserRole): AppUserRole {
  switch (role) {
    case PrismaUserRole.ADMIN:
      return 'admin';
    case PrismaUserRole.PROVIDER:
      return 'provider';
    default:
      return 'customer';
  }
}

/**
 * Creates a database session record in PostgreSQL and returns the signed cookie token.
 */
export async function createDbSession(
  userId: string,
  userRole: PrismaUserRole,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ token: string; sessionId: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const randomToken = crypto.randomBytes(32).toString('hex');

  const session = await prisma.session.create({
    data: {
      userId,
      token: randomToken,
      expiresAt,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });

  const appRole = mapPrismaRole(userRole);
  const signedToken = await signSessionToken({
    userId,
    role: appRole,
    sessionId: session.id,
  });

  return {
    token: signedToken,
    sessionId: session.id,
    expiresAt,
  };
}

/**
 * Validates a session token against the database and confirms user is active.
 * Server-only (requires Prisma and PostgreSQL).
 */
export async function validateDbSession(signedToken: string): Promise<{
  sessionId: string;
  user: SanitizedUser;
} | null> {
  const payload = await verifySessionToken(signedToken);
  if (!payload || !payload.sessionId) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: {
      user: {
        include: {
          customerProfile: true,
          providerProfile: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Check expiration
  if (session.expiresAt.getTime() <= Date.now()) {
    // Clean up expired session
    try {
      await prisma.session.delete({ where: { id: session.id } });
    } catch {
      // Ignore cleanup error
    }
    return null;
  }

  // Check user active status
  if (session.user.status !== UserStatus.ACTIVE) {
    return null;
  }

  // Security check: Assert that token payload userId strictly matches the database session's userId
  if (session.userId !== payload.userId) {
    return null;
  }

  const user = session.user;
  const appRole = mapPrismaRole(user.role);

  // Assert that token payload role matches the user's actual database role
  if (payload.role && payload.role !== appRole) {
    return null;
  }

  const sanitizedUser: SanitizedUser = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: appRole,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    customerProfile: user.customerProfile
      ? {
          id: user.customerProfile.id,
          fullName: user.customerProfile.fullName,
          avatar: user.customerProfile.avatar,
          city: user.customerProfile.city,
          state: user.customerProfile.state,
          rewardPoints: user.customerProfile.rewardPoints,
          isVerified: user.customerProfile.isVerified,
          isBlocked: user.customerProfile.isBlocked,
        }
      : null,
    providerProfile: user.providerProfile
      ? {
          id: user.providerProfile.id,
          businessName: user.providerProfile.businessName,
          ownerName: user.providerProfile.ownerName,
          businessCategory: user.providerProfile.businessCategory,
          city: user.providerProfile.city,
          state: user.providerProfile.state,
          verificationStatus: user.providerProfile.verificationStatus.toLowerCase(),
          isActive: user.providerProfile.isActive,
          rating: user.providerProfile.rating,
          reviewCount: user.providerProfile.reviewCount,
        }
      : null,
  };

  return {
    sessionId: session.id,
    user: sanitizedUser,
  };
}

/**
 * Revokes an active session by deleting it from the database.
 */
export async function revokeDbSession(signedToken: string): Promise<void> {
  const payload = await verifySessionToken(signedToken);
  if (!payload || !payload.sessionId) return;

  try {
    await prisma.session.delete({
      where: { id: payload.sessionId },
    });
  } catch {
    // Session may already be deleted
  }
}

/**
 * Revokes all active sessions for a user (e.g. on password reset or account security action).
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: { userId },
    });
  } catch {
    // Ignore error
  }
}
