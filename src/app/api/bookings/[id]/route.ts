import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/server/auth/guard';
import { getBookingByIdOrRef } from '@/server/db/bookings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    // Enforce ownership: customers can only view their own, providers can only view their packages, admin views all
    const booking = await getBookingByIdOrRef(bookingId, auth.user.id, auth.user.role);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking reservation not found or access denied.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to retrieve booking.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
