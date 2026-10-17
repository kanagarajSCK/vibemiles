import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { reviewProviderDocumentByAdmin } from '@/server/db/provider-documents';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const decision = ((body?.decision || body?.status) as string | undefined)?.toUpperCase();
    const reason = body?.reason;

    if (!decision || !['VERIFIED', 'REJECTED'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be VERIFIED or REJECTED.' },
        { status: 400 }
      );
    }

    if (decision === 'REJECTED' && (!reason || typeof reason !== 'string' || reason.trim().length === 0)) {
      return NextResponse.json(
        { error: 'A descriptive reason is strictly required when rejecting a document.' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const updatedDocument = await reviewProviderDocumentByAdmin({
      adminUserId: auth.user.id,
      adminEmail: auth.user.email,
      documentId: id,
      status: decision as 'VERIFIED' | 'REJECTED',
      reason: reason?.trim(),
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Document status updated to ${decision}.`,
      document: updatedDocument,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to review document.';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
