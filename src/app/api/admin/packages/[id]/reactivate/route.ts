import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { adminReactivatePackage } from '@/server/db/packages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));
    const reason = body?.reason;

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const updated = await adminReactivatePackage({
      adminUser: { id: auth.user.id, email: auth.user.email },
      packageId: id,
      reason,
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
    console.error('API Error in POST /api/admin/packages/[id]/reactivate:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to reactivate package' },
      { status: 400 }
    );
  }
}
