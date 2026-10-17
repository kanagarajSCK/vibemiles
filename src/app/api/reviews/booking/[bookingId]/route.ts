import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guard';
import { getReviewForBooking } from '@/server/db/reviews';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    await requireAuth();
    const resolvedParams = await params;
    const review = await getReviewForBooking(resolvedParams.bookingId);
    return NextResponse.json({ success: true, review });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load booking review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
