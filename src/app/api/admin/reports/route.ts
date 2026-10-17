import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getAdminOperationalReport, getAdminDashboardMetrics } from '@/server/db/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin']);

    const searchParams = req.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const [report, metrics] = await Promise.all([
      getAdminOperationalReport({ startDate, endDate }),
      getAdminDashboardMetrics({ startDate, endDate }),
    ]);

    return NextResponse.json({
      success: true,
      report,
      metrics: metrics.metrics,
      definitions: metrics.definitions,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('Error fetching admin reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
