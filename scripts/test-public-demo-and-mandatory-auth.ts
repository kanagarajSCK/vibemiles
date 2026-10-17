import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/server/auth/password';
import { UserRole, UserStatus, VerificationStatus } from '@prisma/client';
import { isValidInternalPath, sanitizeRedirectPath } from '../src/lib/redirect';

const BASE_URL = 'http://localhost:3000';

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

async function runTestSuite() {
  console.log('============================================================');
  console.log(' VIBEMILES: PUBLIC DEMO & MANDATORY AUTHENTICATION TEST SUITE');
  console.log('============================================================\n');

  // Verify server availability
  try {
    const pingRes = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
    assert(pingRes.status === 200, 'Server is running and responsive on port 3000');
  } catch (e) {
    console.error('Cannot connect to server. Is next dev/start running on localhost:3000?');
    process.exit(1);
  }

  const testSuffix = Date.now().toString().slice(-6);
  const testPassword = 'StrongTestPassword123!';
  const hashedPassword = await hashPassword(testPassword);

  let customerUserId = '';
  let providerUserId = '';
  let adminUserId = '';

  let customerCookie = '';
  let providerCookie = '';
  let adminCookie = '';

  try {
    // -------------------------------------------------------------
    // SETUP: Create ephemeral test accounts (Customer, Provider, Admin)
    // -------------------------------------------------------------
    console.log('\n--- Setup: Ephemeral Test Fixtures ---');
    
    // Customer fixture
    const customer = await prisma.user.create({
      data: {
        email: `demo_cust_${testSuffix}@example.com`,
        phone: `9911${testSuffix}`,
        passwordHash: hashedPassword,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        customerProfile: {
          create: {
            fullName: 'Demo Customer Traveler',
            city: 'Bengaluru',
            state: 'Karnataka',
          },
        },
      },
    });
    customerUserId = customer.id;

    // Provider fixture
    const provider = await prisma.user.create({
      data: {
        email: `demo_prov_${testSuffix}@example.com`,
        phone: `9922${testSuffix}`,
        passwordHash: hashedPassword,
        role: UserRole.PROVIDER,
        status: UserStatus.ACTIVE,
        providerProfile: {
          create: {
            businessName: `Demo Adventures ${testSuffix}`,
            ownerName: 'Demo Provider Host',
            businessCategory: 'Tour Organizer',
            city: 'Manali',
            state: 'Himachal Pradesh',
            pincode: '175131',
            verificationStatus: VerificationStatus.VERIFIED,
            isActive: true,
          },
        },
      },
    });
    providerUserId = provider.id;

    // Admin fixture
    const admin = await prisma.user.create({
      data: {
        email: `demo_admin_${testSuffix}@example.com`,
        phone: `9933${testSuffix}`,
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminUserId = admin.id;

    console.log('✓ Ephemeral test users created successfully in PostgreSQL.');

    // -------------------------------------------------------------
    // SCENARIO 1: Logged-out visitor opens '/' — Homepage Demo Loads
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Logged-out Visitor Opens Homepage ---');
    const homeRes = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
    assert(homeRes.status === 200, 'Scenario 1.1: Logged-out visitor gets HTTP 200 on /');
    const homeHtml = await homeRes.text();
    assert(homeHtml.includes('Public Marketplace Demo') || homeHtml.includes('VIBE'), 'Scenario 1.2: Homepage renders demo marketplace content');
    assert(!homeHtml.includes('Account Number') && !homeHtml.includes('SettlementLedger'), 'Scenario 1.3: No private customer or financial records exposed');

    // -------------------------------------------------------------
    // SCENARIO 2: Logged-out visitor opens protected pages — Redirected to Login
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Logged-out Visitor Accessing Protected Pages ---');
    
    // Test /packages
    const pkgRes = await fetch(`${BASE_URL}/packages`, { redirect: 'manual' });
    assert([307, 308, 302].includes(pkgRes.status), `Scenario 2.1: /packages redirects with HTTP ${pkgRes.status}`);
    const pkgRedirectLocation = pkgRes.headers.get('location') || '';
    assert(pkgRedirectLocation.includes('/login?next=%2Fpackages'), `Scenario 2.2: /packages preserves destination in next param: ${pkgRedirectLocation}`);

    // Test /booking/test-package-123
    const bookRes = await fetch(`${BASE_URL}/booking/test-pkg-id`, { redirect: 'manual' });
    assert([307, 308, 302].includes(bookRes.status), `Scenario 2.3: /booking/test-pkg-id redirects with HTTP ${bookRes.status}`);
    const bookRedirectLocation = bookRes.headers.get('location') || '';
    assert(bookRedirectLocation.includes('/login?next=%2Fbooking%2Ftest-pkg-id'), `Scenario 2.4: /booking preserves target in next param: ${bookRedirectLocation}`);

    // Test /devotional-trips
    const devoRes = await fetch(`${BASE_URL}/devotional-trips`, { redirect: 'manual' });
    assert([307, 308, 302].includes(devoRes.status), `Scenario 2.5: /devotional-trips redirects to login`);

    // Test /account/dashboard
    const accRes = await fetch(`${BASE_URL}/account/dashboard`, { redirect: 'manual' });
    assert([307, 308, 302].includes(accRes.status), `Scenario 2.6: /account/dashboard redirects to login`);

    // -------------------------------------------------------------
    // SCENARIO 3: Logged-out visitor calls protected API — Denied (HTTP 401)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Logged-out Visitor Calling Protected APIs Directly ---');
    
    const apiPackagesRes = await fetch(`${BASE_URL}/api/packages`);
    assert(apiPackagesRes.status === 401, `Scenario 3.1: GET /api/packages returns HTTP 401 (got ${apiPackagesRes.status})`);

    const apiBookingsRes = await fetch(`${BASE_URL}/api/bookings`);
    assert(apiBookingsRes.status === 401, `Scenario 3.2: GET /api/bookings returns HTTP 401 (got ${apiBookingsRes.status})`);

    const apiAdminCustRes = await fetch(`${BASE_URL}/api/admin/customers`);
    assert(apiAdminCustRes.status === 401, `Scenario 3.3: GET /api/admin/customers returns HTTP 401 (got ${apiAdminCustRes.status})`);

    // Public API check: /api/locations/search should be accessible
    const apiLocRes = await fetch(`${BASE_URL}/api/locations/search?q=Varanasi`);
    assert(apiLocRes.status === 200, `Scenario 3.4: Public location search /api/locations/search remains accessible (HTTP 200)`);

    // -------------------------------------------------------------
    // SCENARIO 4: Customer Logs In — Customer Features Work
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Customer Authentication and Feature Access ---');
    const custLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: `demo_cust_${testSuffix}@example.com`,
        password: testPassword,
        role: 'customer',
      }),
    });
    assert(custLoginRes.status === 200, `Scenario 4.1: Customer login succeeds with HTTP 200`);
    const custSetCookie = custLoginRes.headers.get('set-cookie') || '';
    customerCookie = custSetCookie.split(';')[0];
    assert(customerCookie.startsWith('vibe_session='), 'Scenario 4.2: Session cookie set for customer');

    // Customer accessing /api/auth/me
    const custMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: customerCookie },
    });
    const custMeData = await custMeRes.json();
    assert(custMeData.user?.role === 'customer', 'Scenario 4.3: /api/auth/me accurately identifies customer role');
    assert(custMeData.user?.id === customerUserId, 'Scenario 4.4: Session strictly maps to customer primary key');

    // Customer accessing /packages now allowed
    const custPkgRes = await fetch(`${BASE_URL}/packages`, {
      headers: { Cookie: customerCookie },
      redirect: 'manual',
    });
    assert(custPkgRes.status === 200, `Scenario 4.5: Authenticated customer accesses /packages (HTTP ${custPkgRes.status})`);

    // Customer accessing /account/dashboard now allowed
    const custAccRes = await fetch(`${BASE_URL}/account/dashboard`, {
      headers: { Cookie: customerCookie },
      redirect: 'manual',
    });
    assert(custAccRes.status === 200, `Scenario 4.6: Authenticated customer accesses /account/dashboard (HTTP ${custAccRes.status})`);

    // -------------------------------------------------------------
    // SCENARIO 5: Customer tries to access Admin route — Denied (HTTP 403)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Customer Attempting Admin Route Access ---');
    const custAdminPageRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: customerCookie },
      redirect: 'manual',
    });
    assert([307, 308, 302, 403].includes(custAdminPageRes.status), `Scenario 5.1: Customer blocked from /admin/dashboard (HTTP ${custAdminPageRes.status})`);
    if ([307, 308, 302].includes(custAdminPageRes.status)) {
      const loc = custAdminPageRes.headers.get('location') || '';
      assert(loc.includes('/unauthorized') || loc.includes('/admin/login'), `Scenario 5.2: Redirected to /unauthorized (got ${loc})`);
    }

    const custAdminApiRes = await fetch(`${BASE_URL}/api/admin/customers`, {
      headers: { Cookie: customerCookie },
    });
    assert(custAdminApiRes.status === 403, `Scenario 5.3: Customer blocked from /api/admin/customers (HTTP 403)`);

    // -------------------------------------------------------------
    // SCENARIO 6: Provider logs in & Provider isolation verified
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: Provider Authentication & Data Isolation ---');
    const provLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: `demo_prov_${testSuffix}@example.com`,
        password: testPassword,
        role: 'provider',
      }),
    });
    assert(provLoginRes.status === 200, 'Scenario 6.1: Provider logs in successfully');
    providerCookie = (provLoginRes.headers.get('set-cookie') || '').split(';')[0];

    // Provider accessing /provider/dashboard
    const provDashRes = await fetch(`${BASE_URL}/provider/dashboard`, {
      headers: { Cookie: providerCookie },
      redirect: 'manual',
    });
    assert(provDashRes.status === 200, `Scenario 6.2: Provider accesses /provider/dashboard (HTTP ${provDashRes.status})`);

    // Customer trying to access /provider/dashboard -> blocked
    const custProvDashRes = await fetch(`${BASE_URL}/provider/dashboard`, {
      headers: { Cookie: customerCookie },
      redirect: 'manual',
    });
    assert([307, 308, 302, 403].includes(custProvDashRes.status), `Scenario 6.3: Customer blocked from /provider/dashboard (HTTP ${custProvDashRes.status})`);

    // -------------------------------------------------------------
    // SCENARIO 7: Admin logs in — Admin features work
    // -------------------------------------------------------------
    console.log('\n--- Scenario 7: Admin Authentication & Features ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: `demo_admin_${testSuffix}@example.com`,
        password: testPassword,
        role: 'admin',
      }),
    });
    assert(adminLoginRes.status === 200, 'Scenario 7.1: Admin logs in successfully');
    adminCookie = (adminLoginRes.headers.get('set-cookie') || '').split(';')[0];

    const adminDashRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Cookie: adminCookie },
      redirect: 'manual',
    });
    assert(adminDashRes.status === 200, `Scenario 7.2: Admin accesses /admin/dashboard (HTTP 200)`);

    const adminApiRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    assert(adminApiRes.status === 200, `Scenario 7.3: Admin calls /api/admin/stats (HTTP 200)`);

    // -------------------------------------------------------------
    // SCENARIO 8: Login with invalid password — Access denied (HTTP 401)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 8: Login with Invalid Password ---');
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: `demo_cust_${testSuffix}@example.com`,
        password: 'CompletelyWrongPassword!',
        role: 'customer',
      }),
    });
    assert(badLoginRes.status === 401, `Scenario 8.1: Bad password rejected with HTTP 401 (got ${badLoginRes.status})`);
    const badCookie = badLoginRes.headers.get('set-cookie');
    assert(!badCookie || !badCookie.includes('vibe_session='), 'Scenario 8.2: No session cookie issued on invalid password');

    // -------------------------------------------------------------
    // SCENARIO 9: Expired or invalid session — Protected access denied
    // -------------------------------------------------------------
    console.log('\n--- Scenario 9: Expired or Invalid Session ---');
    const invalidCookie = 'vibe_session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsig';
    const fakeSessionRes = await fetch(`${BASE_URL}/api/packages`, {
      headers: { Cookie: invalidCookie },
    });
    assert(fakeSessionRes.status === 401, `Scenario 9.1: Tampered/invalid JWT rejected with HTTP 401 (got ${fakeSessionRes.status})`);

    const fakePageRes = await fetch(`${BASE_URL}/packages`, {
      headers: { Cookie: invalidCookie },
      redirect: 'manual',
    });
    assert([307, 308, 302].includes(fakePageRes.status), `Scenario 9.2: Tampered/invalid session redirected to login (HTTP ${fakePageRes.status})`);

    // -------------------------------------------------------------
    // SCENARIO 10: Open-Redirect Protection on next parameter
    // -------------------------------------------------------------
    console.log('\n--- Scenario 10: Open Redirect Parameter Sanitization ---');
    assert(isValidInternalPath('/packages') === true, 'Scenario 10.1: /packages recognized as valid internal path');
    assert(isValidInternalPath('/booking/123?date=2026-11-01') === true, 'Scenario 10.2: /booking with query params recognized as valid');
    assert(isValidInternalPath('https://evil.com') === false, 'Scenario 10.3: External https scheme rejected');
    assert(isValidInternalPath('//attacker.org') === false, 'Scenario 10.4: Protocol-relative // URL rejected');
    assert(isValidInternalPath('/\\evil.com') === false, 'Scenario 10.5: Backslash bypass rejected');
    assert(isValidInternalPath('javascript:alert(1)') === false, 'Scenario 10.6: Javascript scheme rejected');

    const sanitized1 = sanitizeRedirectPath('https://evil.com', '/account/dashboard');
    assert(sanitized1 === '/account/dashboard', 'Scenario 10.7: Malicious URL sanitized to fallback /account/dashboard');

    const sanitized2 = sanitizeRedirectPath('/devotional-trips', '/account/dashboard');
    assert(sanitized2 === '/devotional-trips', 'Scenario 10.8: Legitimate internal path preserved');

    // -------------------------------------------------------------
    // SCENARIO 11: Logout Revocation
    // -------------------------------------------------------------
    console.log('\n--- Scenario 11: Logout Session Revocation ---');
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: customerCookie },
    });
    assert(logoutRes.status === 200, 'Scenario 11.1: Logout API returns HTTP 200');

    // Check that old customerCookie is now rejected by /api/auth/me
    const postLogoutMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: customerCookie },
    });
    assert(postLogoutMe.status === 401, `Scenario 11.2: Revoked session rejected by /api/auth/me (HTTP 401)`);

    // Check that old customerCookie is now redirected on protected pages
    const postLogoutPage = await fetch(`${BASE_URL}/packages`, {
      headers: { Cookie: customerCookie },
      redirect: 'manual',
    });
    assert([307, 308, 302].includes(postLogoutPage.status), `Scenario 11.3: Revoked session redirected to login on protected page (HTTP ${postLogoutPage.status})`);

    // -------------------------------------------------------------
    // SCENARIO 12: Public Homepage & Demo Verification
    // -------------------------------------------------------------
    console.log('\n--- Scenario 12: Public Homepage & Demo Content Integrity ---');
    const finalHomeRes = await fetch(`${BASE_URL}/`);
    assert(finalHomeRes.status === 200, 'Scenario 12.1: Homepage is publicly accessible');
    const htmlText = await finalHomeRes.text();
    assert(htmlText.includes('Public Marketplace Demo'), 'Scenario 12.2: Demo badge visible in homepage HTML');
    assert(htmlText.includes('Handpicked Tour Packages'), 'Scenario 12.3: Featured package section renders in demo');
    assert(htmlText.includes('Sacred Places'), 'Scenario 12.4: Devotional places section renders in demo');

  } catch (error) {
    console.error('Fatal test error:', error);
    failed++;
  } finally {
    console.log('\n--- Cleanup: Purging Ephemeral Test Users ---');
    const cleanupIds = [customerUserId, providerUserId, adminUserId].filter(Boolean);
    if (cleanupIds.length > 0) {
      await prisma.session.deleteMany({ where: { userId: { in: cleanupIds } } }).catch(() => null);
      await prisma.customerProfile.deleteMany({ where: { userId: { in: cleanupIds } } }).catch(() => null);
      await prisma.providerProfile.deleteMany({ where: { userId: { in: cleanupIds } } }).catch(() => null);
      await prisma.user.deleteMany({ where: { id: { in: cleanupIds } } }).catch(() => null);
      console.log('✓ Ephemeral test records cleanly removed. Existing database state preserved.');
    }
    await prisma.$disconnect();
  }

  console.log('\n============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
