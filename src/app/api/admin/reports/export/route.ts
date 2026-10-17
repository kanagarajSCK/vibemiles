import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { generateOperationalCsv, recordAuditLog } from '@/server/db/admin';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(['admin']);

    const searchParams = req.nextUrl.searchParams;
    const type = (searchParams.get('type') || 'bookings') as 'bookings' | 'settlements' | 'providers';

    if (!['bookings', 'settlements', 'providers'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid report export type. Supported: bookings, settlements, providers' },
        { status: 400 }
      );
    }

    const csvContent = await generateOperationalCsv(type);

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: UserRole.ADMIN,
      action: 'REPORT_EXPORT_CSV',
      targetType: 'SYSTEM',
      targetId: type,
      reason: `Admin exported ${type} CSV report with formula injection sanitization.`,
      ipAddress,
      userAgent,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `vibemiles_${type}_export_${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('Error generating CSV export:', error);
    return NextResponse.json({ error: 'Internal server error generating export' }, { status: 500 });
  }
}
