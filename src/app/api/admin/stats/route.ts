import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getAdminDashboardMetrics } from '@/server/db/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(['admin']);

    const searchParams = req.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const data = await getAdminDashboardMetrics({ startDate, endDate });

    return NextResponse.json({
      success: true,
      admin: auth.user.email,
      ...data,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
