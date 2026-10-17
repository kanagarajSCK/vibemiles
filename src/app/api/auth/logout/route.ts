import { NextRequest, NextResponse } from 'next/server';
import { revokeDbSession, SESSION_COOKIE_NAME } from '@/server/auth/session';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionCookie) {
      // Invalidate the session in PostgreSQL
      await revokeDbSession(sessionCookie);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    // Clear session cookie with expiration in the past
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even if database revocation encounters an error, always clear the client cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out.',
    });
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }
}
