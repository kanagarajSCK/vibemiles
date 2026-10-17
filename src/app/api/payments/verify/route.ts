import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/guard';
import { verifyPaymentAndConfirmBooking } from '@/server/db/payments';

export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized: please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters.' },
        { status: 400 }
      );
    }

    const verifiedBooking = await verifyPaymentAndConfirmBooking({
      bookingId: String(bookingId).trim(),
      orderId: String(razorpay_order_id).trim(),
      paymentId: String(razorpay_payment_id).trim(),
      signature: String(razorpay_signature).trim(),
      userId: auth.user.id,
      userRole: auth.user.role,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully. Booking confirmed.',
      data: verifiedBooking,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Payment verification failed.';
    console.error('[api/payments/verify] Verification failed:', msg);

    const isAuthError = msg.includes('Access denied');
    const isSignatureError = msg.includes('signature verification failed');

    return NextResponse.json(
      { error: msg },
      { status: isAuthError ? 403 : isSignatureError ? 400 : 500 }
    );
  }
}
