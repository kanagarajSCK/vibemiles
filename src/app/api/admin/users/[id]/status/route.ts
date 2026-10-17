import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { updateUserStatusInDb } from '@/server/db/admin';
import { UserStatus } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));
    const { status, reason } = body;

    if (!status || !Object.values(UserStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status (ACTIVE, SUSPENDED, INACTIVE) is required.' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'A specific reason (minimum 5 characters) is required for modifying account status.' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const updated = await updateUserStatusInDb({
      adminUser: { id: auth.user.id, email: auth.user.email },
      userId: id,
      status: status as UserStatus,
      reason: reason.trim(),
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in PATCH /api/admin/users/[id]/status:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update user status' },
      { status: 400 }
    );
  }
}
