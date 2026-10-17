import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getAdminCustomers } from '@/server/db/admin';
import { UserStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin']);

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const statusParam = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let status: UserStatus | undefined;
    if (statusParam && Object.values(UserStatus).includes(statusParam as UserStatus)) {
      status = statusParam as UserStatus;
    }

    const data = await getAdminCustomers({ search, status, page, limit });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('Error fetching admin customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
