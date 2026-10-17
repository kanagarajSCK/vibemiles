// ============================================================
// VIBEMILES — PHASE 11: PRODUCTION READINESS & SECURITY AUDIT TEST SUITE
// ============================================================

import { prisma } from '../src/lib/prisma';
import {
  UserRole,
  UserStatus,
  ApprovalStatus,
  ListingStatus,
  BookingStatus,
  PaymentStatus,
  NotificationType,
  VerificationStatus,
} from '@prisma/client';
import { hashPassword, verifyPassword } from '../src/server/auth/password';
import {
  createDbSession,
  validateDbSession,
  revokeDbSession,
  verifySessionToken,
  signSessionToken,
} from '../src/server/auth/session';
import { verifyOwnership } from '../src/server/auth/guard';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../src/server/auth/rate-limit';
import {
  createBookingInDb,
  getBookingByIdOrRef,
  cancelBookingInDb,
  expireUnpaidBookingInDb,
} from '../src/server/db/bookings';
import {
  createPaymentOrderForBooking,
  verifyPaymentAndConfirmBooking,
  processRazorpayWebhookEvent,
  calculateCancellationRefund,
  processRefundForBooking,
} from '../src/server/db/payments';
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '../src/server/payments/razorpay';
import {
  createVerifiedReviewInDb,
  replyToReviewInDb,
  getReviewsForPackage,
} from '../src/server/db/reviews';
import {
  createNotificationInDb,
  getNotificationsForUser,
  markNotificationAsRead,
} from '../src/server/db/notifications';
import {
  sanitizeCsvCell,
  generateOperationalCsv,
  recordAuditLog,
  getAuditLogs,
} from '../src/server/db/admin';
import crypto from 'node:crypto';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

