import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { adminRejectPackage } from '@/server/db/packages';
import { recordAuditLog } from '@/server/db/admin';
import { UserRole } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/packages/[id]/reject
 * Rejects a submitted package with feedback for the provider.
 * Body: { reason: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const reason = body?.reason || body?.rejectionReason;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason must be at least 5 characters long' },
        { status: 400 }
      );
    }

    const updated = await adminRejectPackage(id, reason.trim());

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: UserRole.ADMIN,
      action: 'PACKAGE_REJECT',
      targetType: 'PACKAGE',
      targetId: id,
      reason: reason.trim(),
      metadata: { packageName: updated.name, slug: updated.slug },
    });

    return NextResponse.json({
      success: true,
      message: 'Package listing rejected with feedback',
      package: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to reject package';
    const statusCode = message.includes('not found') ? 404 : 400;
    console.error('API Error in POST /api/admin/packages/[id]/reject:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}
