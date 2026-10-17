import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { updateCustomerStatusInDb } from '@/server/db/admin';
import { UserStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const status = body?.status;
    const reason = body?.reason;

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE or SUSPENDED.' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'A descriptive reason is strictly required when modifying customer account status.' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const result = await updateCustomerStatusInDb({
      adminUser: { id: auth.user.id, email: auth.user.email },
      userId: id,
      status: status as UserStatus,
      reason: reason.trim(),
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Customer account successfully ${status === 'SUSPENDED' ? 'suspended' : 'reactivated'}.`,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to update customer status.';
    const statusCode = message.includes('not found') ? 404 : 400;
    console.error('Error updating customer status:', error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
