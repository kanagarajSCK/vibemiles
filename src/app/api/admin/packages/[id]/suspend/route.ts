import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { adminSuspendPackage } from '@/server/db/packages';
import { recordAuditLog } from '@/server/db/admin';
import { UserRole } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/packages/[id]/suspend
 * Suspends an approved/published listing with feedback for the provider.
 * Body: { reason?: string }
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
    const reason = body?.reason || body?.suspensionReason || 'Suspended by administrator for compliance review';

    const updated = await adminSuspendPackage(id, typeof reason === 'string' ? reason.trim() : undefined);

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: UserRole.ADMIN,
      action: 'PACKAGE_SUSPEND',
      targetType: 'PACKAGE',
      targetId: id,
      reason: typeof reason === 'string' ? reason.trim() : 'Suspended by admin',
      metadata: { packageName: updated.name, slug: updated.slug },
    });

    return NextResponse.json({
      success: true,
      message: 'Package listing suspended and removed from marketplace',
      package: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to suspend package';
    const statusCode = message.includes('not found') ? 404 : 400;
    console.error('API Error in POST /api/admin/packages/[id]/suspend:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: statusCode }
    );
  }
}
