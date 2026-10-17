import { NextRequest, NextResponse } from 'next/server';
import { validateDbSession, SESSION_COOKIE_NAME } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const sessionData = await validateDbSession(sessionCookie);

    if (!sessionData) {
      // Clear stale/expired cookie
      const response = NextResponse.json({ user: null }, { status: 401, headers: NO_CACHE_HEADERS });
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

    return NextResponse.json({ user: sessionData.user }, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ user: null }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
