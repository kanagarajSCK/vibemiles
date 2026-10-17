/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'node:crypto';
import { PrismaClient, BookingStatus, PaymentStatus } from '@prisma/client';
import {
  createPaymentOrderForBooking,
  verifyPaymentAndConfirmBooking,
  processRazorpayWebhookEvent,
  processRefundForBooking,
  calculateCancellationRefund,
  getProviderFinancialSummary,
  getAdminFinancialAnalytics,
} from '../src/server/db/payments';
import {
  createBookingInDb,
  cancelBookingInDb,
  expireUnpaidBookingInDb,
} from '../src/server/db/bookings';
import { createProviderUser, createCustomerUser } from '../src/server/db/users';
import { createPackage, submitPackageForReview, adminApprovePackage } from '../src/server/db/packages';

const prisma = new PrismaClient();

const TEST_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
const TEST_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_placeholder_secret';

function generateValidPaymentSignature(orderId: string, paymentId: string): string {
  return crypto
    .createHmac('sha256', TEST_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function generateValidWebhookSignature(rawBody: string): string {
  return crypto
    .createHmac('sha256', TEST_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
}

async function runPhase7Tests() {
  console.log('============================================================');
  console.log('VibeMiles — Phase 7 Payment Gateway & Refunds Test Suite');
  console.log('Testing against live Supabase PostgreSQL');
  console.log('============================================================\n');

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
  let customerUserA: any;
  let customerUserB: any;
  let providerUser: any;
  let adminUser: any;
  let testPackage: any;
  let testAvailability: any;
  let bookingA: any;
  let bookingB: any;

  try {
    // ---------------------------------------------------------
    // TEST 1: SETUP TEST ACCOUNTS AND PACKAGE
    // ---------------------------------------------------------
    console.log('--- Test 1: Setup Test Accounts & Package ---');
    const timestamp = Date.now();

    customerUserA = await createCustomerUser({
      email: `test.pay.custA.${timestamp}@vibemiles.com`,
      fullName: 'Alice Customer',
      phone: `+9191000${timestamp.toString().slice(-5)}`,
      password: 'TestPassword123!',
    });

    customerUserB = await createCustomerUser({
      email: `test.pay.custB.${timestamp}@vibemiles.com`,
      fullName: 'Bob Customer',
      phone: `+9192000${timestamp.toString().slice(-5)}`,
      password: 'TestPassword123!',
    });

    providerUser = await createProviderUser({
      email: `test.pay.prov.${timestamp}@vibemiles.com`,
      businessName: 'Vibe Payment Adventures',
      ownerName: 'Host Charlie',
      businessCategory: 'Tours',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682001',
      password: 'TestPassword123!',
    });

    adminUser = await prisma.user.create({
      data: {
        email: `test.pay.admin.${timestamp}@vibemiles.com`,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Create and approve test package with departure slot
    testPackage = await createPackage(providerUser.profile.id, {
      name: `Payment Engine Test Tour ${timestamp}`,
      description: 'Test tour for Phase 7 payment engine with verified departures.',
      categorySlug: 'tour',
      destinationName: 'Kochi',
      state: 'Kerala',
      city: 'Kochi',
      durationDays: 4,
      durationNights: 3,
      basePrice: 10000,
      maxGroupSize: 10,
      images: ['https://images.unsplash.com/photo-test-payment.jpg'],
    });

    await submitPackageForReview(testPackage.id, providerUser.user.id);
    await adminApprovePackage(testPackage.id);

    // Create departure slot with capacity 5
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 20); // 20 days ahead for 100% refund window
    departureDate.setUTCHours(0, 0, 0, 0);

    testAvailability = await prisma.packageAvailability.create({
      data: {
        packageId: testPackage.id,
        date: departureDate,
        price: 10000,
        capacity: 5,
        bookedCount: 0,
        isAvailable: true,
      },
    });

    assert(Boolean(customerUserA && providerUser && testPackage && testAvailability), 'Setup test accounts, package, and departure');

    // ---------------------------------------------------------
    // TEST 2: CREATE BOOKING & PERSIST AUDITABLE FINANCIALS
    // ---------------------------------------------------------
    console.log('\n--- Test 2: Booking Creation & Financial Calculations ---');
    bookingA = await createBookingInDb({
      customerId: customerUserA.user.id,
      packageId: testPackage.id,
      availabilityId: testAvailability.id,
      travelDate: departureDate.toISOString().split('T')[0],
      adults: 2,
      children: 0,
      travelerDetails: [
        { firstName: 'Alice', lastName: 'Walker', age: 28, gender: 'female' },
        { firstName: 'David', lastName: 'Walker', age: 30, gender: 'male' },
      ],
    });

    // 2 adults * 10,000 = 20,000 base
    // tax 5% = 1,000
    // total = 21,000
    // platform commission 15% on 20,000 = 3,000
    // provider amount = 17,000
    assert(bookingA.totalAmount === 21000, 'Calculates exact gross booking total on server (21,000 INR)');
    assert(bookingA.taxAmount === 1000, 'Calculates exact 5% GST tax amount (1,000 INR)');
    assert(bookingA.commissionRate === 15, 'Records configurable platform commission rate (15%)');
    assert(bookingA.commissionAmount === 3000, 'Computes 15% platform commission cut (3,000 INR)');
    assert(bookingA.providerAmount === 17000, 'Computes net provider payable amount (17,000 INR)');

    const settlementRecord = await prisma.settlementLedger.findUnique({
      where: { bookingId: bookingA.id },
    });
    assert(Boolean(settlementRecord && settlementRecord.status === 'PENDING'), 'Auto-generates SettlementLedger record in PENDING status');

    // ---------------------------------------------------------
    // TEST 3: SERVER-SIDE PAYMENT ORDER CREATION
    // ---------------------------------------------------------
    console.log('\n--- Test 3: Gateway Order Creation ---');
    const orderRes = await createPaymentOrderForBooking({
      bookingIdOrRef: bookingA.id,
      customerId: customerUserA.user.id,
    });

    assert(orderRes.amount === 2100000, 'Order amount in paise derived strictly from booking total (2,100,000 paise)');
    assert(orderRes.currency === 'INR', 'Order currency is INR');
    assert(Boolean(orderRes.orderId && orderRes.keyId), 'Returns valid gateway order ID and public key');

    // ---------------------------------------------------------
    // TEST 4: CRYPTOGRAPHIC SIGNATURE CHECK & SUCCESSFUL VERIFICATION
    // ---------------------------------------------------------
    console.log('\n--- Test 4: Cryptographic Payment Verification ---');
    const paymentIdA = `pay_${Date.now()}_test1`;
    const validSignature = generateValidPaymentSignature(orderRes.orderId, paymentIdA);

    const verifiedBooking = await verifyPaymentAndConfirmBooking({
      bookingId: bookingA.id,
      orderId: orderRes.orderId,
      paymentId: paymentIdA,
      signature: validSignature,
      userId: customerUserA.user.id,
    });

    assert(verifiedBooking.bookingStatus === 'confirmed', 'Booking transitioned to CONFIRMED status upon verified payment');
    assert(verifiedBooking.paymentStatus === 'paid', 'Payment status marked PAID after cryptographic verification');
    assert(verifiedBooking.expiresAt === undefined, 'Hold window expiry cleared upon confirmation');

    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: customerUserA.user.id },
    });
    assert((customerProfile?.rewardPoints || 0) >= 310, 'Customer reward points credited on payment confirmation (100 welcome + 210 reward = 310 pts)');

    // ---------------------------------------------------------
    // TEST 5: FORGERY REJECTION & INVALID SIGNATURES
    // ---------------------------------------------------------
    console.log('\n--- Test 5: Forged Signature Rejection ---');
    let forgeryCaught = false;
    try {
      await verifyPaymentAndConfirmBooking({
        bookingId: bookingA.id,
        orderId: orderRes.orderId,
        paymentId: 'pay_fake_9999',
        signature: 'invalid_forged_signature_hex_code_1234567890abcdef',
        userId: customerUserA.user.id,
      });
    } catch (err: any) {
      forgeryCaught = err.message.includes('signature verification failed');
    }
    assert(forgeryCaught, 'Forged or tampered payment signature strictly rejected');

    // ---------------------------------------------------------
    // TEST 6: IDEMPOTENT VERIFICATION
    // ---------------------------------------------------------
    console.log('\n--- Test 6: Idempotent Payment Verification ---');
    const idempotentBooking = await verifyPaymentAndConfirmBooking({
      bookingId: bookingA.id,
      orderId: orderRes.orderId,
      paymentId: paymentIdA,
      signature: validSignature,
      userId: customerUserA.user.id,
    });
    assert(idempotentBooking.id === bookingA.id, 'Duplicate payment verification handled idempotently without error');

    // ---------------------------------------------------------
    // TEST 7: WEBHOOK SIGNATURE AND EVENT PROCESSING
    // ---------------------------------------------------------
    console.log('\n--- Test 7: Razorpay Webhook Processing ---');
    // Create Booking B to test webhook payment capture
    bookingB = await createBookingInDb({
      customerId: customerUserB.user.id,
      packageId: testPackage.id,
      availabilityId: testAvailability.id,
      travelDate: departureDate.toISOString().split('T')[0],
      adults: 1,
      children: 0,
      travelerDetails: [
        { firstName: 'Bob', lastName: 'Builder', age: 35, gender: 'male' },
      ],
    });

    const orderResB = await createPaymentOrderForBooking({
      bookingIdOrRef: bookingB.id,
      customerId: customerUserB.user.id,
    });

    const paymentIdB = `pay_${Date.now()}_webhook`;
    const webhookPayload = JSON.stringify({
      entity: 'event',
      account_id: 'acc_test123',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentIdB,
            order_id: orderResB.orderId,
            amount: 1050000,
            currency: 'INR',
            status: 'captured',
            error_description: null,
          },
        },
      },
      created_at: Math.floor(Date.now() / 1000),
    });

    const validWebhookSig = generateValidWebhookSignature(webhookPayload);

    // Process valid webhook
    const webhookResult = await processRazorpayWebhookEvent({
      rawBody: webhookPayload,
      signatureHeader: validWebhookSig,
    });
    assert(webhookResult.success, 'Valid webhook processed successfully');

    const updatedBookingB = await prisma.booking.findUnique({
      where: { id: bookingB.id },
      include: { payments: true },
    });
    assert(updatedBookingB?.bookingStatus === BookingStatus.CONFIRMED, 'Booking B confirmed via webhook payment.captured event');
    assert(updatedBookingB?.payments[0]?.status === PaymentStatus.PAID, 'Payment record marked PAID via webhook');

    // Test duplicate webhook idempotency
    const duplicateWebhookResult = await processRazorpayWebhookEvent({
      rawBody: webhookPayload,
      signatureHeader: validWebhookSig,
    });
    assert(duplicateWebhookResult.success, 'Duplicate webhook event delivered and ignored idempotently');

    // Test forged webhook rejection
    let forgedWebhookCaught = false;
    try {
      await processRazorpayWebhookEvent({
        rawBody: webhookPayload,
        signatureHeader: 'fake_webhook_signature',
      });
    } catch (err: any) {
      forgedWebhookCaught = err.message.includes('signature');
    }
    assert(forgedWebhookCaught, 'Forged webhook signature rejected');

    // ---------------------------------------------------------
    // TEST 8: EXPIRY & TIMED HOLD RECOVERY
    // ---------------------------------------------------------
    console.log('\n--- Test 8: Booking Expiry & Capacity Safety ---');
    // Create a temporary booking with past expiresAt
    const expiredBooking = await createBookingInDb({
      customerId: customerUserA.user.id,
      packageId: testPackage.id,
      availabilityId: testAvailability.id,
      travelDate: departureDate.toISOString().split('T')[0],
      adults: 1,
      travelerDetails: [
        { firstName: 'Temp', lastName: 'Holder', age: 25, gender: 'other' },
      ],
    });

    // Check availability bookedCount
    const availBeforeExpiry = await prisma.packageAvailability.findUnique({
      where: { id: testAvailability.id },
    });

    // Artificially expire the booking
    await prisma.booking.update({
      where: { id: expiredBooking.id },
      data: { expiresAt: new Date(Date.now() - 30000) },
    });

    const expiredResult = await expireUnpaidBookingInDb(expiredBooking.id);
    assert(expiredResult === true, 'expireUnpaidBookingInDb successfully expires unpaid booking past hold window');

    const availAfterExpiry = await prisma.packageAvailability.findUnique({
      where: { id: testAvailability.id },
    });
    assert(
      (availAfterExpiry?.bookedCount || 0) === (availBeforeExpiry?.bookedCount || 0) - 1,
      'Departure capacity atomically restored on booking expiration'
    );

    // Verify PAID bookings cannot be expired
    const expiredPaidBookingResult = await expireUnpaidBookingInDb(bookingA.id);
    assert(expiredPaidBookingResult === false, 'Confirmed paid booking protected from accidental expiration');

    // Clean up expired booking record
    await prisma.travelerDetail.deleteMany({ where: { bookingId: expiredBooking.id } });
    await prisma.payment.deleteMany({ where: { bookingId: expiredBooking.id } });
    await prisma.settlementLedger.deleteMany({ where: { bookingId: expiredBooking.id } });
    await prisma.booking.delete({ where: { id: expiredBooking.id } });

    // ---------------------------------------------------------
    // TEST 9: CANCELLATION POLICY & REFUND PROCESSING
    // ---------------------------------------------------------
    console.log('\n--- Test 9: Cancellation Policy & Refund Processing ---');
    // Check cancellation refund calculation
    const refundCalc = calculateCancellationRefund({
      travelDate: departureDate,
      totalAmount: bookingA.totalAmount,
    });
    assert(refundCalc.refundPercent === 100, 'Cancellation 15+ days before departure qualifies for 100% full refund');

    // Customer cancels booking A
    const cancelledBooking = await cancelBookingInDb(
      bookingA.id,
      customerUserA.user.id,
      'customer',
      'Travel plans changed'
    );
    assert(cancelledBooking.bookingStatus === 'cancelled', 'Booking marked CANCELLED');
    assert(cancelledBooking.refundAmount === 21000, 'Full refund amount recorded (21,000 INR)');
    assert(cancelledBooking.refundStatus === 'pending', 'Refund status set to pending for gateway processing');

    // Process refund via gateway
    const refundRes = await processRefundForBooking({
      bookingIdOrRef: bookingA.id,
      requestedByUserId: adminUser.id,
      userRole: 'admin',
      reason: 'Admin approved customer cancellation refund',
    });

    assert(refundRes.refundStatus === 'processed', 'Gateway refund marked processed');
    assert(refundRes.refundAmount === 21000, 'Processed refund matches eligible amount (21,000 INR)');

    const refundLedgerRow = await prisma.refund.findFirst({
      where: { bookingId: bookingA.id },
    });
    assert(Boolean(refundLedgerRow && refundLedgerRow.status === 'PROCESSED'), 'Persists Refund ledger record with PROCESSED status');

    // Duplicate refund prevention
    let duplicateRefundCaught = false;
    try {
      await processRefundForBooking({
        bookingIdOrRef: bookingA.id,
        requestedByUserId: adminUser.id,
        userRole: 'admin',
      });
    } catch (err: any) {
      duplicateRefundCaught = err.message.includes('already been processed');
    }
    assert(duplicateRefundCaught, 'Duplicate refund prevented by idempotency guard');

    // ---------------------------------------------------------
    // TEST 10: CAPACITY RESTORATION CONCURRENCY SAFETY
    // ---------------------------------------------------------
    console.log('\n--- Test 10: Capacity Restoration Single-Execution ---');
    const availBeforeRepeat = await prisma.packageAvailability.findUnique({
      where: { id: testAvailability.id },
    });

    // Attempting to cancel or restore an already-cancelled booking must NOT restore capacity again
    try {
      await cancelBookingInDb(bookingA.id, customerUserA.user.id, 'customer', 'Repeat cancel');
    } catch {
      // Expected to fail on already-cancelled
    }

    const availAfterRepeat = await prisma.packageAvailability.findUnique({
      where: { id: testAvailability.id },
    });
    assert(
      availAfterRepeat?.bookedCount === availBeforeRepeat?.bookedCount,
      'Capacity cannot be restored more than once across repeated cancellation attempts'
    );

    // ---------------------------------------------------------
    // TEST 11: ROLE-BASED ACCESS CONTROL (ANTI-IDOR)
    // ---------------------------------------------------------
    console.log('\n--- Test 11: Anti-IDOR Authorization Guards ---');
    let crossCustomerPayBlocked = false;
    try {
      await createPaymentOrderForBooking({
        bookingIdOrRef: bookingB.id,
        customerId: customerUserA.user.id, // User A trying to pay for User B's booking
      });
    } catch (err: any) {
      crossCustomerPayBlocked = err.message.includes('not authorized');
    }
    assert(crossCustomerPayBlocked, 'Cross-customer payment initiation strictly blocked');

    let crossCustomerRefundBlocked = false;
    try {
      await processRefundForBooking({
        bookingIdOrRef: bookingB.id,
        requestedByUserId: customerUserA.user.id,
        userRole: 'customer',
      });
    } catch (err: any) {
      crossCustomerRefundBlocked = err.message.includes('not authorized');
    }
    assert(crossCustomerRefundBlocked, 'Cross-customer refund authorization strictly blocked');

    // ---------------------------------------------------------
    // TEST 12: FINANCIAL SUMMARIES & SETTLEMENT REPORTS
    // ---------------------------------------------------------
    console.log('\n--- Test 12: Provider & Admin Financial Ledgers ---');
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: providerUser.user.id },
    });

    const providerFinancials = await getProviderFinancialSummary(providerProfile!.id);
    assert(providerFinancials.settlements.length >= 1, 'Provider financial ledger records verified host transactions');
    assert(typeof providerFinancials.netPayable === 'number', 'Provider net payable computed from verified ledger');

    const adminFinancials = await getAdminFinancialAnalytics();
    assert(adminFinancials.commissionRate === 15, 'Admin analytics reflects configured 15% commission rate');
    assert(adminFinancials.recentLedger.length >= 1, 'Admin ledger tracks all platform transactions');

  } catch (error) {
    console.error('Test execution crashed:', error);
    failed++;
  } finally {
    // ---------------------------------------------------------
    // TEARDOWN: CLEAN UP TEST DATA
    // ---------------------------------------------------------
    console.log('\n--- Teardown: Purging Test Data ---');
    try {
      const allTestBookings = [bookingA?.id, bookingB?.id].filter(Boolean);

      if (allTestBookings.length > 0) {
        await prisma.refund.deleteMany({ where: { bookingId: { in: allTestBookings } } });
        await prisma.settlementLedger.deleteMany({ where: { bookingId: { in: allTestBookings } } });
        await prisma.payment.deleteMany({ where: { bookingId: { in: allTestBookings } } });
        await prisma.travelerDetail.deleteMany({ where: { bookingId: { in: allTestBookings } } });
        await prisma.bookingAddon.deleteMany({ where: { bookingId: { in: allTestBookings } } });
        await prisma.booking.deleteMany({ where: { id: { in: allTestBookings } } });
      }

      if (testAvailability?.id) {
        await prisma.packageAvailability.delete({ where: { id: testAvailability.id } });
      }

      if (testPackage?.id) {
        await prisma.packageImage.deleteMany({ where: { packageId: testPackage.id } });
        await prisma.itineraryDay.deleteMany({ where: { packageId: testPackage.id } });
        await prisma.packageInclusion.deleteMany({ where: { packageId: testPackage.id } });
        await prisma.package.delete({ where: { id: testPackage.id } });
      }

      if (customerUserA?.user?.id) {
        await prisma.customerProfile.deleteMany({ where: { userId: customerUserA.user.id } });
        await prisma.session.deleteMany({ where: { userId: customerUserA.user.id } });
        await prisma.user.delete({ where: { id: customerUserA.user.id } });
      }

      if (customerUserB?.user?.id) {
        await prisma.customerProfile.deleteMany({ where: { userId: customerUserB.user.id } });
        await prisma.session.deleteMany({ where: { userId: customerUserB.user.id } });
        await prisma.user.delete({ where: { id: customerUserB.user.id } });
      }

      if (providerUser?.user?.id) {
        await prisma.providerProfile.deleteMany({ where: { userId: providerUser.user.id } });
        await prisma.session.deleteMany({ where: { userId: providerUser.user.id } });
        await prisma.user.delete({ where: { id: providerUser.user.id } });
      }

      if (adminUser?.id) {
        await prisma.session.deleteMany({ where: { userId: adminUser.id } });
        await prisma.user.delete({ where: { id: adminUser.id } });
      }

      console.log('Teardown complete: all test entities removed.');
    } catch (cleanupErr) {
      console.error('Teardown error:', cleanupErr);
    } finally {
      await prisma.$disconnect();
    }
  }

  console.log('\n============================================================');
  console.log(`Phase 7 Test Suite Finished: ${passed} passed, ${failed} failed`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7Tests();
