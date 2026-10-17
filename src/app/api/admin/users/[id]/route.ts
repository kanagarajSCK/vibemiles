import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getUserDetailsForAdmin, deleteUserInDb } from '@/server/db/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(['admin']);
    const { id } = await context.params;

    const data = await getUserDetailsForAdmin(id);
    if (!data) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in GET /api/admin/users/[id]:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve user details' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));
    const { permanent = false, reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'A valid reason (minimum 5 characters) is required for account deletion.' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const result = await deleteUserInDb({
      adminUser: { id: auth.user.id, email: auth.user.email },
      userId: id,
      permanent: Boolean(permanent),
      reason: reason.trim(),
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
    console.error('API Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete user account' },
      { status: 400 }
    );
  }
}
