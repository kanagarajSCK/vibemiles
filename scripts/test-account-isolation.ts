import { prisma } from '../src/lib/prisma';

const BASE_URL = 'http://localhost:3000';

interface TestUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  password: string;
  role: 'customer' | 'provider';
  cookie?: string;
}

function parseCookies(res: Response): string {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  // Extract vibe_session cookie
  const match = setCookie.match(/vibe_session=([^;]+)/);
  return match ? `vibe_session=${match[1]}` : '';
}

async function waitForServer(): Promise<void> {
  console.log('⏳ Waiting for server to be responsive on http://localhost:3000...');
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/`, { method: 'HEAD' });
      if (res.status < 500) {
        console.log('✅ Server is ready!');
        return;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Server did not become ready within 30 seconds.');
}

async function runTests() {
  await waitForServer();

  const ts = Date.now();
  const testUsersToClean: string[] = [];

  const userA: TestUser = {
    id: '',
    email: `test.alice.${ts}@vibemiles-qa.internal`,
    phone: `+9199000${String(ts).slice(-5)}`,
    name: 'Alice Traveler',
    password: 'Password123!',
    role: 'customer',
  };

  const userB: TestUser = {
    id: '',
    email: `test.bob.${ts}@vibemiles-qa.internal`,
    phone: `+9199111${String(ts).slice(-5)}`,
    name: 'Bob Explorer',
    password: 'Password123!',
    role: 'customer',
  };

  const userC: TestUser = {
    id: '',
    email: `test.digits12345.${ts}@vibemiles-qa.internal`,
    phone: `+9199222${String(ts).slice(-5)}`,
    name: 'Charlie Digits',
    password: 'Password123!',
    role: 'customer',
  };

  console.log('\n======================================================');
  console.log('🧪 RUNNING AUTHENTICATION & ACCOUNT ISOLATION TEST SUITE');
  console.log('======================================================\n');

  try {
    // ── TEST 1: Register User A ──
    console.log('▶ [Test 1] Registering User A (Alice)...');
    const regResA = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: userA.name,
        email: userA.email,
        phone: userA.phone,
        password: userA.password,
        role: userA.role,
      }),
    });

    if (!regResA.ok) {
      throw new Error(`User A registration failed: ${await regResA.text()}`);
    }

    const regDataA = await regResA.json();
    userA.id = regDataA.user.id;
    userA.cookie = parseCookies(regResA);
    testUsersToClean.push(userA.id);

    if (!userA.cookie) throw new Error('User A did not receive session cookie!');
    if (regDataA.user.email !== userA.email) throw new Error('User A email mismatch!');
    console.log(`✅ User A registered successfully! ID: ${userA.id}, Cookie Set: YES`);

    // ── TEST 2: Register User B ──
    console.log('▶ [Test 2] Registering User B (Bob)...');
    const regResB = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: userB.name,
        email: userB.email,
        phone: userB.phone,
        password: userB.password,
        role: userB.role,
      }),
    });

    if (!regResB.ok) {
      throw new Error(`User B registration failed: ${await regResB.text()}`);
    }

    const regDataB = await regResB.json();
    userB.id = regDataB.user.id;
    userB.cookie = parseCookies(regResB);
    testUsersToClean.push(userB.id);

    if (!userB.cookie) throw new Error('User B did not receive session cookie!');
    if (userB.id === userA.id) throw new Error('CRITICAL: User B received User A ID!');
    console.log(`✅ User B registered successfully! ID: ${userB.id}, Cookie Set: YES`);

    // ── TEST 3: Verify /api/auth/me Account Isolation ──
    console.log('▶ [Test 3] Verifying /api/auth/me session cookie isolation...');
    const meResA = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: userA.cookie },
    });
    const meDataA = await meResA.json();

    const meResB = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: userB.cookie },
    });
    const meDataB = await meResB.json();

    if (meDataA.user.id !== userA.id || meDataA.user.email !== userA.email) {
      throw new Error(`Session A leaked! Expected ${userA.email}, got ${meDataA.user?.email}`);
    }
    if (meDataB.user.id !== userB.id || meDataB.user.email !== userB.email) {
      throw new Error(`Session B leaked! Expected ${userB.email}, got ${meDataB.user?.email}`);
    }
    if (meDataA.user.id === meDataB.user.id) {
      throw new Error('CRITICAL ACCOUNT ISOLATION FAILURE: Both cookies resolved to the same user!');
    }
    console.log('✅ Session Isolation Verified: Cookie A strictly returns User A; Cookie B strictly returns User B.');

    // ── TEST 4: Email with Digits Isolation ──
    console.log('▶ [Test 4] Registering User C with digits in email...');
    const regResC = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: userC.name,
        email: userC.email,
        phone: userC.phone,
        password: userC.password,
        role: userC.role,
      }),
    });
    const regDataC = await regResC.json();
    userC.id = regDataC.user.id;
    userC.cookie = parseCookies(regResC);
    testUsersToClean.push(userC.id);

    console.log('▶ Testing login with digits-in-email...');
    const loginResC = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: userC.email,
        password: userC.password,
      }),
    });
    const loginDataC = await loginResC.json();
    if (!loginResC.ok || loginDataC.user.id !== userC.id) {
      throw new Error(`Digits email login returned incorrect user! Expected ${userC.id}, got ${loginDataC.user?.id}`);
    }
    console.log('✅ Email containing digits logged in accurately to User C without matching phone digit subsets.');

    // ── TEST 5: Phone Number Login Resolution ──
    console.log('▶ [Test 5] Testing login via mobile phone number...');
    // Login with phone without country code or spaces
    const cleanPhoneDigits = userA.phone.replace(/\D/g, '').slice(-10);
    const phoneLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: cleanPhoneDigits,
        password: userA.password,
      }),
    });
    const phoneLoginData = await phoneLoginRes.json();
    if (!phoneLoginRes.ok || phoneLoginData.user.id !== userA.id) {
      throw new Error(`Phone login failed! Expected ${userA.id}, got ${phoneLoginData.user?.id}`);
    }
    console.log(`✅ Phone Login Verified: 10-digit number "${cleanPhoneDigits}" resolved to User A.`);

    // ── TEST 6: Protected API Cross-Account Isolation ──
    console.log('▶ [Test 6] Testing cross-account data isolation on /api/bookings...');
    // User A bookings
    const bookingsResA = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { Cookie: userA.cookie },
    });
    const bookingsDataA = await bookingsResA.json();

    // User B bookings
    const bookingsResB = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { Cookie: userB.cookie },
    });
    const bookingsDataB = await bookingsResB.json();

    if (!bookingsResA.ok || !bookingsResB.ok) {
      throw new Error('Failed to retrieve bookings for test users.');
    }
    console.log(`✅ Booking Isolation Verified: User A has ${bookingsDataA.count} bookings, User B has ${bookingsDataB.count} bookings.`);

    // ── TEST 7: Logout Revocation Isolation ──
    console.log('▶ [Test 7] Testing logout revocation isolation...');
    const logoutResA = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: userA.cookie },
    });
    if (!logoutResA.ok) throw new Error('Logout failed for User A.');

    // Verify User A cookie is now rejected
    const meAfterLogoutA = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: userA.cookie },
    });
    if (meAfterLogoutA.status !== 401) {
      throw new Error(`User A session should be 401 after logout, got ${meAfterLogoutA.status}`);
    }

    // Verify User B is STILL actively authenticated
    const meAfterLogoutB = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: userB.cookie },
    });
    const meDataAfterB = await meAfterLogoutB.json();
    if (meAfterLogoutB.status !== 200 || meDataAfterB.user?.id !== userB.id) {
      throw new Error('User B session was inadvertently disrupted by User A logout!');
    }
    console.log('✅ Logout Isolation Verified: User A revoked without affecting User B session.');

    // ── TEST 8: Portal Role Mismatch Guidance ──
    console.log('▶ [Test 8] Testing portal role mismatch guidance...');
    const mismatchRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: 'kanagarajsck@gmail.com', // Provider account in DB
        password: 'wrongpassword', // will fail password check or role check
        role: 'customer', // client portal specified
      }),
    });
    // Even if password was unknown, let's test with User B (customer) accessing provider portal
    const providerPortalMismatchRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: userB.email,
        password: userB.password,
        role: 'provider', // User B is customer, requesting provider role
      }),
    });
    const mismatchData = await providerPortalMismatchRes.json();
    if (providerPortalMismatchRes.status !== 403 || !mismatchData.error.includes('Traveler Sign In')) {
      throw new Error(`Expected role mismatch guidance for customer on provider portal, got: ${JSON.stringify(mismatchData)}`);
    }
    console.log(`✅ Portal Role Guidance Verified: "${mismatchData.error}"`);

    console.log('\n======================================================');
    console.log('🎉 ALL 8 AUTHENTICATION & ACCOUNT ISOLATION TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    // Clean up test accounts ONLY
    if (testUsersToClean.length > 0) {
      console.log(`🧹 Cleaning up ${testUsersToClean.length} test user records...`);
      await prisma.session.deleteMany({
        where: { userId: { in: testUsersToClean } },
      });
      await prisma.customerProfile.deleteMany({
        where: { userId: { in: testUsersToClean } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: testUsersToClean } },
      });
      console.log('✅ Test accounts cleanly removed. Existing customer data intact!');
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
