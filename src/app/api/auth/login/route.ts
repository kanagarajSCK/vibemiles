import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserForAuth } from '@/server/db/users';
import { verifyPassword } from '@/server/auth/password';
import {
  createDbSession,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  mapPrismaRole,
} from '@/server/auth/session';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/server/auth/rate-limit';

const loginInputSchema = z.object({
  emailOrPhone: z.string().min(3, 'Email or Phone is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['customer', 'provider', 'admin']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide email and password.' },
        { status: 400 }
      );
    }

    const { emailOrPhone, password, role: requestedRole } = parsed.data;

    // Rate limiting to prevent brute force
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const rateLimitKey = `login:${clientIp}:${emailOrPhone.toLowerCase()}`;
    const rateCheck = checkRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    // Lookup user in PostgreSQL database
    const user = await findUserForAuth(emailOrPhone);

    // Generic error helper to avoid account enumeration
    const genericAuthError = () => {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: 'Incorrect email or password. Please try again.' },
        { status: 401 }
      );
    };

    if (!user || !user.passwordHash) {
      return genericAuthError();
    }

    // Verify bcrypt password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return genericAuthError();
    }

    const actualRole = mapPrismaRole(user.role);

    // Enforce role matching if specified by client portal
    if (requestedRole && requestedRole !== actualRole) {
      if (requestedRole === 'customer' && actualRole === 'provider') {
        return NextResponse.json(
          { error: 'This account is registered as a Travel Partner. Please sign in via the Partner Portal (/partner/login).' },
          { status: 403 }
        );
      }
      if (requestedRole === 'customer' && actualRole === 'admin') {
        return NextResponse.json(
          { error: 'This account is registered as an Admin. Please sign in via the Admin Portal (/admin/login).' },
          { status: 403 }
        );
      }
      if (requestedRole === 'provider' && actualRole === 'customer') {
        return NextResponse.json(
          { error: 'This account is registered as a Traveler. Please sign in via the Traveler Sign In (/login).' },
          { status: 403 }
        );
      }
      return genericAuthError();
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account is suspended or inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // Reset rate limit on successful authentication
    resetRateLimit(rateLimitKey);

    // Create database session in PostgreSQL
    const userAgent = request.headers.get('user-agent') || undefined;
    const { token: signedSessionToken } = await createDbSession(user.id, user.role, {
      ipAddress: clientIp,
      userAgent,
    });

    // Build sanitized user response
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: actualRole,
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

    const response = NextResponse.json({
      success: true,
      user: sanitizedUser,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set(SESSION_COOKIE_NAME, signedSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
