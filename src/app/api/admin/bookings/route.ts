import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { getAdminBookingsWithFilters } from '@/server/db/admin';
import { BookingStatus, PaymentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['admin']);

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const bookingStatusParam = searchParams.get('bookingStatus') || searchParams.get('status');
    const paymentStatusParam = searchParams.get('paymentStatus');
    const providerId = searchParams.get('providerId') || undefined;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let bookingStatus: BookingStatus | undefined;
    if (
      bookingStatusParam &&
      Object.values(BookingStatus).includes(bookingStatusParam.toUpperCase() as BookingStatus)
    ) {
      bookingStatus = bookingStatusParam.toUpperCase() as BookingStatus;
    }

    let paymentStatus: PaymentStatus | undefined;
    if (
      paymentStatusParam &&
      Object.values(PaymentStatus).includes(paymentStatusParam.toUpperCase() as PaymentStatus)
    ) {
      paymentStatus = paymentStatusParam.toUpperCase() as PaymentStatus;
    }

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const data = await getAdminBookingsWithFilters({
      search,
      bookingStatus,
      paymentStatus,
      providerId,
      startDate,
      endDate,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: data.pagination.total,
      bookings: data.items, // Backward compatibility for existing bookingService
      items: data.items,
      pagination: data.pagination,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to retrieve admin bookings.';
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
