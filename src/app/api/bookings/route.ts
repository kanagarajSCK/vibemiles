import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/server/auth/guard';
import {
  createBookingInDb,
  getBookingsForCustomer,
  getBookingsForProvider,
  getAllBookingsForAdmin,
} from '@/server/db/bookings';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();

    if (auth.user.role !== 'customer') {
      return NextResponse.json(
        { error: 'Only registered customers can book travel packages.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.packageId || !body.travelDate) {
      return NextResponse.json(
        { error: 'Package ID and departure travel date are required.' },
        { status: 400 }
      );
    }

    if (!body.adults || body.adults < 1) {
      return NextResponse.json(
        { error: 'At least 1 adult traveler is required.' },
        { status: 400 }
      );
    }

    const booking = await createBookingInDb({
      customerId: auth.user.id,
      packageId: body.packageId,
      availabilityId: body.availabilityId,
      travelDate: body.travelDate,
      adults: Number(body.adults),
      children: Number(body.children || 0),
      travelerDetails: body.travelerDetails || [],
      optionalServices: body.optionalServices || [],
      pickup: body.pickup,
      couponCode: body.couponCode,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      paymentMethod: body.paymentMethod || 'upi',
      idempotencyKey: body.idempotencyKey,
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to create booking.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get('filter') as 'all' | 'upcoming' | 'completed' | 'cancelled') || 'all';

    let bookings = [];

    if (auth.user.role === 'customer') {
      bookings = await getBookingsForCustomer(auth.user.id, filter);
    } else if (auth.user.role === 'provider') {
      bookings = await getBookingsForProvider(auth.user.id);
    } else if (auth.user.role === 'admin') {
      bookings = await getAllBookingsForAdmin();
    } else {
      return NextResponse.json({ error: 'Unauthorized role.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Failed to retrieve bookings.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
