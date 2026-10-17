import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getAdminProviders } from '@/server/db/admin';
import { VerificationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin']);

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const verificationStatusParam = searchParams.get('verificationStatus');
    const isActiveParam = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let verificationStatus: VerificationStatus | undefined;
    if (
      verificationStatusParam &&
      Object.values(VerificationStatus).includes(verificationStatusParam as VerificationStatus)
    ) {
      verificationStatus = verificationStatusParam as VerificationStatus;
    }

    let isActive: boolean | undefined;
    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '') {
      isActive = isActiveParam === 'true';
    }

    const data = await getAdminProviders({
      search,
      verificationStatus,
      isActive,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('Error fetching admin providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
