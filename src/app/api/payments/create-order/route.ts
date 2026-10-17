import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/guard';
import { createPaymentOrderForBooking } from '@/server/db/payments';

export async function POST(req: NextRequest) {
  try {
    const auth = await getSessionUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized: please sign in to pay.' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId || typeof bookingId !== 'string') {
      return NextResponse.json({ error: 'Valid bookingId is required.' }, { status: 400 });
    }

    const orderData = await createPaymentOrderForBooking({
      bookingIdOrRef: bookingId.trim(),
      customerId: auth.user.id,
      userRole: auth.user.role,
    });

    return NextResponse.json({
      success: true,
      data: orderData,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create payment order.';
    const isClientError =
      msg.includes('not found') ||
      msg.includes('expired') ||
      msg.includes('already been paid') ||
      msg.includes('cancelled');
    const isAuthError = msg.includes('not authorized');

    return NextResponse.json(
      { error: msg },
      { status: isAuthError ? 403 : isClientError ? 400 : 500 }
    );
  }
}
