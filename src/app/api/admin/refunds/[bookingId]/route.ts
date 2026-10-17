import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/guard';
import { processRefundForBooking } from '@/server/db/payments';
import { recordAuditLog } from '@/server/db/admin';
import { UserRole } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const auth = await requireRole(['admin']);
    const resolvedParams = await params;
    const { bookingId } = resolvedParams;

    let reason = 'Admin authorized refund';
    try {
      const body = await req.json();
      if (body?.reason) {
        reason = String(body.reason);
      }
    } catch {
      // Body is optional
    }

    const result = await processRefundForBooking({
      bookingIdOrRef: bookingId,
      requestedByUserId: auth.user.id,
      userRole: 'admin',
      reason,
    });

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: UserRole.ADMIN,
      action: 'REFUND_PROCESS',
      targetType: 'BOOKING',
      targetId: bookingId,
      reason,
      metadata: {
        refundAmount: result.refundAmount,
        bookingRef: result.booking.bookingRef,
        gatewayRefundId: result.gatewayRefundId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully via gateway.',
      data: result,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to process refund.';
    console.error('[api/admin/refunds] Refund processing failed:', msg);

    const isAuthError = msg.includes('Access denied') || msg.includes('Unauthorized');
    const isConflict = msg.includes('already been processed');

    return NextResponse.json(
      { error: msg },
      { status: isAuthError ? 403 : isConflict ? 409 : 500 }
    );
  }
}
