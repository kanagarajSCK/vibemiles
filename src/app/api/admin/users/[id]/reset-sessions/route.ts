import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { invalidateUserSessionsInDb, recordAuditLog } from '@/server/db/admin';
import { UserRole } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await context.params;

    const result = await invalidateUserSessionsInDb(id);

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: UserRole.ADMIN,
      action: 'USER_SESSIONS_INVALIDATE',
      targetType: 'USER',
      targetId: id,
      reason: 'Administrator terminated all active sessions for security',
      metadata: { deletedSessionsCount: result.deletedSessionsCount },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in POST /api/admin/users/[id]/reset-sessions:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to invalidate sessions' },
      { status: 500 }
    );
  }
}
