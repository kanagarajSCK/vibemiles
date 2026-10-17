import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getAllPackagesForAdmin } from '@/server/db/packages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/packages
 * Returns all packages across all providers for admin moderation.
 * Query parameters:
 *  - status: DRAFT | PENDING_REVIEW | APPROVED | REJECTED | PUBLISHED | ARCHIVED
 *  - approvalStatus: PENDING | APPROVED | REJECTED
 *  - search: string
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin']);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const approvalStatus = searchParams.get('approvalStatus') || undefined;
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const destinationId = searchParams.get('destinationId') || undefined;
    const providerId = searchParams.get('providerId') || undefined;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const skipParam = searchParams.get('skip');
    const takeParam = searchParams.get('take');

    const skip = skipParam ? parseInt(skipParam, 10) : undefined;
    const take = takeParam ? parseInt(takeParam, 10) : undefined;
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const packages = await getAllPackagesForAdmin({
      status,
      approvalStatus,
      search,
      categoryId,
      destinationId,
      providerId,
      startDate,
      endDate,
      skip: isNaN(skip as number) ? undefined : skip,
      take: isNaN(take as number) ? undefined : take,
    });

    return NextResponse.json({
      success: true,
      count: packages.length,
      packages,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in GET /api/admin/packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve packages for admin' },
      { status: 500 }
    );
  }
}
