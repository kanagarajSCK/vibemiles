import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getProviderDocumentsForUser, getProviderDocumentsForAdmin } from '@/server/db/provider-documents';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(['provider', 'admin']);
    const { searchParams } = new URL(req.url);
    const providerIdParam = searchParams.get('providerId');

    // If an administrator is inspecting a specific provider
    if (auth.user.role?.toLowerCase() === 'admin' && providerIdParam) {
      const result = await getProviderDocumentsForAdmin(providerIdParam);
      return NextResponse.json({
        success: true,
        data: {
          provider: result.provider,
          documents: result.documents,
          isAdmin: true,
        },
      });
    }

    const result = await getProviderDocumentsForUser(auth.user.id, auth.user.role);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to retrieve documents.';
    console.error('Error fetching provider documents:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
