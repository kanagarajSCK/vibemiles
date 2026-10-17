import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { adminModerateReviewInDb } from '@/server/db/reviews';
import { ReviewStatus } from '@prisma/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin']);

    const resolvedParams = await params;
    const body = await req.json();
    const { status, moderationNote } = body;

    if (!status || !Object.values(ReviewStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid or missing moderation status (APPROVED | REJECTED)' }, { status: 400 });
    }

    const review = await adminModerateReviewInDb({
      adminUser: { id: auth.user.id, email: auth.user.email },
      reviewId: resolvedParams.id,
      status: status as ReviewStatus,
      moderationNote: moderationNote ? String(moderationNote) : undefined,
    });

    return NextResponse.json({ success: true, review });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return err.toResponse();
    }
    const message = err instanceof Error ? err.message : 'Failed to moderate review';
    const statusCode = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
