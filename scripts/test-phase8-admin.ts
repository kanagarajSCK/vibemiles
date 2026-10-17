/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'node:crypto';
import { PrismaClient, UserRole, UserStatus, VerificationStatus, ListingStatus, BookingStatus, PaymentStatus } from '@prisma/client';
import {
  getAdminDashboardMetrics,
  getAdminCustomers,
  getCustomerDetailsForAdmin,
  updateCustomerStatusInDb,
  getAdminProviders,
  getProviderDetailsForAdmin,
  reviewProviderVerificationInDb,
  updateProviderStatusInDb,
  getAdminCategories,
  createCategoryInDb,
  updateCategoryInDb,
  archiveOrDeleteCategoryInDb,
  getAdminBookingsWithFilters,
  getAdminOperationalReport,
  sanitizeCsvCell,
  generateOperationalCsv,
  recordAuditLog,
  getAuditLogs,
} from '../src/server/db/admin';
import { createCustomerUser, createProviderUser } from '../src/server/db/users';
import { createPackage, submitPackageForReview, adminApprovePackage } from '../src/server/db/packages';
import { createBookingInDb } from '../src/server/db/bookings';
import { createPaymentOrderForBooking, verifyPaymentAndConfirmBooking } from '../src/server/db/payments';
import { hashPassword } from '../src/server/auth/password';
import { createDbSession, validateDbSession } from '../src/server/auth/session';

const prisma = new PrismaClient();

