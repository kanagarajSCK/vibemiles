import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getReviewsForProvider } from '@/server/db/reviews';

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireRole(['provider']);

    const reviews = await getReviewsForProvider(auth.user.id);
    return NextResponse.json({ success: true, reviews });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return err.toResponse();
    }
    const message = err instanceof Error ? err.message : 'Failed to load reviews';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
