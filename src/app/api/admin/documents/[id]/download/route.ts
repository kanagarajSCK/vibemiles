import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getDocumentFileForDownload } from '@/server/db/provider-documents';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await params;

    const result = await getDocumentFileForDownload({
      userId: auth.user.id,
      userRole: 'admin',
      documentId: id,
    });

    const sanitizedFilename = result.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    const headers = new Headers();
    headers.set('Content-Type', result.mimeType);
    headers.set('Content-Length', result.buffer.length.toString());
    headers.set(
      'Content-Disposition',
      `inline; filename="${sanitizedFilename}"`
    );
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    headers.set('X-Content-Type-Options', 'nosniff');

    const uint8Array = new Uint8Array(result.buffer);
    return new NextResponse(uint8Array, {
      status: 200,
      headers,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to retrieve document for admin.';
    const status = message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
