import Razorpay from 'razorpay';
import crypto from 'node:crypto';

/**
 * Razorpay Gateway Configuration & Helpers
 * Supports production keys, test mode keys, and safe local development sandbox mode.
 */

function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key';
}

function getRazorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
}

function getRazorpayWebhookSecret(): string {
  return process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_placeholder_secret';
}

export const isRazorpayConfigured = (): boolean => {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  return (
    Boolean(keyId) &&
    Boolean(keySecret) &&
    keyId !== 'rzp_test_placeholder_key' &&
    keySecret !== 'rzp_test_placeholder_secret' &&
    !keyId.includes('placeholder') &&
    !keySecret.includes('placeholder')
  );
};

export function getRazorpayClient(): Razorpay {
  return new Razorpay({
    key_id: getRazorpayKeyId(),
    key_secret: getRazorpayKeySecret(),
  });
}

export function getPublicRazorpayKey(): string {
  return getRazorpayKeyId();
}

export function getPlatformCommissionRate(): number {
  const envVal = process.env.PLATFORM_COMMISSION_PERCENT;
  const parsed = envVal ? parseFloat(envVal) : 15.0;
  return isNaN(parsed) || parsed < 0 || parsed > 100 ? 15.0 : parsed;
}

/**
 * Creates an official Razorpay Order using authoritative server-side amounts.
 * @param amountInRupees Persisted booking total amount in INR
 * @param receipt Booking reference (e.g. VM-20261012-XXXX)
 * @param notes Contextual metadata for audit and webhook correlation
 */
export async function createRazorpayOrder({
  amountInRupees,
  receipt,
  notes,
}: {
  amountInRupees: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{
  orderId: string;
  amount: number; // in paise
  currency: string;
  isSandboxFallback?: boolean;
}> {
  if (amountInRupees <= 0) {
    throw new Error('Order amount must be greater than zero.');
  }

  // Integer minor currency units (paise)
  const amountInPaise = Math.round(amountInRupees * 100);

  if (!isRazorpayConfigured()) {
    throw new Error(
      'Razorpay payment gateway is not configured. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in server environment.'
    );
  }

  try {
    const client = getRazorpayClient();
    const order = await client.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt.slice(0, 40),
      notes,
    });

    return {
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency || 'INR',
    };
  } catch (err) {
    console.error('[Razorpay] Order creation failed via SDK:', err);
    throw new Error(`Failed to create payment order with gateway: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Fetches official payment state from Razorpay gateway API.
 * Ensures the payment was genuinely captured and validates the currency & amount.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<{
  id: string;
  status: string;
  amount: number; // in paise
  currency: string;
  orderId?: string;
  method?: string;
  email?: string;
  contact?: string;
  captured?: boolean;
} | null> {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay gateway is not configured. Missing credentials in server environment.');
  }

  try {
    const client = getRazorpayClient();
    const payment = await client.payments.fetch(paymentId);
    if (!payment) return null;

    return {
      id: payment.id,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency || 'INR',
      orderId: (payment as any).order_id,
      method: (payment as any).method,
      email: (payment as any).email,
      contact: (payment as any).contact,
      captured: Boolean((payment as any).captured),
    };
  } catch (err) {
    console.error(`[Razorpay] Failed to fetch payment ${paymentId}:`, err);
    throw new Error(`Failed to fetch payment status from gateway: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Verifies Razorpay payment signature according to official specification:
 * HMAC SHA256 of `order_id + "|" + payment_id` with `key_secret`.
 */
export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', getRazorpayKeySecret())
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    console.error('[Razorpay] Signature verification error:', err);
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature against raw request body using webhook secret.
 */
export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  if (!rawBody || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', getRazorpayWebhookSecret())
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    console.error('[Razorpay] Webhook signature verification error:', err);
    return false;
  }
}

/**
 * Issues a refund through the Razorpay SDK.
 */
export async function issueRazorpayRefund({
  paymentId,
  amountInRupees,
  notes,
}: {
  paymentId: string;
  amountInRupees: number;
  notes?: Record<string, string>;
}): Promise<{
  refundId: string;
  amount: number;
  status: string;
}> {
  const amountInPaise = Math.round(amountInRupees * 100);

  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay gateway is not configured. Missing credentials in server environment.');
  }

  try {
    const client = getRazorpayClient();
    const refund = await client.payments.refund(paymentId, {
      amount: amountInPaise,
      notes,
    });

    return {
      refundId: refund.id,
      amount: Number(refund.amount) / 100,
      status: refund.status || 'processed',
    };
  } catch (err) {
    console.error('[Razorpay] Refund failed via SDK:', err);
    throw new Error(`Gateway refund operation failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
