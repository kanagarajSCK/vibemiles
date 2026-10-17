import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getAdminUsers } from '@/server/db/admin';
import { UserRole, UserStatus } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const roleParam = searchParams.get('role');
    const statusParam = searchParams.get('status');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const role = roleParam && Object.values(UserRole).includes(roleParam as UserRole)
      ? (roleParam as UserRole)
      : undefined;

    const status = statusParam && Object.values(UserStatus).includes(statusParam as UserStatus)
      ? (statusParam as UserStatus)
      : undefined;

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const data = await getAdminUsers({
      search,
      role,
      status,
      startDate: isNaN(startDate?.getTime() || NaN) ? undefined : startDate,
      endDate: isNaN(endDate?.getTime() || NaN) ? undefined : endDate,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve users' },
      { status: 500 }
    );
  }
}
