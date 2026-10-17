import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireAuth, AuthError } from '@/server/auth/guard';
import { createVerifiedReviewInDb, getReviewsForPackage, getReviewsForCustomer } from '@/server/db/reviews';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(['customer']);

    if (auth.user.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Suspended accounts cannot submit reviews' }, { status: 403 });
    }

    const body = await req.json();
    const { bookingId, rating, title, comment } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    if (rating === undefined || rating === null) {
      return NextResponse.json({ error: 'Rating (1-5) is required' }, { status: 400 });
    }
    if (!comment || comment.trim().length < 10) {
      return NextResponse.json({ error: 'Comment must be at least 10 characters long' }, { status: 400 });
    }

    const review = await createVerifiedReviewInDb({
      customerUserId: auth.user.id,
      bookingId,
      rating: Number(rating),
      title: title ? String(title) : undefined,
      comment: String(comment),
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return err.toResponse();
    }
    const message = err instanceof Error ? err.message : 'Failed to submit review';
    const status = message.includes('already been submitted')
      ? 409
      : message.includes('not eligible') || message.includes('concluded')
      ? 422
      : message.includes('not permitted') || message.includes('only submit reviews for bookings placed under your account')
      ? 403
      : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');
    const mine = searchParams.get('mine');

    if (mine === 'true') {
      const auth = await requireAuth();
      const reviews = await getReviewsForCustomer(auth.user.id);
      return NextResponse.json({ success: true, reviews });
    }

    if (packageId) {
      const reviews = await getReviewsForPackage(packageId);
      return NextResponse.json({ success: true, reviews });
    }

    return NextResponse.json({ error: 'packageId or mine=true parameter is required' }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return err.toResponse();
    }
    const message = err instanceof Error ? err.message : 'Failed to load reviews';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