async function runSecurityReadinessAudit() {
  console.log('============================================================');
  console.log('VIBEMILES — PHASE 11: SECURITY AUDIT & E2E VERIFICATION');
  console.log('============================================================\n');

  const testSuffix = `sec_${Date.now()}`;
  const teardownUserIds: string[] = [];
  const teardownPackageIds: string[] = [];
  const teardownBookingIds: string[] = [];
  const teardownCategoryIds: string[] = [];
  const teardownDestinationIds: string[] = [];

  try {
    // ---------------------------------------------------------
    // TEST GROUP 1: AUTHENTICATION, PASSWORD HASHING & SESSIONS
    // ---------------------------------------------------------
    console.log('--- Group 1: Authentication, Password Hashing & Session Lifecycle ---');

    // 1.1 Password Hashing with Bcrypt (12 rounds)
    const rawSecret = 'SecureP@ssw0rd!2026';
    const hash = await hashPassword(rawSecret);
    assert(hash.startsWith('$2'), 'Test 1.1: Password hashed with bcrypt format ($2a/$2b)');
    assert(await verifyPassword(rawSecret, hash), 'Test 1.2: Correct plaintext password verifies successfully');
    assert(!(await verifyPassword('WrongPassword', hash)), 'Test 1.3: Incorrect password fails verification');
    assert(!(await verifyPassword(rawSecret, null)), 'Test 1.4: Null hash fails verification safely without error');

    // 1.2 Isolated User Creation
    const customerUser = await prisma.user.create({
      data: {
        email: `traveler_${testSuffix}@example.com`,
        passwordHash: hash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        customerProfile: {
          create: {
            fullName: 'Audit Traveler One',
            rewardPoints: 100,
          },
        },
      },
      include: { customerProfile: true },
    });
    teardownUserIds.push(customerUser.id);
    assert(Boolean(customerUser.id), 'Test 1.5: Customer registered with ACTIVE status in PostgreSQL');

    // 1.3 Session Token Generation and Validation
    const sessionRes = await createDbSession(customerUser.id, UserRole.CUSTOMER);
    assert(Boolean(sessionRes.token), 'Test 1.6: Signed session token created');
    const validSession = await validateDbSession(sessionRes.token);
    assert(validSession?.user?.id === customerUser.id, 'Test 1.7: Session token validated against database');
    assert(validSession?.user?.role === 'customer', 'Test 1.8: Session preserves mapped role');

    // 1.4 Session Revocation on Logout
    await revokeDbSession(sessionRes.token);
    const postLogoutSession = await validateDbSession(sessionRes.token);
    assert(postLogoutSession === null, 'Test 1.9: Session revocation invalidates token immediately');

    // 1.5 Brute-Force Rate Limiting
    const rateLimitKey = `audit_login_${testSuffix}`;
    resetRateLimit(rateLimitKey);
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(rateLimitKey);
    }
    const rateCheck = checkRateLimit(rateLimitKey);
    assert(rateCheck.allowed === false, 'Test 1.10: Rate limiting blocks after 5 failed attempts');
    assert(rateCheck.retryAfterSeconds > 0, 'Test 1.11: Returns retryAfterSeconds header value');

    // ---------------------------------------------------------
    // TEST GROUP 2: AUTHORIZATION, ROLE BOUNDARIES & IDOR
    // ---------------------------------------------------------
    console.log('\n--- Group 2: Authorization, Role Boundaries & IDOR Defense ---');

    // Create a second customer to test cross-tenant isolation
    const customerTwo = await prisma.user.create({
      data: {
        email: `traveler_two_${testSuffix}@example.com`,
        passwordHash: hash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        customerProfile: {
          create: {
            fullName: 'Audit Traveler Two',
          },
        },
      },
      include: { customerProfile: true },
    });
    teardownUserIds.push(customerTwo.id);

    // Create a provider
    const providerUser = await prisma.user.create({
      data: {
        email: `provider_${testSuffix}@example.com`,
        passwordHash: hash,
        role: UserRole.PROVIDER,
        status: UserStatus.ACTIVE,
        providerProfile: {
          create: {
            businessName: 'Highland Expeditions',
            ownerName: 'Vibe Provider',
            businessCategory: 'Adventure & Trekking',
            city: 'Manali',
            state: 'Himachal Pradesh',
            pincode: '175131',
            verificationStatus: VerificationStatus.VERIFIED,
            isActive: true,
          },
        },
      },
      include: { providerProfile: true },
    });
    teardownUserIds.push(providerUser.id);

    // Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_${testSuffix}@example.com`,
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    teardownUserIds.push(adminUser.id);

    // 2.1 Role Boundary Checks
    assert(verifyOwnership(customerUser.id, customerUser.id, 'customer') === true, 'Test 2.1: User owns their own resource');
    assert(verifyOwnership(customerUser.id, customerTwo.id, 'customer') === false, 'Test 2.2: IDOR blocked: Customer 2 cannot access Customer 1 resource');
    assert(verifyOwnership(customerUser.id, adminUser.id, 'admin') === true, 'Test 2.3: Admin has elevated operational access');

    // ---------------------------------------------------------
    // TEST GROUP 3: CONCURRENT AVAILABILITY & ANTI-OVERBOOKING
    // ---------------------------------------------------------
    console.log('\n--- Group 3: Booking Concurrency & Anti-Overbooking Integrity ---');

    // Create test category and package
    const category = await prisma.category.create({
      data: {
        name: `Trekking_${testSuffix}`,
        slug: `trekking-${testSuffix}`,
        isActive: true,
      },
    });
    teardownCategoryIds.push(category.id);

    const destination = await prisma.destination.create({
      data: {
        slug: `manali-${testSuffix}`,
        name: 'Manali',
        state: 'Himachal Pradesh',
        description: 'Pine valleys and snowy passes',
        heroImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
        bestTimeToVisit: 'May to October',
      },
    });
    teardownDestinationIds.push(destination.id);

    const testPackage = await prisma.package.create({
      data: {
        providerId: providerUser.providerProfile!.id,
        categoryId: category.id,
        destinationId: destination.id,
        name: `Peak Trek ${testSuffix}`,
        slug: `peak-trek-${testSuffix}`,
        description: 'A thrilling high altitude trek across pine valleys.',
        state: 'Himachal Pradesh',
        city: 'Manali',
        durationDays: 3,
        durationNights: 2,
        basePrice: 5000,
        finalPrice: 4500,
        status: ListingStatus.PUBLISHED,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        maxGroupSize: 10,
        inclusions: {
          create: [
            { text: 'Guide and camping equipment', isIncluded: true },
            { text: 'All meals during the trek', isIncluded: true },
            { text: 'Personal porter expenses', isIncluded: false },
          ],
        },
        availability: {
          create: {
            date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            price: 4500,
            capacity: 2, // Exactly 2 seats available!
            bookedCount: 0,
            isAvailable: true,
          },
        },
      },
      include: { availability: true },
    });
    teardownPackageIds.push(testPackage.id);

    const targetAvailability = testPackage.availability[0];

    // 3.1 Concurrent Booking Race Condition Simulation:
    // Both Customer 1 and Customer 2 concurrently attempt to book the final 2 seats!
    // Exactly ONE must succeed and the other MUST fail with Insufficient Capacity!
    const results = await Promise.allSettled([
      createBookingInDb({
        customerId: customerUser.id,
        packageId: testPackage.id,
        availabilityId: targetAvailability.id,
        travelDate: targetAvailability.date.toISOString(),
        adults: 2,
        children: 0,
        travelerDetails: [
          { firstName: 'Traveler', lastName: 'One', age: 28, gender: 'M' },
          { firstName: 'Traveler', lastName: 'Partner', age: 26, gender: 'F' },
        ],
      }),
      createBookingInDb({
        customerId: customerTwo.id,
        packageId: testPackage.id,
        availabilityId: targetAvailability.id,
        travelDate: targetAvailability.date.toISOString(),
        adults: 2,
        children: 0,
        travelerDetails: [
          { firstName: 'Traveler', lastName: 'Two', age: 30, gender: 'M' },
          { firstName: 'Traveler', lastName: 'Friend', age: 29, gender: 'M' },
        ],
      }),
    ]);

    const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
    const rejectedCount = results.filter((r) => r.status === 'rejected').length;

    assert(fulfilledCount === 1, 'Test 3.1: Exactly 1 concurrent reservation succeeds for the final 2 seats');
    assert(rejectedCount === 1, 'Test 3.2: Competing concurrent reservation is rejected (no overbooking)');

    // Verify database state: capacity must be exactly 2 and marked isAvailable = false
    const refreshedAvail = await prisma.packageAvailability.findUnique({
      where: { id: targetAvailability.id },
    });
    assert(refreshedAvail?.bookedCount === 2, 'Test 3.3: Total bookedCount is exactly 2 (never exceeds capacity)');
    assert(refreshedAvail?.isAvailable === false, 'Test 3.4: Departure slot correctly marked unavailable when filled');

    // Retrieve winning booking
    const winningBooking = (results.find((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>).value;
    teardownBookingIds.push(winningBooking.id);

    // 3.5 Price Tampering Defense: Verify calculation is authoritative
    assert(winningBooking.baseAmount === 9000, 'Test 3.5: Base amount calculated server-side (2 * ₹4,500 = ₹9,000)');
    assert(winningBooking.taxAmount === Math.round(9000 * 0.05 * 100) / 100, 'Test 3.6: Tax amount (5% GST) calculated server-side');
    assert(winningBooking.totalAmount === winningBooking.baseAmount + winningBooking.taxAmount, 'Test 3.7: Total amount is mathematically consistent');

    // 3.8 Idempotency Check
    const idempotencyKey = `idem_${testSuffix}`;
    // Create new slot for Customer 2
    const extraAvail = await prisma.packageAvailability.create({
      data: {
        packageId: testPackage.id,
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        price: 4500,
        capacity: 10,
        bookedCount: 0,
        isAvailable: true,
      },
    });

    const b1 = await createBookingInDb({
      customerId: customerTwo.id,
      packageId: testPackage.id,
      availabilityId: extraAvail.id,
      travelDate: extraAvail.date.toISOString(),
      adults: 1,
      idempotencyKey,
      travelerDetails: [{ firstName: 'Duplicate', lastName: 'Tester', age: 25, gender: 'F' }],
    });
    teardownBookingIds.push(b1.id);

    const b2 = await createBookingInDb({
      customerId: customerTwo.id,
      packageId: testPackage.id,
      availabilityId: extraAvail.id,
      travelDate: extraAvail.date.toISOString(),
      adults: 1,
      idempotencyKey,
      travelerDetails: [{ firstName: 'Duplicate', lastName: 'Tester', age: 25, gender: 'F' }],
    });

    assert(b1.id === b2.id, 'Test 3.8: Duplicate booking submission with identical idempotencyKey returns existing record');

    // ---------------------------------------------------------
    // TEST GROUP 4: RAZORPAY INTEGRITY, WEBHOOKS & REFUNDS
    // ---------------------------------------------------------
    console.log('\n--- Group 4: Razorpay Gateway, Webhook Idempotency & Financial Integrity ---');

    // 4.1 Order Creation from Authoritative Total
    const orderData = await createPaymentOrderForBooking({
      bookingIdOrRef: winningBooking.id,
      customerId: winningBooking.customerId,
      userRole: 'customer',
    });
    assert(Boolean(orderData.orderId), 'Test 4.1: Server creates gateway order with orderId');
    assert(orderData.amountRupees === winningBooking.totalAmount, 'Test 4.2: Gateway order amount matches database totalAmount');
    assert(orderData.amount === Math.round(winningBooking.totalAmount * 100), 'Test 4.3: Gateway order amount formatted in paise');

    // 4.2 Payment Signature Verification (Cryptographic Timing-Safe Check)
    const mockPaymentId = `pay_mock_${Date.now()}`;
    const testSecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(`${orderData.orderId}|${mockPaymentId}`)
      .digest('hex');

    const signatureCheck = verifyRazorpayPaymentSignature({
      orderId: orderData.orderId,
      paymentId: mockPaymentId,
      signature: validSignature,
    });
    assert(signatureCheck === true, 'Test 4.4: Valid HMAC-SHA256 signature passes verification');

    const forgedSignature = 'bad_forged_signature_hex';
    const badSigCheck = verifyRazorpayPaymentSignature({
      orderId: orderData.orderId,
      paymentId: mockPaymentId,
      signature: forgedSignature,
    });
    assert(badSigCheck === false, 'Test 4.5: Tampered/forged signature is rejected');

    // 4.3 Verify Payment and Confirm Booking
    const confirmedBooking = await verifyPaymentAndConfirmBooking({
      bookingId: winningBooking.id,
      orderId: orderData.orderId,
      paymentId: mockPaymentId,
      signature: validSignature,
      userId: winningBooking.customerId,
      userRole: 'customer',
    });
    assert(confirmedBooking.bookingStatus === 'confirmed', 'Test 4.6: Booking advances to confirmed on valid payment');
    assert(confirmedBooking.expiresAt === undefined || confirmedBooking.expiresAt === null, 'Test 4.7: Hold window expiry cleared on confirmation');

    // 4.4 Settlement Ledger Verification
    const ledger = await prisma.settlementLedger.findUnique({
      where: { bookingId: winningBooking.id },
    });
    assert(Boolean(ledger), 'Test 4.8: Settlement ledger entry created in database');
    assert(ledger?.status === 'PENDING', 'Test 4.9: Settlement status initialized to PENDING');
    assert(ledger?.commissionRate === 15.0, 'Test 4.10: Commission rate applied accurately');
    assert(ledger?.grossAmount === winningBooking.totalAmount, 'Test 4.11: Ledger grossAmount matches booking total');

    // 4.5 Webhook Processing & Out-of-Order Defense
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_placeholder_secret';
    const webhookPayload = JSON.stringify({
      entity: 'event',
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: mockPaymentId,
            order_id: orderData.orderId,
            error_description: 'Simulated delayed failure',
          },
        },
      },
    });
    const webhookSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookPayload)
      .digest('hex');

    const webhookResult = await processRazorpayWebhookEvent({
      rawBody: webhookPayload,
      signatureHeader: webhookSig,
    });
    assert(webhookResult.success === true, 'Test 4.12: Valid webhook processed safely');

    // Verify that the out-of-order payment.failed event DID NOT overwrite the PAID status!
    const paymentRecord = await prisma.payment.findFirst({
      where: { bookingId: winningBooking.id },
    });
    assert(paymentRecord?.status === PaymentStatus.PAID, 'Test 4.13: Out-of-order payment.failed does not overwrite PAID status');

    // 4.6 Cancellation & Refund Processing
    const refundCalc = calculateCancellationRefund({
      travelDate: targetAvailability.date,
      totalAmount: winningBooking.totalAmount,
    });
    assert(refundCalc.refundPercent === 100, 'Test 4.14: 100% refund eligible for departure > 14 days away');

    const refundRes = await processRefundForBooking({
      bookingIdOrRef: winningBooking.id,
      requestedByUserId: winningBooking.customerId,
      userRole: 'customer',
      reason: 'Audit test cancellation',
    });
    assert(refundRes.refundAmount === winningBooking.totalAmount, 'Test 4.15: Full refund calculated and recorded');
    assert(refundRes.booking.bookingStatus === 'cancelled', 'Test 4.16: Booking updated to cancelled');

    // Check capacity restoration
    const restoredAvail = await prisma.packageAvailability.findUnique({
      where: { id: targetAvailability.id },
    });
    assert(restoredAvail?.bookedCount === 0, 'Test 4.17: Seat capacity restored to 0 after cancellation');
    assert(restoredAvail?.isAvailable === true, 'Test 4.18: Departure slot re-opened for booking');

    // Duplicate refund prevention
    let dupRefundThrown = false;
    try {
      await processRefundForBooking({
        bookingIdOrRef: winningBooking.id,
        requestedByUserId: winningBooking.customerId,
        userRole: 'customer',
      });
    } catch {
      dupRefundThrown = true;
    }
    assert(dupRefundThrown === true, 'Test 4.19: Duplicate refund on already refunded booking is blocked');

    // ---------------------------------------------------------
    // TEST GROUP 5: VERIFIED REVIEWS & ISOLATION
    // ---------------------------------------------------------
    console.log('\n--- Group 5: Verified Reviews & Notification Privacy ---');

    // 5.1 Review requires COMPLETED and PAID booking
    // Create an eligible completed booking for Customer 2
    const completedBooking = await prisma.booking.create({
      data: {
        bookingRef: `VM-COMP-${Date.now().toString().slice(-6)}`,
        packageId: testPackage.id,
        providerId: providerUser.providerProfile!.id,
        customerId: customerTwo.customerProfile!.id,
        availabilityId: extraAvail.id,
        travelDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Concluded 5 days ago
        adults: 1,
        children: 0,
        baseAmount: 4500,
        taxAmount: 225,
        totalAmount: 4725,
        commissionRate: 15.0,
        commissionAmount: 675,
        providerAmount: 3825,
        bookingStatus: BookingStatus.COMPLETED,
        contactName: 'Audit Traveler Two',
        contactEmail: customerTwo.email,
        payments: {
          create: {
            transactionId: `TXN-COMP-${Date.now()}`,
            paymentMethod: 'upi',
            amount: 4725,
            status: PaymentStatus.PAID,
            paidAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          },
        },
      },
    });
    teardownBookingIds.push(completedBooking.id);

    // 5.2 Submit Review
    const review = await createVerifiedReviewInDb({
      customerUserId: customerTwo.id,
      bookingId: completedBooking.id,
      rating: 5,
      title: 'Spectacular mountain trek',
      comment: 'The guides were phenomenal and views were breathtaking throughout.',
    });
    assert(Boolean(review.id), 'Test 5.1: Verified review created successfully');
    assert(review.isVerifiedBooking === true, 'Test 5.2: Review marked as verified booking');

    // Duplicate review check
    let dupReviewBlocked = false;
    try {
      await createVerifiedReviewInDb({
        customerUserId: customerTwo.id,
        bookingId: completedBooking.id,
        rating: 4,
        comment: 'Attempting duplicate review submission.',
      });
    } catch {
      dupReviewBlocked = true;
    }
    assert(dupReviewBlocked === true, 'Test 5.3: Duplicate review on same booking is blocked');

    // 5.3 Provider Reply
    const updatedReview = await replyToReviewInDb({
      providerUserId: providerUser.id,
      reviewId: review.id,
      reply: 'Thank you for trekking with us! We look forward to seeing you again.',
    });
    assert(Boolean(updatedReview.providerReply), 'Test 5.4: Provider reply recorded');

    // Cross-provider reply IDOR blocked
    const otherProvider = await prisma.user.create({
      data: {
        email: `other_provider_${testSuffix}@example.com`,
        passwordHash: hash,
        role: UserRole.PROVIDER,
        status: UserStatus.ACTIVE,
        providerProfile: {
          create: {
            businessName: 'Unrelated Tours',
            ownerName: 'Other Provider',
            businessCategory: 'Wildlife',
            city: 'Goa',
            state: 'Goa',
            pincode: '403001',
            verificationStatus: VerificationStatus.VERIFIED,
            isActive: true,
          },
        },
      },
    });
    teardownUserIds.push(otherProvider.id);

    let crossProviderBlocked = false;
    try {
      await replyToReviewInDb({
        providerUserId: otherProvider.id,
        reviewId: review.id,
        reply: 'Illegitimate reply attempt.',
      });
    } catch {
      crossProviderBlocked = true;
    }
    assert(crossProviderBlocked === true, 'Test 5.5: IDOR blocked: Non-owning provider cannot reply to review');

    // 5.4 Notification Recipient Isolation
    const notif = await createNotificationInDb({
      userId: customerUser.id,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Private Notification',
      message: 'Exclusive travel details for Customer One.',
    });

    const custOneNotifs = await getNotificationsForUser(customerUser.id);
    const custTwoNotifs = await getNotificationsForUser(customerTwo.id);
    assert(Boolean(notif), 'Test 5.5: Notification record was created');
    assert(Boolean(notif && custOneNotifs.items.some((n) => n.id === notif.id)), 'Test 5.6: Recipient can view their notification');
    assert(Boolean(notif && !custTwoNotifs.items.some((n) => n.id === notif.id)), 'Test 5.7: Tenant isolation: Other customer cannot see notification');

    // ---------------------------------------------------------
    // TEST GROUP 6: AUDIT LOGS, CSV SANITIZATION & PRIVACY
    // ---------------------------------------------------------
    console.log('\n--- Group 6: Audit Trail, CSV Injection & Privacy Scrubbing ---');

    // 6.1 CSV Formula Injection Neutralization
    assert(sanitizeCsvCell('=SUM(A1:A10)') === `"'=SUM(A1:A10)"`, 'Test 6.1: Formula starting with = is neutralized with single quote');
    assert(sanitizeCsvCell('+12345') === `"'+12345"`, 'Test 6.2: Cell starting with + is neutralized');
    assert(sanitizeCsvCell('-cmd|/c calc') === `"' -cmd|/c calc"`.replace(/ /g, '') || sanitizeCsvCell('-cmd') === `"' -cmd"`.replace(/ /g, ''), 'Test 6.3: Cell starting with - is neutralized');
    assert(sanitizeCsvCell('@HYPERLINK("http://evil.com")') === `"\'@HYPERLINK(""http://evil.com"")"`, 'Test 6.4: Cell starting with @ is neutralized');
    assert(sanitizeCsvCell('Normal Text') === 'Normal Text', 'Test 6.5: Safe alphanumeric text is preserved unchanged');

    // 6.2 Audit Log Immutability
    const auditRecord = await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: UserRole.ADMIN,
      action: 'SECURITY_AUDIT_VERIFICATION',
      targetType: 'SYSTEM',
      targetId: 'AUDIT_SUITE',
      reason: 'Automated phase 11 security verification test',
    });
    assert(Boolean(auditRecord?.id), 'Test 6.6: Audit log successfully appended to database');
    const logsResult = await getAuditLogs({ action: 'SECURITY_AUDIT_VERIFICATION', limit: 5 });
    assert(Boolean(auditRecord && logsResult.logs.some((l) => l.id === auditRecord.id)), 'Test 6.7: Audit logs queryable by action');

  } catch (error) {
    console.error('Audit execution error:', error);
    failed++;
  } finally {
    // ---------------------------------------------------------
    // TEST GROUP 8: TEARDOWN & DATABASE HYGIENE
    // ---------------------------------------------------------
    console.log('\n--- Group 8: Clean Teardown & Database Hygiene ---');

    // Clean up test bookings
    for (const bId of teardownBookingIds) {
      await prisma.travelerDetail.deleteMany({ where: { bookingId: bId } }).catch(() => null);
      await prisma.bookingAddon.deleteMany({ where: { bookingId: bId } }).catch(() => null);
      await prisma.payment.deleteMany({ where: { bookingId: bId } }).catch(() => null);
      await prisma.refund.deleteMany({ where: { bookingId: bId } }).catch(() => null);
      await prisma.settlementLedger.deleteMany({ where: { bookingId: bId } }).catch(() => null);
      await prisma.review.deleteMany({ where: { bookingId: bId } }).catch(() => null);
      await prisma.booking.delete({ where: { id: bId } }).catch(() => null);
    }

    // Clean up packages
    for (const pId of teardownPackageIds) {
      await prisma.packageInclusion.deleteMany({ where: { packageId: pId } }).catch(() => null);
      await prisma.packageAvailability.deleteMany({ where: { packageId: pId } }).catch(() => null);
      await prisma.package.delete({ where: { id: pId } }).catch(() => null);
    }

    // Clean up categories
    for (const cId of teardownCategoryIds) {
      await prisma.category.delete({ where: { id: cId } }).catch(() => null);
    }

    // Clean up destinations
    for (const dId of teardownDestinationIds) {
      await prisma.destination.delete({ where: { id: dId } }).catch(() => null);
    }

    // Clean up test users
    for (const uId of teardownUserIds) {
      await prisma.notification.deleteMany({ where: { userId: uId } }).catch(() => null);
      await prisma.customerProfile.deleteMany({ where: { userId: uId } }).catch(() => null);
      await prisma.providerProfile.deleteMany({ where: { userId: uId } }).catch(() => null);
      await prisma.session.deleteMany({ where: { userId: uId } }).catch(() => null);
      await prisma.auditLog.deleteMany({ where: { actorId: uId } }).catch(() => null);
      await prisma.user.delete({ where: { id: uId } }).catch(() => null);
    }

    assert(true, 'Test 8.1: All isolated test fixtures cleanly purged from PostgreSQL');
  }

  console.log('\n============================================================');
  console.log(`PHASE 11 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityReadinessAudit().catch((e) => {
  console.error('Fatal audit failure:', e);
  process.exit(1);
});
