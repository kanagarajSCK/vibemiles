import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import {
  uploadProviderDocumentForUser,
  DocumentType,
} from '@/server/db/provider-documents';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(['provider', 'admin']);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const typeStr = formData.get('type') as string | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'A valid document file is required.' },
        { status: 400 }
      );
    }

    if (!typeStr || !['BUSINESS_REGISTRATION', 'GOVERNMENT_ID', 'ADDRESS_PROOF'].includes(typeStr)) {
      return NextResponse.json(
        {
          error:
            'Invalid document type. Must be BUSINESS_REGISTRATION, GOVERNMENT_ID, or ADDRESS_PROOF.',
        },
        { status: 400 }
      );
    }

    const type = typeStr as DocumentType;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const document = await uploadProviderDocumentForUser({
      userId: auth.user.id,
      type,
      fileBuffer: buffer,
      originalFileName: file.name,
      mimeType: file.type || 'application/octet-stream',
    });

    return NextResponse.json({
      success: true,
      message: `${type.replace(/_/g, ' ')} uploaded successfully. Submitted for admin review.`,
      document,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Upload failed.';
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
