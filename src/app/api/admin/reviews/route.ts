import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getAllReviewsForAdminInDb } from '@/server/db/reviews';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const data = await getAllReviewsForAdminInDb({
      status,
      page,
      limit,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch reviews for admin';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
