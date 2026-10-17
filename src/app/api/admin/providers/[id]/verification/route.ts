import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { reviewProviderVerificationInDb } from '@/server/db/admin';
import { VerificationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const status = body?.status;
    const reason = body?.reason;

    if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid verification status. Must be VERIFIED or REJECTED.' },
        { status: 400 }
      );
    }

    if (status === 'REJECTED' && (!reason || typeof reason !== 'string' || reason.trim().length === 0)) {
      return NextResponse.json(
        { error: 'A descriptive reason is required when rejecting KYC verification.' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const result = await reviewProviderVerificationInDb({
      adminUser: { id: auth.user.id, email: auth.user.email },
      providerId: id,
      status: status as VerificationStatus,
      reason: reason?.trim(),
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Provider verification status set to ${status}.`,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to update verification status.';
    const statusCode = message.includes('not found') ? 404 : 400;
    console.error('Error reviewing provider verification:', error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
