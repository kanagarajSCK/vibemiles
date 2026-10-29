import fs from 'node:fs';

// Load .env if present
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1]] = val;
    }
  }
}

import { prisma } from '../src/lib/prisma';
import { generateBookingTicketPdf } from '../src/server/tickets/pdf-ticket';
import {
  calculateCancellationRefund,
  getAdminFinancialAnalytics,
  getProviderFinancialSummary,
  processRazorpayWebhookEvent,
} from '../src/server/db/payments';
import {
  isRazorpayConfigured,
  createRazorpayOrder,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from '../src/server/payments/razorpay';
import crypto from 'node:crypto';

async function runVerification() {
  console.log('====================================================');
  console.log('  VibeMiles Payments, Payouts & PDF Verification   ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ── Test 1: Cancellation Policy Refund Calculation ──
  console.log('--- Test 1: Cancellation Refund Calculation ---');
  const now = new Date('2026-11-01T00:00:00Z');
  const test15Days = calculateCancellationRefund({
    travelDate: new Date('2026-11-20T00:00:00Z'),
    totalAmount: 10000,
    now,
  });
  assert(test15Days.refundPercent === 100 && test15Days.eligibleRefundAmount === 10000, '15+ days: 100% refund');

  const test10Days = calculateCancellationRefund({
    travelDate: new Date('2026-11-10T00:00:00Z'),
    totalAmount: 10000,
    now,
  });
  assert(test10Days.refundPercent === 75 && test10Days.eligibleRefundAmount === 7500, '7-14 days: 75% refund');

  const test4Days = calculateCancellationRefund({
    travelDate: new Date('2026-11-05T00:00:00Z'),
    totalAmount: 10000,
    now,
  });
  assert(test4Days.refundPercent === 50 && test4Days.eligibleRefundAmount === 5000, '3-6 days: 50% refund');

  const test1Day = calculateCancellationRefund({
    travelDate: new Date('2026-11-02T00:00:00Z'),
    totalAmount: 10000,
    now,
  });
  assert(test1Day.refundPercent === 0 && test1Day.eligibleRefundAmount === 0, '< 3 days: 0% non-refundable');

  // ── Test 2: Razorpay Signature Verification ──
  console.log('\n--- Test 2: Cryptographic Signature Verification ---');
  const orderId = 'order_test_123456';
  const paymentId = 'pay_test_789012';
  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
  const validSig = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const sigResult = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature: validSig,
  });
  assert(sigResult === true, 'Valid payment signature passes');

  const invalidSigResult = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature: 'invalid_tampered_signature_hex_value',
  });
  assert(invalidSigResult === false, 'Tampered signature rejected');

  // ── Test 2.5: Real Razorpay Test Mode Gateway Order ──
  console.log('\n--- Test 2.5: Real Razorpay Test Mode Gateway Order ---');
  assert(isRazorpayConfigured() === true, 'Razorpay gateway is configured in environment');
  const liveTestOrder = await createRazorpayOrder({
    amountInRupees: 100,
    receipt: `VM-VERIFY-${Date.now().toString().slice(-6)}`,
    notes: { suite: 'Readiness Verification' },
  });
  assert(
    Boolean(liveTestOrder.orderId && liveTestOrder.orderId.startsWith('order_')),
    `Real Razorpay Order ID issued by gateway: ${liveTestOrder.orderId}`
  );
  assert(liveTestOrder.amount === 10000, 'Order amount in minor paise (100 INR = 10,000 paise)');
  assert(liveTestOrder.currency === 'INR', 'Currency is INR');

  // ── Test 3: Webhook HMAC Signature & Idempotency ──
  console.log('\n--- Test 3: Webhook Verification & Idempotency ---');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_placeholder_secret';
  const fakeWebhookBody = JSON.stringify({
    id: `evt_test_${Date.now()}`,
    entity: 'event',
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: `pay_test_${Date.now()}`,
          order_id: `order_test_${Date.now()}`,
          amount: 500000,
          currency: 'INR',
          status: 'captured',
        },
      },
    },
  });

  const webhookSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(fakeWebhookBody)
    .digest('hex');

  const webhookSigValid = verifyRazorpayWebhookSignature({
    rawBody: fakeWebhookBody,
    signature: webhookSig,
  });
  assert(webhookSigValid === true, 'Webhook HMAC SHA256 signature verification passes');

  // First webhook processing invocation
  const firstWebhookRun = await processRazorpayWebhookEvent({
    rawBody: fakeWebhookBody,
    signatureHeader: webhookSig,
  });
  assert(firstWebhookRun.success === true, 'First webhook run records and executes cleanly');

  // Second duplicate webhook run should be skipped via AuditLog idempotency
  const secondWebhookRun = await processRazorpayWebhookEvent({
    rawBody: fakeWebhookBody,
    signatureHeader: webhookSig,
  });
  assert(
    secondWebhookRun.success === true && secondWebhookRun.message.includes('idempotent skip'),
    'Duplicate webhook event recognized and skipped idempotently'
  );

  // ── Test 4: PDF Ticket Generation ──
  console.log('\n--- Test 4: PDF Ticket Generation ---');
  const testBooking = await prisma.booking.findFirst({
    include: {
      customer: { include: { user: true } },
      package: true,
      provider: true,
    },
  });

  if (testBooking) {
    const adminUser = {
      id: 'admin_test_user_id',
      email: 'admin@vibemiles.com',
      role: 'admin' as any,
    };

    const pdfTicket = await generateBookingTicketPdf(testBooking.id, adminUser);
    assert(Buffer.isBuffer(pdfTicket.buffer), 'PDF generated as a valid binary Buffer');
    assert(pdfTicket.buffer.length > 5000, `PDF size is genuine (${pdfTicket.buffer.length} bytes)`);
    assert(pdfTicket.filename.startsWith('VibeMiles-Ticket-'), `Filename formatted properly: ${pdfTicket.filename}`);
    assert(pdfTicket.contentType === 'application/pdf', 'Content-Type is application/pdf');

    // Check PDF header signature: %PDF-
    const headerStr = pdfTicket.buffer.subarray(0, 5).toString('ascii');
    assert(headerStr === '%PDF-', 'PDF contains valid %PDF- magic bytes header');

    // Test authorization enforcement: Unrelated customer should be denied
    const unrelatedCustomer = {
      id: 'unrelated_customer_id',
      email: 'stranger@example.com',
      role: 'customer' as any,
    };

    let denied = false;
    try {
      await generateBookingTicketPdf(testBooking.id, unrelatedCustomer);
    } catch (authErr: any) {
      if (authErr.message.includes('Access denied')) {
        denied = true;
      }
    }
    assert(denied === true, 'Unauthorized user is forbidden from generating another customer ticket');
  } else {
    console.log('⚠️ No existing booking found in DB for PDF ticket test; skipping database-specific booking check.');
  }

  // ── Test 5: Admin Analytics & Financial Metrics ──
  console.log('\n--- Test 5: Admin Financial Analytics & Metrics ---');
  const analytics = await getAdminFinancialAnalytics();
  assert(typeof analytics.grossVolume === 'number', 'grossVolume is a valid number');
  assert(typeof analytics.totalCommissionEarned === 'number', 'totalCommissionEarned is a valid number');
  assert(typeof analytics.totalProviderPayables === 'number', 'totalProviderPayables is a valid number');
  assert(analytics.commissionRate === 15.0, 'Platform commission rate defaults to 15%');
  assert(analytics.paymentsSummary !== undefined, 'paymentsSummary breakdown populated');
  assert(analytics.payoutsSummary !== undefined, 'payoutsSummary breakdown populated');

  // ── Test 6: Provider Financial Summary ──
  console.log('\n--- Test 6: Provider Financial Summary ---');
  const firstProvider = await prisma.providerProfile.findFirst();
  if (firstProvider) {
    const provSummary = await getProviderFinancialSummary(firstProvider.id);
    assert(typeof provSummary.grossRevenue === 'number', 'Provider grossRevenue is number');
    assert(typeof provSummary.netPayable === 'number', 'Provider netPayable is number');
    assert(Array.isArray(provSummary.settlements), 'Provider settlements list returned');
  }

  console.log('\n====================================================');
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! `);
  console.log('====================================================\n');
}

runVerification()
  .catch((err) => {
    console.error('Verification failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
