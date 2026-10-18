import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { UserRole } from '@/types';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/server/auth/token';
import { validateDbSession } from '@/server/auth/session';
import { isValidInternalPath, sanitizeRedirectPath } from '@/lib/redirect';

// ─── Public Pages & APIs ───────────────────────────────────────
// Unauthenticated guests can freely explore the marketplace, destinations, stays, packages, trips, etc.
function isPublicPage(pathname: string): boolean {
  if (
    pathname === '/' ||
    pathname === '/destinations' ||
    pathname.startsWith('/destinations/') ||
    pathname === '/stays' ||
    pathname.startsWith('/stays/') ||
    pathname === '/packages' ||
    pathname.startsWith('/packages/') ||
    pathname === '/devotional-trips' ||
    pathname === '/foreign-trips' ||
    pathname === '/adventures' ||
    pathname.startsWith('/adventures/') ||
    pathname === '/food' ||
    pathname.startsWith('/food/') ||
    pathname === '/deals' ||
    pathname === '/search' ||
    pathname === '/assistant' ||
    pathname === '/about' ||
    pathname === '/contact' ||
    pathname === '/faq' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/cancellation-policy' ||
    pathname === '/unauthorized'
  ) {
    return true;
  }
  return false;
}

// Auth pages for logging in and registering
const AUTH_PAGES = new Set([
  '/login',
  '/register',
  '/partner/login',
  '/admin/login',
  '/forgot-password',
  '/verify-otp',
  '/otp-verification',
]);

// Public API routes exempt from mandatory authentication
function isPublicApi(pathname: string, method: string): boolean {
  // Always allowed auth/search/utility/webhook routes
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/auth/me' ||
    pathname === '/api/locations/search' ||
    pathname === '/api/weather' ||
    pathname === '/api/assistant/chat' ||
    pathname === '/api/webhooks/razorpay'
  ) {
    return true;
  }

  // Public catalog reads (GET only)
  if (method === 'GET') {
    if (
      pathname === '/api/packages' ||
      pathname.startsWith('/api/packages/') ||
      pathname === '/api/destinations' ||
      pathname.startsWith('/api/destinations/') ||
      pathname === '/api/categories' ||
      pathname.startsWith('/api/categories/') ||
      pathname === '/api/reviews'
    ) {
      return true;
    }
  }

  return false;
}

function getDashboard(role: UserRole): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'provider') return '/provider/dashboard';
  return '/account/dashboard';
}

function getLoginForRoute(pathname: string): string {
  if (pathname.startsWith('/admin')) return '/admin/login';
  if (pathname.startsWith('/provider') || pathname.startsWith('/partner')) return '/partner/login';
  return '/login';
}

// ─── Proxy handler (Next.js 16) ────────────────────────────────
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 1. Static Assets & Next.js Internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_next') ||
    pathname === '/favicon.ico' ||
    /\.(png|jpg|jpeg|svg|webp|gif|ico|css|js|woff2?|ttf|otf|mp4|webm|map)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Cryptographically verify session token and validate against PostgreSQL database
  let session = null;
  if (cookieValue) {
    const payload = await verifySessionToken(cookieValue);
    if (payload && payload.sessionId) {
      try {
        const dbResult = await validateDbSession(cookieValue);
        if (dbResult) {
          session = {
            userId: dbResult.user.id,
            role: dbResult.user.role,
            sessionId: dbResult.sessionId,
          };
        }
      } catch (err) {
        console.error('Session validation error in proxy:', err);
      }
    }
  }
  const isAuthenticated = Boolean(session && session.userId);

  // 3. Handle Already-Authenticated Users on Auth Pages
  if (AUTH_PAGES.has(pathname)) {
    if (isAuthenticated && session) {
      // Redirect logged-in users away from auth pages to their respective dashboard
      const dashboardUrl = new URL(getDashboard(session.role), request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // 4. Public Page Routes
  if (isPublicPage(pathname)) {
    return NextResponse.next();
  }

  // 4.1 Public API Routes
  if (isPublicApi(pathname, request.method)) {
    return NextResponse.next();
  }

  // 5. Mandatory Login for Protected Features (Bookings, Account, Admin, Provider, etc.)
  if (!isAuthenticated || !session) {
    // 5.1 API Routes: Return HTTP 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      const unauthorizedRes = NextResponse.json(
        {
          error: 'Authentication required. Please log in to access this feature.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
      if (cookieValue) {
        unauthorizedRes.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      }
      return unauthorizedRes;
    }

    // 5.2 Protected Page Routes: Redirect to Login with preserved 'next' destination
    const fullDestination = `${pathname}${search}`;
    const safeDestination = isValidInternalPath(fullDestination)
      ? fullDestination
      : sanitizeRedirectPath(pathname, '/');

    const loginPath = getLoginForRoute(pathname);
    const redirectUrl = new URL(loginPath, request.url);
    redirectUrl.searchParams.set('next', safeDestination);

    const redirectRes = NextResponse.redirect(redirectUrl);
    if (cookieValue) {
      redirectRes.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
    }
    return redirectRes;
  }

  // 6. Role-Based Access Control (RBAC) for Authenticated Users
  const userRole = session.role;

  // 6.1 Admin Routes
  if ((pathname.startsWith('/admin') && pathname !== '/admin/login') || pathname.startsWith('/api/admin')) {
    if (userRole !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden: Admin privilege required.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 6.2 Provider Routes
  if (
    pathname.startsWith('/provider') ||
    pathname.startsWith('/api/provider') ||
    pathname === '/partner/verification'
  ) {
    if (userRole !== 'provider' && userRole !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden: Provider privilege required.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 6.3 Customer Routes
  if (pathname.startsWith('/account')) {
    if (userRole !== 'customer' && userRole !== 'admin') {
      if (userRole === 'provider') {
        return NextResponse.redirect(new URL('/provider/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 7. Session is valid and authorized
  const response = NextResponse.next();
  response.headers.set('x-user-id', session.userId);
  response.headers.set('x-user-role', session.role);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|mp4|webm)).*)',
  ],
};
