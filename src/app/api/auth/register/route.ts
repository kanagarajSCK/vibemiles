import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createCustomerUser,
  createProviderUser,
  isEmailRegistered,
  normalizeEmail,
} from '@/server/db/users';
import {
  createDbSession,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  mapPrismaRole,
} from '@/server/auth/session';
import { checkRateLimit, recordFailedAttempt } from '@/server/auth/rate-limit';

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid 10-digit mobile number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'provider'], {
    error: 'Role must be either customer or provider',
  }),
  businessName: z.string().optional(),
  businessCategory: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Security check: Never allow public registration to create ADMIN users
    if (body.role === 'admin') {
      return NextResponse.json(
        { error: 'Admin registration is not allowed.' },
        { status: 403 }
      );
    }

    const parsed = registrationSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || 'Invalid registration details.' },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const normalizedEmail = normalizeEmail(data.email);

    // Rate limiting for registrations per IP
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const rateLimitKey = `register:${clientIp}`;
    const rateCheck = checkRateLimit(rateLimitKey, 10, 60 * 60 * 1000); // 10 registrations per hour per IP

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts from this network. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if email is already taken
    const emailExists = await isEmailRegistered(normalizedEmail);
    if (emailExists) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: 'An account with this email address is already registered.' },
        { status: 409 }
      );
    }

    let result;
    if (data.role === 'provider') {
      result = await createProviderUser({
        fullName: data.fullName,
        email: normalizedEmail,
        phone: data.phone,
        password: data.password,
        businessName: data.businessName,
        businessCategory: data.businessCategory,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      });
    } else {
      result = await createCustomerUser({
        fullName: data.fullName,
        email: normalizedEmail,
        phone: data.phone,
        password: data.password,
      });
    }

    const { user, profile } = result;
    const appRole = mapPrismaRole(user.role);

    // Create session in PostgreSQL
    const userAgent = request.headers.get('user-agent') || undefined;
    const { token: signedSessionToken } = await createDbSession(user.id, user.role, {
      ipAddress: clientIp,
      userAgent,
    });

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: appRole,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.createdAt.toISOString(),
      customerProfile: data.role === 'customer' ? profile : null,
      providerProfile: data.role === 'provider' ? profile : null,
    };

    const response = NextResponse.json(
      {
        success: true,
        message: 'Account registered successfully.',
        user: sanitizedUser,
      },
      { status: 201 }
    );

    // Set secure HTTP-only session cookie
    response.cookies.set(SESSION_COOKIE_NAME, signedSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed.';
    return NextResponse.json(
      { error: message },
      { status: 400 }
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
