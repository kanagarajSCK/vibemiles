import { NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/guard';
import { getAdminFinancialAnalytics } from '@/server/db/payments';

export async function GET() {
  try {
    await requireRole(['admin']);
    const stats = await getAdminFinancialAnalytics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve admin payment ledger.';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
