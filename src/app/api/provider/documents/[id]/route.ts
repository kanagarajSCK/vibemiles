import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { deleteProviderDocumentForUser } from '@/server/db/provider-documents';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['provider', 'admin']);
    const { id } = await params;

    await deleteProviderDocumentForUser({
      userId: auth.user.id,
      documentId: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to delete document.';
    const status = message.includes('Access denied') ? 403 : message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
