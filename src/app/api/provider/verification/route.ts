import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { prisma } from '@/lib/prisma';
import { VerificationStatus, DocumentType, DocumentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const REQUIRED_DOC_TYPES: DocumentType[] = [
  DocumentType.BUSINESS_REGISTRATION,
  DocumentType.GOVERNMENT_ID,
  DocumentType.ADDRESS_PROOF,
];

export async function GET(_req: NextRequest) {
  try {
    const auth = await requireRole(['provider', 'admin']);

    const provider = await prisma.providerProfile.findUnique({
      where: { userId: auth.user.id },
      include: {
        documents: true,
      },
    });

    if (!provider) {
      return NextResponse.json({
        success: true,
        provider: {
          id: null,
          businessName: 'Unregistered Provider',
          verificationStatus: VerificationStatus.UNVERIFIED,
          rejectionReason: null,
          documentsCount: 0,
          requiredDocumentsCount: REQUIRED_DOC_TYPES.length,
          allVerified: false,
        },
      });
    }

    const verifiedDocs = provider.documents.filter(
      (d) => d.status === DocumentStatus.VERIFIED
    );
    const hasAllRequiredVerified = REQUIRED_DOC_TYPES.every((reqType) =>
      verifiedDocs.some((d) => d.type === reqType)
    );

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        businessName: provider.businessName,
        verificationStatus: provider.verificationStatus,
        rejectionReason: provider.rejectionReason,
        documentsCount: provider.documents.length,
        requiredDocumentsCount: REQUIRED_DOC_TYPES.length,
        allVerified: hasAllRequiredVerified && provider.verificationStatus === VerificationStatus.VERIFIED,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('Error fetching provider verification status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
