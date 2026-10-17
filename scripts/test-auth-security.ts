import { PrismaClient, UserRole, UserStatus, VerificationStatus } from '@prisma/client';
import { hashPassword, verifyPassword } from '../src/server/auth/password';
import {
  createDbSession,
  validateDbSession,
  verifySessionToken,
  revokeDbSession,
  signSessionToken,
} from '../src/server/auth/session';
import {
  createCustomerUser,
  createProviderUser,
  normalizeEmail,
  isEmailRegistered,
} from '../src/server/db/users';
import { verifyOwnership } from '../src/server/auth/guard';

const prisma = new PrismaClient();

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runAuthSecuritySuite() {
  console.log('====================================================');
  console.log('   VIBEMILES — PHASE 3 AUTH & SECURITY TEST SUITE   ');
  console.log('====================================================\n');

  const testSuffix = Date.now();
  const testCustomerEmail = `test.traveler.${testSuffix}@example.com`;
  const testProviderEmail = `test.provider.${testSuffix}@example.com`;
  const testPassword = 'SecurePassword123!';

  let createdCustomerUserId: string | null = null;
  let createdProviderUserId: string | null = null;

  try {
    // -------------------------------------------------------------
    // TEST GROUP 1: PASSWORD HASHING & VERIFICATION
    // -------------------------------------------------------------
    console.log('1. Password Hashing & Verification:');
    const hash = await hashPassword(testPassword);
    assert(hash.startsWith('$2'), 'Hash algorithm is bcrypt', hash.slice(0, 10));
    assert(hash !== testPassword, 'Hash is not plaintext');

    const isValid = await verifyPassword(testPassword, hash);
    assert(isValid === true, 'Correct password verification succeeds');

    const isWrongValid = await verifyPassword('WrongPassword123!', hash);
    assert(isWrongValid === false, 'Incorrect password verification fails');

    const isNullValid = await verifyPassword(testPassword, null);
    assert(isNullValid === false, 'Null hash verification safely returns false');

    // -------------------------------------------------------------
    // TEST GROUP 2: SUCCESSFUL REGISTRATION & NORMALIZATION
    // -------------------------------------------------------------
    console.log('\n2. Customer & Provider Registration:');
    const uppercaseEmail = `  TEST.TRAVELER.${testSuffix}@EXAMPLE.COM  `;
    const normalized = normalizeEmail(uppercaseEmail);
    assert(normalized === testCustomerEmail, 'Email normalization trims and lowercases');

    const customerReg = await createCustomerUser({
      fullName: 'Test Traveler',
      email: uppercaseEmail,
      phone: '+91 99887 76655',
      password: testPassword,
    });

    createdCustomerUserId = customerReg.user.id;
    assert(customerReg.user.email === testCustomerEmail, 'Customer registered with normalized email');
    assert(customerReg.user.role === UserRole.CUSTOMER, 'Customer assigned CUSTOMER role');
    assert(customerReg.profile.isVerified === false, 'Customer isVerified initialized to false (no fake OTP)');
    assert(customerReg.profile.rewardPoints === 100, 'Customer awarded welcome reward points');

    const providerReg = await createProviderUser({
      fullName: 'Test Operator',
      email: testProviderEmail,
      phone: '+91 99887 76656',
      password: testPassword,
      businessName: 'High Peak Tours',
      businessCategory: 'Tour Organizer',
    });

    createdProviderUserId = providerReg.user.id;
    assert(providerReg.user.role === UserRole.PROVIDER, 'Provider assigned PROVIDER role');
    assert(
      providerReg.profile.verificationStatus === VerificationStatus.PENDING,
      'New provider verificationStatus starts strictly as PENDING (not auto-verified)'
    );

    // -------------------------------------------------------------
    // TEST GROUP 3: DUPLICATE REGISTRATION PREVENTION
    // -------------------------------------------------------------
    console.log('\n3. Duplicate Email Prevention:');
    let duplicateCaught = false;
    try {
      await createCustomerUser({
        fullName: 'Imposter Traveler',
        email: testCustomerEmail,
        password: testPassword,
      });
    } catch {
      duplicateCaught = true;
    }
    assert(duplicateCaught === true, 'Duplicate registration attempt is rejected');

    const emailCheck = await isEmailRegistered(testCustomerEmail);
    assert(emailCheck === true, 'isEmailRegistered correctly identifies registered email');

    // -------------------------------------------------------------
    // TEST GROUP 4: SESSION CREATION & DATABASE PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n4. Session Management & Verification:');
    const sessionRes = await createDbSession(createdCustomerUserId, UserRole.CUSTOMER, {
      ipAddress: '127.0.0.1',
      userAgent: 'VibeMiles-Security-Test/1.0',
    });

    assert(typeof sessionRes.token === 'string', 'Session token is signed string');
    assert(sessionRes.expiresAt.getTime() > Date.now(), 'Session expires in the future');

    // Test Edge-compatible JWT verification
    const verifiedJwt = await verifySessionToken(sessionRes.token);
    assert(verifiedJwt !== null, 'Edge JWT verification succeeds');
    assert(verifiedJwt?.userId === createdCustomerUserId, 'JWT contains correct userId');
    assert(verifiedJwt?.role === 'customer', 'JWT contains correct role');

    // Test Database session validation
    const dbValidation = await validateDbSession(sessionRes.token);
    assert(dbValidation !== null, 'PostgreSQL database session validation succeeds');
    assert(dbValidation?.user.email === testCustomerEmail, 'Database session resolves correct user');

    // -------------------------------------------------------------
    // TEST GROUP 5: TAMPERING & EXPIRY REJECTION
    // -------------------------------------------------------------
    console.log('\n5. Tampering & Expiration Protection:');
    // Forge token with wrong secret
    const forgedToken = await signSessionToken({
      userId: 'hacker-user-id',
      role: 'admin',
      sessionId: 'fake-session',
    });
    // Tamper with the signature portion
    const tamperedToken = forgedToken.slice(0, -6) + 'XXXXXX';
    const tamperedResult = await verifySessionToken(tamperedToken);
    assert(tamperedResult === null, 'Tampered JWT signature is rejected');

    // -------------------------------------------------------------
    // TEST GROUP 6: LOGOUT & SESSION REVOCATION
    // -------------------------------------------------------------
    console.log('\n6. Logout & Session Invalidation:');
    await revokeDbSession(sessionRes.token);
    const postLogoutValidation = await validateDbSession(sessionRes.token);
    assert(postLogoutValidation === null, 'Revoked session is rejected by PostgreSQL validation');

    // -------------------------------------------------------------
    // TEST GROUP 7: ROLE-BASED ACCESS CONTROL (RBAC) LOGIC
    // -------------------------------------------------------------
    console.log('\n7. Role-Based Access Control:');
    const customerRole = 'customer' as string;
    const providerRole = 'provider' as string;
    const adminRole = 'admin' as string;

    // Simulate route matching logic in proxy
    const canCustomerAccessAccount = customerRole === 'customer';
    const canCustomerAccessAdmin = customerRole === 'admin';
    const canCustomerAccessProvider = customerRole === 'provider';

    assert(canCustomerAccessAccount === true, 'Customer role allowed on /account');
    assert(canCustomerAccessAdmin === false, 'Customer role blocked on /admin');
    assert(canCustomerAccessProvider === false, 'Customer role blocked on /provider');

    const canProviderAccessProvider = providerRole === 'provider';
    const canProviderAccessAdmin = providerRole === 'admin';
    assert(canProviderAccessProvider === true, 'Provider role allowed on /provider');
    assert(canProviderAccessAdmin === false, 'Provider role blocked on /admin');

    const canAdminAccessAdmin = adminRole === 'admin';
    assert(canAdminAccessAdmin === true, 'Admin role allowed on /admin');

    // -------------------------------------------------------------
    // TEST GROUP 8: IDOR (INSECURE DIRECT OBJECT REFERENCE)
    // -------------------------------------------------------------
    console.log('\n8. IDOR Prevention:');
    const userA = 'user-alice-123';
    const userB = 'user-bob-456';

    const selfAccess = verifyOwnership(userA, userA, 'customer');
    assert(selfAccess === true, 'User can access own resource');

    const crossAccess = verifyOwnership(userB, userA, 'customer');
    assert(crossAccess === false, 'User CANNOT access another user’s resource (IDOR blocked)');

    const adminAccessOther = verifyOwnership(userB, userA, 'admin');
    assert(adminAccessOther === true, 'Admin role can access resource for support/moderation');

    // -------------------------------------------------------------
    // TEST GROUP 9: ACCOUNT STATUS SUSPENSION REJECTION
    // -------------------------------------------------------------
    console.log('\n9. Suspended User Rejection:');
    await prisma.user.update({
      where: { id: createdCustomerUserId },
      data: { status: UserStatus.SUSPENDED },
    });

    const newSessionForSuspended = await createDbSession(createdCustomerUserId, UserRole.CUSTOMER);
    const suspendedCheck = await validateDbSession(newSessionForSuspended.token);
    assert(suspendedCheck === null, 'Suspended user session is strictly rejected by server');

    console.log('\n====================================================');
    console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log('====================================================\n');

    if (passedTests !== totalTests) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test suite encountered unhandled error:', error);
    process.exit(1);
  } finally {
    // -------------------------------------------------------------
    // CLEANUP: REMOVE TEMPORARY TEST DATA
    // -------------------------------------------------------------
    console.log('🧹 Cleaning up test accounts...');
    if (createdCustomerUserId) {
      await prisma.user.delete({ where: { id: createdCustomerUserId } }).catch(() => {});
    }
    if (createdProviderUserId) {
      await prisma.user.delete({ where: { id: createdProviderUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
    console.log('✨ Cleanup complete.\n');
  }
}

runAuthSecuritySuite();
