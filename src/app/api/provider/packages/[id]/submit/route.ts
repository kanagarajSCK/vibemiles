import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { submitPackageForReview } from '@/server/db/packages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/provider/packages/[id]/submit
 * Submits a draft or rejected package for admin moderation.
 * IDOR Protected: verifies ownership.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['provider']);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    const updated = await submitPackageForReview(id, auth.user.id);

    return NextResponse.json({
      success: true,
      message: 'Package submitted for moderation review',
      package: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to submit package';
    const statusCode = message.includes('access denied') || message.includes('not found')
      ? 404
      : (message.includes('KYC') || message.includes('verification') ? 403 : 400);
    console.error('API Error in POST /api/provider/packages/[id]/submit:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}
