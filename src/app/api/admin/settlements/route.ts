import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getAdminSettlements, updateSettlementStatusInDb } from '@/server/db/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const providerId = searchParams.get('providerId') || undefined;
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const data = await getAdminSettlements({
      search,
      status,
      providerId,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in GET /api/admin/settlements:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve settlements' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole(['admin']);
    const body = await request.json().catch(() => ({}));
    const { settlementId, status, referenceNote } = body;

    if (!settlementId || !status) {
      return NextResponse.json(
        { success: false, error: 'settlementId and status are required.' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const updated = await updateSettlementStatusInDb({
      adminUser: { id: auth.user.id, email: auth.user.email },
      settlementId,
      status,
      referenceNote,
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
    console.error('API Error in PATCH /api/admin/settlements:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update settlement' },
      { status: 400 }
    );
  }
}
