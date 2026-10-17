import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { replyToReviewInDb } from '@/server/db/reviews';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['provider']);

    if (auth.user.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Suspended accounts cannot respond to reviews' }, { status: 403 });
    }

    const resolvedParams = await params;
    const body = await req.json();
    const { reply } = body;

    if (!reply || reply.trim().length < 2) {
      return NextResponse.json({ error: 'Reply text must be at least 2 characters long' }, { status: 400 });
    }

    const updated = await replyToReviewInDb({
      providerUserId: auth.user.id,
      reviewId: resolvedParams.id,
      reply: String(reply),
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return err.toResponse();
    }
    const message = err instanceof Error ? err.message : 'Failed to post reply';
    const status = message.includes('own packages') || message.includes('cannot respond')
      ? 403
      : message.includes('not found')
      ? 404
      : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
