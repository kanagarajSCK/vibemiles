import { NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getBookingsForProvider } from '@/server/db/bookings';

export async function GET() {
  try {
    const auth = await requireRole(['provider', 'admin']);
    const bookings = await getBookingsForProvider(auth.user.id);

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to retrieve provider bookings.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
