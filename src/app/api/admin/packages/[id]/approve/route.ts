import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { adminApprovePackage } from '@/server/db/packages';
import { recordAuditLog } from '@/server/db/admin';
import { UserRole } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/packages/[id]/approve
 * Approves a submitted package and publishes it to the marketplace.
 */
export async function POST(
  _request: NextRequest,
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

    const updated = await adminApprovePackage(id);

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: UserRole.ADMIN,
      action: 'PACKAGE_APPROVE',
      targetType: 'PACKAGE',
      targetId: id,
      reason: 'Admin approved listing for marketplace publication',
      metadata: { packageName: updated.name, slug: updated.slug },
    });

    return NextResponse.json({
      success: true,
      message: 'Package listing approved and published',
      package: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to approve package';
    const statusCode = message.includes('not found') ? 404 : 400;
    console.error('API Error in POST /api/admin/packages/[id]/approve:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}
