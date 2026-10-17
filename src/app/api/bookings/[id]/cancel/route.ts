import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/server/auth/guard';
import { cancelBookingInDb } from '@/server/db/bookings';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Travel plans changed';

    const booking = await cancelBookingInDb(bookingId, auth.user.id, auth.user.role, reason);

    return NextResponse.json({
      success: true,
      message: 'Booking reservation successfully cancelled.',
      booking,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to cancel booking.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
