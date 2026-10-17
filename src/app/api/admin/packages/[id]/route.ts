import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { prisma } from '@/lib/prisma';
import { mapPrismaPackageToDomain, FullPrismaPackage } from '@/server/db/mappers';
import { adminDeletePackage, adminUpdatePackage } from '@/server/db/packages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(['admin']);
    const { id } = await context.params;

    const record = await prisma.package.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        itinerary: { orderBy: { day: 'asc' } },
        inclusions: true,
        availability: { orderBy: { date: 'asc' } },
        destination: { select: { id: true, name: true, state: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        provider: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            verificationStatus: true,
            isActive: true,
            userId: true,
          },
        },
        _count: {
          select: { bookings: true, reviews: true },
        },
      },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: 'Package listing not found' }, { status: 404 });
    }

    const domainPackage = mapPrismaPackageToDomain(record as unknown as FullPrismaPackage);

    return NextResponse.json({
      success: true,
      data: {
        ...domainPackage,
        bookingsCount: record._count.bookings,
        reviewsCount: record._count.reviews,
        provider: record.provider,
        canPermanentlyDelete: record._count.bookings === 0,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in GET /api/admin/packages/[id]:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve package' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const updated = await adminUpdatePackage({
      adminUser: { id: auth.user.id, email: auth.user.email },
      packageId: id,
      data: body,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in PATCH /api/admin/packages/[id]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update package' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(['admin']);
    const { id } = await context.params;

    const body = await request.json().catch(() => ({}));
    const { permanent = false, reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'A specific reason (minimum 5 characters) is required for deleting a listing.' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const result = await adminDeletePackage({
      adminUser: { id: auth.user.id, email: auth.user.email },
      packageId: id,
      permanent: Boolean(permanent),
      reason: reason.trim(),
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    console.error('API Error in DELETE /api/admin/packages/[id]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete package' },
      { status: 400 }
    );
  }
}