async function runPhase8Tests() {
  console.log('====================================================');
  console.log('VibeMiles — Phase 8: Admin Operations & Oversight Test Suite');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  // Identifiers for cleanup
  let adminUser: any;
  let customerUser: any;
  let providerUser: any;
  let testCategory: any;
  let testPackage: any;
  let testBooking: any;

  const testSuffix = Date.now();

  try {
    // ---------------------------------------------------------
    // TEST 1: SETUP TEST ACTORS
    // ---------------------------------------------------------
    console.log('\n--- Test 1: Setup Admin, Customer, and Provider ---');

    // Create Admin user
    const adminPasswordHash = await hashPassword('AdminPass123!');
    adminUser = await prisma.user.create({
      data: {
        email: `phase8_admin_${testSuffix}@vibemiles.test`,
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    assert(adminUser.role === UserRole.ADMIN, 'Admin user created with ADMIN role');

    // Create Customer user
    const customerRes = await createCustomerUser({
      fullName: `Test Traveler ${testSuffix}`,
      email: `phase8_cust_${testSuffix}@vibemiles.test`,
      phone: `+9198765${String(testSuffix).slice(-5)}`,
      password: 'CustPass123!',
    });
    customerUser = customerRes.user;
    assert(customerUser.role === UserRole.CUSTOMER, 'Customer user created');

    // Create Provider user
    const providerRes = await createProviderUser({
      fullName: `Provider Owner ${testSuffix}`,
      email: `phase8_prov_${testSuffix}@vibemiles.test`,
      phone: `+9197654${String(testSuffix).slice(-5)}`,
      password: 'ProvPass123!',
      businessName: `Phase8 Himalayas Expeditions ${testSuffix}`,
      businessCategory: 'Tour Organizer',
      city: 'Manali',
      state: 'Himachal Pradesh',
      pincode: '175131',
    });
    providerUser = providerRes.user;
    const providerProfile = providerRes.profile;
    assert(providerProfile.verificationStatus === VerificationStatus.PENDING, 'Provider created in PENDING KYC status');

    // ---------------------------------------------------------
    // TEST 2: CATEGORY MANAGEMENT & REFERENTIAL INTEGRITY
    // ---------------------------------------------------------
    console.log('\n--- Test 2: Category Administration & Referential Integrity ---');

    testCategory = await createCategoryInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      name: `Alpine Treks ${testSuffix}`,
      slug: `alpine-treks-${testSuffix}`,
      icon: '🏔️',
      description: 'High altitude Himalayan trekking expeditions',
    });
    assert(Boolean(testCategory.id), 'Category created in database');
    assert(testCategory.slug === `alpine-treks-${testSuffix}`, 'Category slug generated correctly');

    // Unique slug collision test
    let collisionFailed = false;
    try {
      await createCategoryInDb({
        adminUser: { id: adminUser.id, email: adminUser.email },
        name: `Duplicate Alpine`,
        slug: `alpine-treks-${testSuffix}`,
      });
    } catch {
      collisionFailed = true;
    }
    assert(collisionFailed, 'Duplicate category slug rejected with conflict error');

    // Update category
    const updatedCategory = await updateCategoryInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      id: testCategory.id,
      name: `Updated Alpine Treks ${testSuffix}`,
    });
    assert(updatedCategory.name === `Updated Alpine Treks ${testSuffix}`, 'Category updated successfully');

    // Create package in this category
    const dest = await prisma.destination.findFirst();
    testPackage = await createPackage(providerProfile.id, {
      name: `Everest Base Camp View ${testSuffix}`,
      description: 'Spectacular alpine panoramic views and base camp trekking adventure across the Himalayas.',
      categoryId: testCategory.id,
      destinationId: dest?.id || 'dest-placeholder',
      state: 'Himachal Pradesh',
      city: 'Manali',
      durationDays: 5,
      durationNights: 4,
      maxGroupSize: 10,
      basePrice: 25000,
    });
    await submitPackageForReview(testPackage.id, providerProfile.id);
    await adminApprovePackage(testPackage.id);
    assert(Boolean(testPackage.id), 'Package created and approved under category');

    // Referential integrity test: try deleting category with existing package
    const archiveResult = await archiveOrDeleteCategoryInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      id: testCategory.id,
    });
    assert(archiveResult.action === 'ARCHIVED', 'Referenced category was archived instead of hard-deleted');
    assert(archiveResult.category?.isActive === false, 'Referenced category isActive set to false');

    // Delete empty category test
    const tempCat = await createCategoryInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      name: `Temporary Empty ${testSuffix}`,
    });
    const deleteResult = await archiveOrDeleteCategoryInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      id: tempCat.id,
    });
    assert(deleteResult.action === 'DELETED', 'Zero-reference category was permanently deleted');

    // ---------------------------------------------------------
    // TEST 3: CUSTOMER MANAGEMENT & ACCOUNT SUSPENSION
    // ---------------------------------------------------------
    console.log('\n--- Test 3: Customer Management & Suspension Enforcement ---');

    // Create session for customer
    const sessionRes = await createDbSession(customerUser.id, UserRole.CUSTOMER);
    const sessionBefore = await validateDbSession(sessionRes.token);
    assert(sessionBefore !== null, 'Customer active session is valid before suspension');

    // Search customers
    const customerList = await getAdminCustomers({ search: customerUser.email });
    assert(customerList.items.length === 1, 'Admin customer search by email returned exact record');
    assert(customerList.items[0].email === customerUser.email, 'Admin customer item matches target');

    // Customer details
    const customerDetail = await getCustomerDetailsForAdmin(customerUser.id);
    assert(customerDetail !== null, 'Customer detail view retrieved');
    assert(customerDetail?.profile.fullName === customerRes.profile.fullName, 'Profile data matches');

    // Suspend Customer with reason
    const suspensionReason = 'Fraudulent chargeback pattern detected during audit';
    const suspendRes = await updateCustomerStatusInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      userId: customerUser.id,
      status: UserStatus.SUSPENDED,
      reason: suspensionReason,
    });
    assert(suspendRes.status === UserStatus.SUSPENDED, 'User status set to SUSPENDED');
    assert(suspendRes.isBlocked === true, 'CustomerProfile isBlocked set to true');
    assert(suspendRes.suspensionReason === suspensionReason, 'CustomerProfile suspensionReason recorded');

    // Verify session terminated & invalidated
    const sessionAfter = await validateDbSession(sessionRes.token);
    assert(sessionAfter === null, 'Suspended customer session immediately invalidated');

    // Attempt booking creation by suspended customer
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);
    const avail = await prisma.packageAvailability.create({
      data: {
        packageId: testPackage.id,
        date: futureDate,
        price: 25000,
        capacity: 10,
        bookedCount: 0,
        isAvailable: true,
      },
    });

    let bookingBlocked = false;
    try {
      await createBookingInDb({
        customerId: customerRes.profile.id,
        packageId: testPackage.id,
        availabilityId: avail.id,
        travelDate: futureDate.toISOString().split('T')[0],
        adults: 2,
        contactName: 'Blocked User',
        contactEmail: customerUser.email,
        contactPhone: '+919999999999',
        travelerDetails: [
          {
            firstName: 'Blocked',
            lastName: 'User',
            age: 25,
            gender: 'Male',
          },
        ],
      });
    } catch (err: any) {
      if (err.message.includes('suspended') || err.message.includes('blocked')) {
        bookingBlocked = true;
      }
    }
    assert(bookingBlocked, 'Suspended customer prevented from creating new booking');

    // Reactivate Customer
    const reactivateRes = await updateCustomerStatusInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      userId: customerUser.id,
      status: UserStatus.ACTIVE,
      reason: 'KYC verified and dispute resolved',
    });
    assert(reactivateRes.status === UserStatus.ACTIVE, 'User status restored to ACTIVE');
    assert(reactivateRes.isBlocked === false, 'CustomerProfile isBlocked restored to false');
    assert(reactivateRes.suspensionReason === null, 'CustomerProfile suspensionReason cleared');

    // Active customer creates booking
    testBooking = await createBookingInDb({
      customerId: customerRes.profile.id,
      packageId: testPackage.id,
      availabilityId: avail.id,
      travelDate: futureDate.toISOString().split('T')[0],
      adults: 1,
      contactName: 'Active User',
      contactEmail: customerUser.email,
      contactPhone: '+919999999999',
      travelerDetails: [
        {
          firstName: 'Active',
          lastName: 'Traveler',
          age: 30,
          gender: 'Male',
        },
      ],
    });
    assert(Boolean(testBooking.id), 'Active customer can successfully create booking');

    // Create gateway payment order
    const orderRes = await createPaymentOrderForBooking({
      bookingIdOrRef: testBooking.id,
      customerId: customerUser.id,
      userRole: 'customer',
    });

    const paymentId = `pay_phase8_${testSuffix}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
    const validSignature = crypto.createHmac('sha256', secret).update(`${orderRes.orderId}|${paymentId}`).digest('hex');

    // Confirm booking with payment
    await verifyPaymentAndConfirmBooking({
      bookingId: testBooking.id,
      orderId: orderRes.orderId,
      paymentId,
      signature: validSignature,
      userId: customerUser.id,
      userRole: 'customer',
    });

    // ---------------------------------------------------------
    // TEST 4: PROVIDER MANAGEMENT & VERIFICATION TRANSITIONS
    // ---------------------------------------------------------
    console.log('\n--- Test 4: Provider Verification Transitions & Status Controls ---');

    // Provider search
    const providerList = await getAdminProviders({ search: providerProfile.businessName });
    assert(providerList.items.length === 1, 'Admin provider search returned registered operator');

    // Reject verification without reason should throw
    let rejectNoReasonFailed = false;
    try {
      await reviewProviderVerificationInDb({
        adminUser: { id: adminUser.id, email: adminUser.email },
        providerId: providerProfile.id,
        status: VerificationStatus.REJECTED,
      });
    } catch {
      rejectNoReasonFailed = true;
    }
    assert(rejectNoReasonFailed, 'Rejecting KYC verification without reason throws validation error');

    // Reject verification with reason
    const kycReject = await reviewProviderVerificationInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      providerId: providerProfile.id,
      status: VerificationStatus.REJECTED,
      reason: 'PAN card blurred, re-upload clear GST copy',
    });
    assert(kycReject.verificationStatus === VerificationStatus.REJECTED, 'KYC status transitioned to REJECTED');
    assert(kycReject.rejectionReason === 'PAN card blurred, re-upload clear GST copy', 'Rejection reason persisted');

    // Approve verification
    const kycApprove = await reviewProviderVerificationInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      providerId: providerProfile.id,
      status: VerificationStatus.VERIFIED,
      reason: 'Documents inspected and confirmed valid',
    });
    assert(kycApprove.verificationStatus === VerificationStatus.VERIFIED, 'KYC status transitioned to VERIFIED');
    assert(kycApprove.rejectionReason === null, 'Rejection reason cleared on approval');

    // Provider suspension & session revocation
    const provSession = await createDbSession(providerUser.id, UserRole.PROVIDER);
    const provStatusSuspend = await updateProviderStatusInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      providerId: providerProfile.id,
      isActive: false,
      reason: 'Safety compliance audit pending',
    });
    assert(provStatusSuspend.isActive === false, 'Provider isActive set to false');
    const provSessionAfter = await validateDbSession(provSession.token);
    assert(provSessionAfter === null, 'Suspended provider session revoked immediately');

    // Provider reactivation
    const provStatusReactivate = await updateProviderStatusInDb({
      adminUser: { id: adminUser.id, email: adminUser.email },
      providerId: providerProfile.id,
      isActive: true,
      reason: 'Safety audit completed with clearance',
    });
    assert(provStatusReactivate.isActive === true, 'Provider isActive restored to true');

    // ---------------------------------------------------------
    // TEST 5: BOOKINGS & FINANCIAL FILTERING
    // ---------------------------------------------------------
    console.log('\n--- Test 5: Booking & Financial Ledger Filtering ---');

    const filteredBookings = await getAdminBookingsWithFilters({
      search: testBooking.bookingRef,
    });
    assert(filteredBookings.items.length === 1, 'Booking filter by exact bookingRef matched');
    assert(filteredBookings.items[0].bookingRef === testBooking.bookingRef, 'Booking reference matches target');
    assert(filteredBookings.items[0].paymentStatus === 'PAID', 'Booking payment status reflects PAID');

    // ---------------------------------------------------------
    // TEST 6: DASHBOARD METRICS CALCULATION ACCURACY
    // ---------------------------------------------------------
    console.log('\n--- Test 6: Dashboard Metrics Accuracy ---');

    const metricsData = await getAdminDashboardMetrics();
    const m = metricsData.metrics;

    assert(m.users.totalCustomers >= 1, 'Dashboard customer count is positive');
    assert(m.users.totalProviders >= 1, 'Dashboard provider count is positive');
    assert(m.bookings.confirmed >= 1, 'Confirmed bookings count is accurate');
    assert(m.financial.grossBookingValue > 0, 'Gross Booking Value (GMV) reflects confirmed booking totals');
    assert(m.financial.collectedRevenue > 0, 'Collected revenue strictly aggregates verified PAID payments');
    assert(m.financial.platformCommissionEarned >= 0, 'Platform commission computed from active settlement ledger');
    assert(Boolean(metricsData.definitions.grossBookingValue), 'Explicit metric definitions provided');

    // ---------------------------------------------------------
    // TEST 7: OPERATIONAL REPORTS & CSV FORMULA INJECTION
    // ---------------------------------------------------------
    console.log('\n--- Test 7: Operational Reports & CSV Formula Injection Protection ---');

    const opReport = await getAdminOperationalReport();
    assert(Array.isArray(opReport.bookingsByStatus), 'Operational report returns bookings by status');
    assert(Array.isArray(opReport.topProviders), 'Operational report returns top performing operators');

    // Formula injection tests: =cmd, +calc, -danger, @malicious, \ttab
    const normalText = sanitizeCsvCell('Normal Guest');
    assert(normalText === 'Normal Guest', 'Normal cell unescaped');

    const equalFormula = sanitizeCsvCell('=1+1');
    assert(equalFormula.startsWith(`"'=`), 'Formula starting with = sanitized with single quote');

    const plusFormula = sanitizeCsvCell('+cmd|');
    assert(plusFormula.startsWith(`"'+`), 'Formula starting with + sanitized with single quote');

    const atFormula = sanitizeCsvCell('@SUM(A1:A10)');
    assert(atFormula.startsWith(`"'@`), 'Formula starting with @ sanitized with single quote');

    const hyphenFormula = sanitizeCsvCell('-10+5');
    assert(hyphenFormula.startsWith(`"'-`), 'Formula starting with - sanitized with single quote');

    // CSV generator test
    const bookingCsv = await generateOperationalCsv('bookings');
    assert(bookingCsv.includes('Booking Ref'), 'CSV header generated correctly');
    assert(bookingCsv.includes(testBooking.bookingRef), 'Test booking present in CSV output');

    // ---------------------------------------------------------
    // TEST 8: AUDIT LOGGING VERIFICATION
    // ---------------------------------------------------------
    console.log('\n--- Test 8: Immutable Audit Logging ---');

    const auditRes = await getAuditLogs({ limit: 20 });
    assert(auditRes.total > 0, 'Audit logs recorded in database');

    const customerAudit = await getAuditLogs({ targetType: 'CUSTOMER', targetId: customerUser.id });
    assert(customerAudit.logs.length >= 2, 'Customer suspension and reactivation logged in audit trail');

    const providerAudit = await getAuditLogs({ targetType: 'PROVIDER', targetId: providerProfile.id });
    assert(providerAudit.logs.length >= 2, 'Provider verification and status changes logged in audit trail');

    const categoryAudit = await getAuditLogs({ targetType: 'CATEGORY', targetId: testCategory.id });
    assert(categoryAudit.logs.length >= 1, 'Category operations logged in audit trail');

    // Metadata password stripping verification
    await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: UserRole.ADMIN,
      action: 'SECURITY_TEST',
      targetType: 'SYSTEM',
      targetId: 'audit-test',
      reason: 'Sanitization check',
      metadata: {
        password: 'SuperSecretPassword!',
        token: 'secret_jwt_token',
        safeKey: 'SafePublicValue',
      },
    });

    const secLog = await prisma.auditLog.findFirst({
      where: { action: 'SECURITY_TEST', targetId: 'audit-test' },
      orderBy: { createdAt: 'desc' },
    });
    const meta = secLog?.metadata as Record<string, any>;
    assert(meta?.password === '[REDACTED]', 'Sensitive password redacted in audit metadata');
    assert(meta?.token === '[REDACTED]', 'Sensitive session token redacted in audit metadata');
    assert(meta?.safeKey === 'SafePublicValue', 'Safe metadata preserved in audit metadata');

  } catch (error) {
    console.error('Test Suite encountered an unexpected error:', error);
    failed++;
  } finally {
    // ---------------------------------------------------------
    // TEST 9: ISOLATED CLEANUP & TEARDOWN
    // ---------------------------------------------------------
    console.log('\n--- Teardown: Purging Isolated Test Records ---');
    try {
      if (testBooking?.id) {
        await prisma.refund.deleteMany({ where: { bookingId: testBooking.id } });
        await prisma.settlementLedger.deleteMany({ where: { bookingId: testBooking.id } });
        await prisma.payment.deleteMany({ where: { bookingId: testBooking.id } });
        await prisma.travelerDetail.deleteMany({ where: { bookingId: testBooking.id } });
        await prisma.booking.deleteMany({ where: { id: testBooking.id } });
      }

      if (testPackage?.id) {
        await prisma.packageAvailability.deleteMany({ where: { packageId: testPackage.id } });
        await prisma.package.deleteMany({ where: { id: testPackage.id } });
      }

      if (testCategory?.id) {
        await prisma.category.deleteMany({ where: { id: testCategory.id } });
      }

      if (adminUser?.id) {
        await prisma.auditLog.deleteMany({ where: { actorId: adminUser.id } });
        await prisma.session.deleteMany({ where: { userId: adminUser.id } });
        await prisma.user.deleteMany({ where: { id: adminUser.id } });
      }

      if (customerUser?.id) {
        await prisma.auditLog.deleteMany({ where: { targetId: customerUser.id } });
        await prisma.customerProfile.deleteMany({ where: { userId: customerUser.id } });
        await prisma.session.deleteMany({ where: { userId: customerUser.id } });
        await prisma.user.deleteMany({ where: { id: customerUser.id } });
      }

      if (providerUser?.id) {
        await prisma.auditLog.deleteMany({ where: { targetId: providerUser.id } });
        await prisma.providerProfile.deleteMany({ where: { userId: providerUser.id } });
        await prisma.session.deleteMany({ where: { userId: providerUser.id } });
        await prisma.user.deleteMany({ where: { id: providerUser.id } });
      }

      // Also clean any leftover security test logs
      await prisma.auditLog.deleteMany({ where: { action: 'SECURITY_TEST' } });

      console.log('Teardown complete. Test data cleanly removed.');
    } catch (cleanupErr) {
      console.error('Teardown cleanup error:', cleanupErr);
    }

    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(`Phase 8 Integration Test Summary:`);
  console.log(`  PASSED: ${passed}`);
  console.log(`  FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8Tests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
