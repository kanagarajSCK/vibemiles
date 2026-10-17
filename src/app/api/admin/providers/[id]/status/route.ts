import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { updateProviderStatusInDb } from '@/server/db/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const isActive = body?.isActive;
    const reason = body?.reason;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive boolean is required.' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'A descriptive reason is required when modifying provider active status.' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const result = await updateProviderStatusInDb({
      adminUser: { id: auth.user.id, email: auth.user.email },
      providerId: id,
      isActive,
      reason: reason.trim(),
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Provider successfully ${isActive ? 'activated' : 'suspended'}.`,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to update provider status.';
    const statusCode = message.includes('not found') ? 404 : 400;
    console.error('Error updating provider status:', error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
