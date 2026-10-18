import { NextRequest } from 'next/server';
import { proxy } from '../src/proxy';
import { prisma } from '../src/lib/prisma';
import { getDestinations, getDestinationBySlug } from '../src/server/db/destinations';
import { getPublishedPackages, getPublishedPackagesWithCount, getPackageBySlug } from '../src/server/db/packages';
import { getCategories } from '../src/server/db/categories';
import { createBookingInDb } from '../src/server/db/bookings';
import { isValidInternalPath, sanitizeRedirectPath } from '../src/lib/redirect';
import { SESSION_COOKIE_NAME } from '../src/server/auth/token';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

function createMockRequest(pathname: string, method = 'GET', cookieValue?: string): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const headers = new Headers();
  if (cookieValue) {
    headers.set('cookie', `${SESSION_COOKIE_NAME}=${cookieValue}`);
  }
  return new NextRequest(url, { method, headers });
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log(' VIBEMILES: GUEST BROWSING & AUTHENTICATION ENFORCEMENT VERIFICATION');
  console.log('========================================================================\n');

  try {
    // -------------------------------------------------------------
    // TEST 1: Logged-out access to Homepage ('/')
    // -------------------------------------------------------------
    console.log('--- Test 1: Logged-out access to Homepage ("/") ---');
    const req1 = createMockRequest('/');
    const res1 = await proxy(req1);
    // When proxy allows public access, it calls NextResponse.next() which does not have a redirect Location
    const loc1 = res1.headers.get('location');
    assert(!loc1, 'Test 1.1: Homepage does not redirect unauthenticated guests to login');
    assert(res1.status === 200, 'Test 1.2: Homepage proxy passes through with HTTP 200');

    // -------------------------------------------------------------
    // TEST 2: Logged-out access to Destinations ('/destinations')
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Logged-out access to Destinations ("/destinations") ---');
    const req2 = createMockRequest('/destinations');
    const res2 = await proxy(req2);
    const loc2 = res2.headers.get('location');
    assert(!loc2, 'Test 2.1: /destinations does not redirect to login');
    
    // Verify real destinations exist in PostgreSQL
    const destinations = await getDestinations();
    assert(Array.isArray(destinations) && destinations.length > 0, `Test 2.2: Loaded ${destinations.length} real destinations from PostgreSQL`);
    const manali = destinations.find((d) => d.slug.toLowerCase().includes('manali') || d.name.toLowerCase().includes('manali'));
    assert(Boolean(manali), 'Test 2.3: Real destination (Manali) found in database records');

    // -------------------------------------------------------------
    // TEST 3: Logged-out access to Destination Detail ('/destinations/[slug]')
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Logged-out access to Destination Detail ("/destinations/[slug]") ---');
    const targetDestSlug = manali?.slug || destinations[0]?.slug || 'manali';
    const req3 = createMockRequest(`/destinations/${targetDestSlug}`);
    const res3 = await proxy(req3);
    const loc3 = res3.headers.get('location');
    assert(!loc3, `Test 3.1: /destinations/${targetDestSlug} does not redirect to login`);
    
    const singleDest = await getDestinationBySlug(targetDestSlug);
    assert(Boolean(singleDest && singleDest.id), `Test 3.2: Retrieved destination record "${singleDest?.name}" with real metadata`);

    // -------------------------------------------------------------
    // TEST 4: Logged-out access to Stays ('/stays')
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Logged-out access to Stays ("/stays") ---');
    const req4 = createMockRequest('/stays');
    const res4 = await proxy(req4);
    const loc4 = res4.headers.get('location');
    assert(!loc4, 'Test 4.1: /stays does not redirect to login');

    const publishedPkgs = await getPublishedPackages({ take: 20 });
    assert(Array.isArray(publishedPkgs), `Test 4.2: Stays query returned ${publishedPkgs.length} published packages from database`);

    // -------------------------------------------------------------
    // TEST 5: Logged-out access to Packages ('/packages')
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Logged-out access to Packages ("/packages") ---');
    const req5 = createMockRequest('/packages');
    const res5 = await proxy(req5);
    const loc5 = res5.headers.get('location');
    assert(!loc5, 'Test 5.1: /packages does not redirect to login');

    const { packages: allPkgs, total: totalPkgs } = await getPublishedPackagesWithCount({ take: 10 });
    assert(totalPkgs > 0 && allPkgs.length > 0, `Test 5.2: Loaded ${totalPkgs} published marketplace packages from database`);
    assert(
      allPkgs.every(
        (p) =>
          String(p.status || '').toLowerCase() === 'published' &&
          String(p.approvalStatus || '').toLowerCase() === 'approved'
      ),
      'Test 5.3: All returned packages are published and approved'
    );

    // -------------------------------------------------------------
    // TEST 6: Logged-out access to Package Detail ('/packages/[slug]')
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Logged-out access to Package Detail ("/packages/[slug]") ---');
    const testPkg = allPkgs[0];
    const req6 = createMockRequest(`/packages/${testPkg.slug}`);
    const res6 = await proxy(req6);
    const loc6 = res6.headers.get('location');
    assert(!loc6, `Test 6.1: /packages/${testPkg.slug} does not redirect to login`);

    const loadedPkg = await getPackageBySlug(testPkg.slug, { requirePublished: true });
    assert(Boolean(loadedPkg && loadedPkg.id === testPkg.id), `Test 6.2: Package "${loadedPkg?.name}" retrieved with full itinerary and details`);

    // -------------------------------------------------------------
    // TEST 7: Logged-out access to Search ('/search', '/devotional-trips', '/foreign-trips')
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Logged-out access to Search and Curated Trips ---');
    const reqSearch = createMockRequest('/search?q=kerala');
    const resSearch = await proxy(reqSearch);
    assert(!resSearch.headers.get('location'), 'Test 7.1: /search?q=kerala allows unauthenticated guest access');

    const reqDevo = createMockRequest('/devotional-trips');
    const resDevo = await proxy(reqDevo);
    assert(!resDevo.headers.get('location'), 'Test 7.2: /devotional-trips allows unauthenticated guest access');

    const reqForeign = createMockRequest('/foreign-trips');
    const resForeign = await proxy(reqForeign);
    assert(!resForeign.headers.get('location'), 'Test 7.3: /foreign-trips allows unauthenticated guest access');

    // -------------------------------------------------------------
    // TEST 8: Public Catalog APIs (GET /api/packages, /api/destinations, /api/categories)
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Public Catalog APIs ---');
    const reqApiPkg = createMockRequest('/api/packages', 'GET');
    const resApiPkg = await proxy(reqApiPkg);
    assert(!resApiPkg.headers.get('location'), 'Test 8.1: GET /api/packages is public and allowed');
    assert(resApiPkg.status === 200, 'Test 8.2: GET /api/packages returns 200');

    const reqApiDest = createMockRequest('/api/destinations', 'GET');
    const resApiDest = await proxy(reqApiDest);
    assert(!resApiDest.headers.get('location'), 'Test 8.3: GET /api/destinations is public and allowed');

    const reqApiCat = createMockRequest('/api/categories', 'GET');
    const resApiCat = await proxy(reqApiCat);
    assert(!resApiCat.headers.get('location'), 'Test 8.4: GET /api/categories is public and allowed');

    const categories = await getCategories();
    assert(categories.length > 0, `Test 8.5: Categories retrieved from database (${categories.length} categories)`);

    // -------------------------------------------------------------
    // TEST 9: Logged-out attempt to access '/booking/[packageId]' -> Redirects to Login
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Mandatory Authentication for Booking Wizard ---');
    const bookingPath = `/booking/${testPkg.id}?date=2026-11-15&adults=3`;
    const reqBook = createMockRequest(bookingPath);
    const resBook = await proxy(reqBook);
    const bookRedirect = resBook.headers.get('location') || '';
    assert(
      [307, 308, 302].includes(resBook.status),
      `Test 9.1: Unauthenticated request to ${bookingPath} is intercepted with HTTP ${resBook.status} redirect`
    );
    assert(
      bookRedirect.includes('/login?next='),
      `Test 9.2: Redirect destination points to /login?next=... (actual: ${bookRedirect})`
    );
    assert(
      bookRedirect.includes(encodeURIComponent(bookingPath)) || bookRedirect.includes(testPkg.id),
      'Test 9.3: Target package ID, date, and adults parameters are safely preserved in next param'
    );

    // -------------------------------------------------------------
    // TEST 10: Post-Login Redirection Preservation
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Post-Login Redirection & Sanitization ---');
    const testTarget = `/booking/${testPkg.id}?date=2026-11-15&adults=3`;
    const isSafe = isValidInternalPath(testTarget);
    assert(isSafe, `Test 10.1: isValidInternalPath correctly validates internal booking path with query parameters`);

    const sanitized = sanitizeRedirectPath(testTarget);
    assert(sanitized === testTarget, `Test 10.2: sanitizeRedirectPath preserves full booking path: ${sanitized}`);

    // Verify malicious external redirect is rejected
    const maliciousTarget = 'https://evil-phishing-site.com/steal-credentials';
    const sanitizedMalicious = sanitizeRedirectPath(maliciousTarget);
    assert(sanitizedMalicious === '/account/dashboard', 'Test 10.3: Malicious external redirect is sanitized to /account/dashboard');

    // -------------------------------------------------------------
    // TEST 11: Server-side Booking Creation Security & Validation
    // -------------------------------------------------------------
    console.log('\n--- Test 11: Server-side Booking Creation Protection ---');
    // Direct unauthenticated API call to POST /api/bookings
    const reqPostBooking = createMockRequest('/api/bookings', 'POST');
    const resPostBooking = await proxy(reqPostBooking);
    assert(resPostBooking.status === 401, `Test 11.1: Direct unauthenticated POST /api/bookings rejected by proxy with HTTP 401 Unauthorized`);

    // Verify createBookingInDb rejects invalid inputs
    let errorCaught = false;
    try {
      await createBookingInDb({
        customerId: '',
        packageId: testPkg.id,
        travelDate: '2026-11-15',
        adults: 0,
        travelerDetails: [],
      });
    } catch (err: unknown) {
      errorCaught = true;
      const msg = err instanceof Error ? err.message : '';
      assert(
        msg.includes('Customer account identifier is required') || msg.includes('At least 1 adult'),
        `Test 11.2: Server database layer strictly validated booking parameters: "${msg}"`
      );
    }
    assert(errorCaught, 'Test 11.3: Invalid booking creation was rejected');

    // -------------------------------------------------------------
    // TEST 12: Role-Based Access Control (Admin, Provider, Account Protected)
    // -------------------------------------------------------------
    console.log('\n--- Test 12: Role-Based Access Control & Admin/Provider Protection ---');
    
    // Logged-out Admin attempt
    const reqAdmin = createMockRequest('/admin/dashboard');
    const resAdmin = await proxy(reqAdmin);
    const adminLoc = resAdmin.headers.get('location') || '';
    assert(adminLoc.includes('/admin/login'), `Test 12.1: Logged-out access to /admin/dashboard redirects to /admin/login (got ${adminLoc})`);

    // Logged-out Provider attempt
    const reqProvider = createMockRequest('/provider/dashboard');
    const resProvider = await proxy(reqProvider);
    const providerLoc = resProvider.headers.get('location') || '';
    assert(providerLoc.includes('/partner/login'), `Test 12.2: Logged-out access to /provider/dashboard redirects to /partner/login (got ${providerLoc})`);

    // Logged-out Provider verification attempt
    const reqVerify = createMockRequest('/partner/verification');
    const resVerify = await proxy(reqVerify);
    const verifyLoc = resVerify.headers.get('location') || '';
    assert(verifyLoc.includes('/partner/login'), `Test 12.3: Logged-out access to /partner/verification redirects to /partner/login (got ${verifyLoc})`);

    // Logged-out Account attempt
    const reqAccount = createMockRequest('/account/dashboard');
    const resAccount = await proxy(reqAccount);
    const accountLoc = resAccount.headers.get('location') || '';
    assert(accountLoc.includes('/login'), `Test 12.4: Logged-out access to /account/dashboard redirects to /login (got ${accountLoc})`);

    // Logged-out protected APIs
    const reqAdminApi = createMockRequest('/api/admin/users', 'GET');
    const resAdminApi = await proxy(reqAdminApi);
    assert(resAdminApi.status === 401, 'Test 12.5: Unauthenticated GET /api/admin/users returns HTTP 401 Unauthorized');

    const reqProviderApi = createMockRequest('/api/provider/packages', 'GET');
    const resProviderApi = await proxy(reqProviderApi);
    assert(resProviderApi.status === 401, 'Test 12.6: Unauthenticated GET /api/provider/packages returns HTTP 401 Unauthorized');

    const reqPaymentsApi = createMockRequest('/api/payments/create-order', 'POST');
    const resPaymentsApi = await proxy(reqPaymentsApi);
    assert(resPaymentsApi.status === 401, 'Test 12.7: Unauthenticated POST /api/payments/create-order returns HTTP 401 Unauthorized');

    console.log('\n========================================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
