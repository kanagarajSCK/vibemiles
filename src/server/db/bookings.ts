import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  BookingStatus,
  PaymentStatus,
  ListingStatus,
  ApprovalStatus,
  NotificationType,
  type Booking as PrismaBooking,
  type TravelerDetail as PrismaTravelerDetail,
  type BookingAddon as PrismaBookingAddon,
  type Payment as PrismaPayment,
} from '@prisma/client';
import { getPlatformCommissionRate } from '@/server/payments/razorpay';
import { calculateCancellationRefund } from '@/server/db/payments';
import { createNotificationInDb } from '@/server/db/notifications';
import type { Booking, PaymentStatus as DomainPaymentStatus, BookingStatus as DomainBookingStatus } from '@/types';

export interface FullPrismaBooking extends PrismaBooking {
  package?: {
    id: string;
    name: string;
    slug: string;
    images?: { url: string }[];
  } | null;
  provider?: {
    id: string;
    businessName: string;
    userId?: string;
  } | null;
  customer?: {
    id: string;
    fullName: string;
    userId?: string;
    user?: {
      email: string;
      phone: string | null;
    } | null;
  } | null;
  travelerDetails?: PrismaTravelerDetail[];
  optionalServices?: PrismaBookingAddon[];
  payments?: PrismaPayment[];
}

export const BOOKING_DEFAULT_INCLUDES = {
  package: {
    select: {
      id: true,
      name: true,
      slug: true,
      images: {
        where: { isCover: true },
        take: 1,
        select: { url: true },
      },
    },
  },
  provider: {
    select: {
      id: true,
      businessName: true,
      userId: true,
    },
  },
  customer: {
    select: {
      id: true,
      fullName: true,
      userId: true,
      user: {
        select: {
          email: true,
          phone: true,
        },
      },
    },
  },
  travelerDetails: true,
  optionalServices: true,
  payments: true,
};

export function mapPrismaBookingToDomain(b: FullPrismaBooking): Booking {
  const coverImage =
    b.package?.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
  const latestPayment = b.payments?.[0];

  return {
    id: b.id,
    bookingRef: b.bookingRef,
    packageId: b.packageId,
    packageName: b.package?.name || 'VibeMiles Tour Package',
    packageImage: coverImage,
    customerId: b.customerId,
    customerName: b.contactName || b.customer?.fullName || 'Traveler',
    customerEmail: b.contactEmail || b.customer?.user?.email || '',
    customerPhone: b.contactPhone || b.customer?.user?.phone || '',
    providerId: b.providerId,
    providerName: b.provider?.businessName || 'Verified Host',
    travelDate: b.travelDate instanceof Date ? b.travelDate.toISOString().split('T')[0] : String(b.travelDate),
    travelers: {
      adults: b.adults,
      children: b.children,
    },
    travelerDetails: (b.travelerDetails || []).map((t) => ({
      firstName: t.firstName,
      lastName: t.lastName,
      age: t.age,
      gender: t.gender.toLowerCase() as 'male' | 'female' | 'other',
      idType: t.idType?.toLowerCase() as 'aadhaar' | 'passport' | 'driving_license' | undefined,
      idNumber: t.idNumber ?? undefined,
    })),
    optionalServices: (b.optionalServices || []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || '',
      price: s.price,
      isSelected: true,
    })),
    pickup: b.pickup ?? undefined,
    baseAmount: b.baseAmount,
    optionalServicesAmount: b.optionalServicesAmount,
    discountAmount: b.discountAmount,
    couponCode: b.couponCode ?? undefined,
    taxAmount: b.taxAmount,
    totalAmount: b.totalAmount,
    paymentStatus: (latestPayment?.status.toLowerCase() as DomainPaymentStatus) || 'pending',
    paymentMethod: latestPayment?.paymentMethod ?? undefined,
    transactionId: latestPayment?.transactionId ?? undefined,
    bookingStatus: b.bookingStatus.toLowerCase() as DomainBookingStatus,
    availabilityId: b.availabilityId ?? undefined,
    contactName: b.contactName ?? undefined,
    contactEmail: b.contactEmail ?? undefined,
    contactPhone: b.contactPhone ?? undefined,
    commissionRate: b.commissionRate,
    commissionAmount: b.commissionAmount,
    providerAmount: b.providerAmount,
    isCapacityRestored: b.isCapacityRestored,
    idempotencyKey: b.idempotencyKey ?? undefined,
    cancelledAt: b.cancelledAt instanceof Date ? b.cancelledAt.toISOString() : undefined,
    expiresAt: b.expiresAt instanceof Date ? b.expiresAt.toISOString() : undefined,
    cancellationReason: b.cancellationReason ?? undefined,
    refundAmount: b.refundAmount ?? undefined,
    refundStatus: (b.refundStatus?.toLowerCase() as 'pending' | 'processed' | undefined) ?? undefined,
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : String(b.createdAt),
    updatedAt: b.updatedAt instanceof Date ? b.updatedAt.toISOString() : String(b.updatedAt),
  };
}

export interface CreateBookingParams {
  customerId: string; // CustomerProfile ID or User ID
  packageId: string;
  availabilityId?: string;
  travelDate: string; // 'YYYY-MM-DD'
  adults: number;
  children?: number;
  travelerDetails: Array<{
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    idType?: string;
    idNumber?: string;
  }>;
  optionalServices?: Array<{
    name: string;
    description?: string;
    price?: number;
  }>;
  pickup?: string;
  couponCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  paymentMethod?: string;
  idempotencyKey?: string;
}

/**
 * Creates a booking transactionally with strict availability, capacity, and server-side pricing verification.
 */
export async function createBookingInDb(params: CreateBookingParams): Promise<Booking> {
  // 1. Idempotency Check
  if (params.idempotencyKey && params.idempotencyKey.trim()) {
    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey: params.idempotencyKey.trim() },
      include: BOOKING_DEFAULT_INCLUDES,
    });
    if (existing) {
      return mapPrismaBookingToDomain(existing as unknown as FullPrismaBooking);
    }
  }

  if (!params.customerId || !params.customerId.trim()) {
    throw new Error('Customer account identifier is required.');
  }

  // 2. Resolve Customer Profile
  let customer = await prisma.customerProfile.findFirst({
    where: {
      OR: [{ id: params.customerId }, { userId: params.customerId }],
    },
    include: { user: true },
  });

  if (!customer) {
    const user = await prisma.user.findUnique({ where: { id: params.customerId } });
    if (user) {
      customer = await prisma.customerProfile.create({
        data: {
          userId: user.id,
          fullName: params.contactName || user.phone || user.email.split('@')[0] || 'Traveler',
        },
        include: { user: true },
      });
    } else {
      throw new Error('Customer account not found.');
    }
  }

  // Prevent suspended or blocked accounts from booking
  if (customer.isBlocked || customer.user.status === 'SUSPENDED') {
    throw new Error(
      `This account has been suspended from placing new bookings. ${customer.suspensionReason ? `Reason: ${customer.suspensionReason}` : ''}`
    );
  }

  // 3. Concurrency-safe interactive transaction
  return await prisma.$transaction(
    async (tx) => {
      // A. Validate Package
      const pkg = await tx.package.findUnique({
        where: { id: params.packageId },
        include: { provider: true },
      });

    if (!pkg) {
      throw new Error('Package not found.');
    }

    if (
      pkg.status !== ListingStatus.PUBLISHED ||
      pkg.approvalStatus !== ApprovalStatus.APPROVED ||
      !pkg.isActive
    ) {
      throw new Error('This travel package is not currently published or available for booking.');
    }

    // B. Validate Travelers Count
    const adults = Math.max(0, Math.floor(params.adults || 0));
    const children = Math.max(0, Math.floor(params.children || 0));
    const totalTravelers = adults + children;

    if (adults < 1) {
      throw new Error('At least 1 adult traveler is required.');
    }

    if (totalTravelers > pkg.maxGroupSize) {
      throw new Error(
        `Total travelers (${totalTravelers}) exceeds the maximum group size (${pkg.maxGroupSize}) for this tour.`
      );
    }

    if (!params.travelerDetails || params.travelerDetails.length !== totalTravelers) {
      throw new Error(
        `Please provide details for all ${totalTravelers} traveler(s) (received ${params.travelerDetails?.length || 0}).`
      );
    }

    // C. Validate Availability & Dates
    const travelDateObj = new Date(params.travelDate);
    if (isNaN(travelDateObj.getTime())) {
      throw new Error('Invalid departure travel date format.');
    }

    const dayStart = new Date(travelDateObj);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(travelDateObj);
    dayEnd.setUTCHours(23, 59, 59, 999);

    let availability = null;
    if (params.availabilityId) {
      availability = await tx.packageAvailability.findUnique({
        where: { id: params.availabilityId },
      });
      if (!availability || availability.packageId !== pkg.id) {
        throw new Error('The selected departure slot does not belong to this package.');
      }
    } else {
      availability = await tx.packageAvailability.findFirst({
        where: {
          packageId: pkg.id,
          date: { gte: dayStart, lte: dayEnd },
        },
      });
    }

    if (!availability) {
      throw new Error('No scheduled departure found for this date. Please choose an available departure slot.');
    }

    if (!availability.isAvailable) {
      throw new Error('This departure date is currently marked unavailable.');
    }

    // D. Capacity Calculation
    // Find active reserved bookings holding capacity
    const activeBookings = await tx.booking.findMany({
      where: {
        packageId: pkg.id,
        travelDate: { gte: dayStart, lte: dayEnd },
        bookingStatus: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        OR: [
          { bookingStatus: BookingStatus.CONFIRMED },
          {
            bookingStatus: BookingStatus.PENDING,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        ],
      },
      select: { adults: true, children: true },
    });

    const activeReservedSeats = activeBookings.reduce((sum, b) => sum + b.adults + b.children, 0);
    const remainingCapacity = availability.capacity - activeReservedSeats;

    if (totalTravelers > remainingCapacity) {
      throw new Error(
        `Insufficient capacity. Only ${Math.max(0, remainingCapacity)} seat(s) remain for this departure.`
      );
    }

    // E. Server-Side Price Calculation (Never Trust Client Prices)
    const pricePerPerson =
      availability.price && availability.price > 0 ? availability.price : pkg.finalPrice;
    const baseAmount = Math.round((pricePerPerson * adults + pricePerPerson * children * 0.75) * 100) / 100;

    const standardAddonPrices: Record<string, number> = {
      Insurance: 499 * adults,
      'Airport Pickup': 1499,
      'Candlelight Dinner': 2999,
    };

    let optionalServicesAmount = 0;
    const addonsToCreate: Array<{ name: string; description: string; price: number }> = [];

    if (params.optionalServices && Array.isArray(params.optionalServices)) {
      for (const addon of params.optionalServices) {
        const validatedPrice = standardAddonPrices[addon.name] ?? Math.max(0, addon.price || 0);
        optionalServicesAmount += validatedPrice;
        addonsToCreate.push({
          name: addon.name,
          description: addon.description || '',
          price: validatedPrice,
        });
      }
    }
    optionalServicesAmount = Math.round(optionalServicesAmount * 100) / 100;

    // F. Server-Side Coupon Verification
    let discountAmount = 0;
    let appliedCouponCode: string | undefined = undefined;

    if (params.couponCode && params.couponCode.trim()) {
      const code = params.couponCode.trim().toUpperCase();
      const coupon = await tx.coupon.findUnique({ where: { code } });
      const now = new Date();

      if (
        !coupon ||
        !coupon.isActive ||
        coupon.validFrom > now ||
        coupon.expiresAt < now ||
        (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) ||
        baseAmount < coupon.minimumOrderAmount
      ) {
        throw new Error('The promotional coupon is invalid, expired, or does not meet minimum order rules.');
      }

      if (coupon.discountType === 'PERCENTAGE') {
        const rawDiscount = (baseAmount * coupon.discountValue) / 100;
        discountAmount = coupon.maximumDiscountAmount
          ? Math.min(rawDiscount, coupon.maximumDiscountAmount)
          : rawDiscount;
      } else {
        discountAmount = Math.min(coupon.discountValue, baseAmount);
      }
      discountAmount = Math.round(discountAmount * 100) / 100;
      appliedCouponCode = coupon.code;

      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    const subtotal = Math.max(0, baseAmount + optionalServicesAmount - discountAmount);
    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    // Platform Commission & Provider Payable Calculations (Phase 7)
    const commissionRate = getPlatformCommissionRate();
    const commissionAmount = Math.round(subtotal * (commissionRate / 100) * 100) / 100;
    const providerAmount = Math.round((subtotal - commissionAmount) * 100) / 100;

    // G. Generate Non-guessable Unique Reference
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const bookingRef = `VM-${datePart}-${randomHex}`;

    // 15-minute temporary hold window
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // H. Create Booking
    const newBooking = await tx.booking.create({
      data: {
        bookingRef,
        packageId: pkg.id,
        providerId: pkg.providerId,
        customerId: customer.id,
        availabilityId: availability.id,
        travelDate: availability.date,
        adults,
        children,
        pickup: params.pickup?.trim() || null,
        contactName: params.contactName?.trim() || customer.fullName,
        contactEmail: params.contactEmail?.trim() || customer.user.email,
        contactPhone: params.contactPhone?.trim() || customer.user.phone || null,
        baseAmount,
        optionalServicesAmount,
        discountAmount,
        couponCode: appliedCouponCode || null,
        taxAmount,
        totalAmount,
        commissionRate,
        commissionAmount,
        providerAmount,
        isCapacityRestored: false,
        bookingStatus: BookingStatus.PENDING,
        idempotencyKey: params.idempotencyKey?.trim() || null,
        expiresAt,
        travelerDetails: {
          create: params.travelerDetails.map((t) => ({
            firstName: t.firstName.trim(),
            lastName: t.lastName.trim(),
            age: t.age,
            gender: t.gender.toUpperCase(),
            idType: t.idType?.toUpperCase() || null,
            idNumber: t.idNumber?.trim() || null,
          })),
        },
        optionalServices: {
          create: addonsToCreate,
        },
        settlement: {
          create: {
            providerId: pkg.providerId,
            grossAmount: totalAmount,
            taxAmount,
            commissionRate,
            commissionAmount,
            providerAmount,
            status: 'PENDING',
          },
        },
        payments: {
          create: {
            transactionId: `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            paymentMethod: params.paymentMethod || 'upi',
            amount: totalAmount,
            status: PaymentStatus.PENDING,
          },
        },
      },
      include: BOOKING_DEFAULT_INCLUDES,
    });

    // I. Atomic Capacity Reservation with Concurrency Protection (Prevents Overbooking)
    const affected = await tx.$executeRaw`
      UPDATE "PackageAvailability"
      SET "bookedCount" = "bookedCount" + ${totalTravelers},
          "isAvailable" = ("bookedCount" + ${totalTravelers} < "capacity"),
          "updatedAt" = NOW()
      WHERE "id" = ${availability.id}
        AND ("capacity" - "bookedCount") >= ${totalTravelers}
    `;

    if (affected === 0) {
      throw new Error(
        `Insufficient capacity. Another traveler just reserved the remaining seat(s) for this departure.`
      );
    }

    // J. Increment package bookingCount
    await tx.package.update({
      where: { id: pkg.id },
      data: { bookingCount: { increment: 1 } },
    });

    return mapPrismaBookingToDomain(newBooking as unknown as FullPrismaBooking);
  },
  {
    maxWait: 10000,
    timeout: 25000,
  });
}

/**
 * Retrieves a booking by ID or reference, optionally enforcing ownership check.
 */
export async function getBookingByIdOrRef(
  idOrRef: string,
  viewerUserId?: string,
  viewerRole?: string
): Promise<Booking | null> {
  try {
    const record = await prisma.booking.findFirst({
      where: {
        OR: [{ bookingRef: idOrRef }, { id: idOrRef }],
      },
      include: BOOKING_DEFAULT_INCLUDES,
    });

    if (!record) return null;

    // Active server-side hold window expiry enforcement
    if (
      record.bookingStatus === BookingStatus.PENDING &&
      record.expiresAt &&
      record.expiresAt < new Date() &&
      !record.payments.some((p) => p.status === PaymentStatus.PAID)
    ) {
      await expireUnpaidBookingInDb(record.id);
      const refreshed = await prisma.booking.findUnique({
        where: { id: record.id },
        include: BOOKING_DEFAULT_INCLUDES,
      });
      if (refreshed) {
        return mapPrismaBookingToDomain(refreshed as unknown as FullPrismaBooking);
      }
    }

    // Enforce ownership if viewer credentials are provided
    if (viewerUserId && viewerRole !== 'admin') {
      const isCustomerOwner =
        record.customerId === viewerUserId || record.customer?.userId === viewerUserId;
      const isProviderOwner =
        record.providerId === viewerUserId || record.provider?.userId === viewerUserId;

      if (viewerRole === 'customer' && !isCustomerOwner) {
        return null;
      }
      if (viewerRole === 'provider' && !isProviderOwner) {
        return null;
      }
    }

    return mapPrismaBookingToDomain(record as unknown as FullPrismaBooking);
  } catch (error) {
    console.error(`[db/bookings] getBookingByIdOrRef failed for ${idOrRef}:`, error);
    return null;
  }
}

/**
 * Retrieves all bookings for a given customer, optionally filtered by status category.
 */
export async function getBookingsForCustomer(
  customerIdOrUserId: string,
  filter?: 'all' | 'upcoming' | 'completed' | 'cancelled'
): Promise<Booking[]> {
  try {
    const whereClause: Record<string, unknown> = {
      OR: [{ customerId: customerIdOrUserId }, { customer: { userId: customerIdOrUserId } }],
    };

    if (filter === 'upcoming') {
      whereClause.bookingStatus = { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] };
    } else if (filter === 'completed') {
      whereClause.bookingStatus = BookingStatus.COMPLETED;
    } else if (filter === 'cancelled') {
      whereClause.bookingStatus = BookingStatus.CANCELLED;
    }

    const records = await prisma.booking.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: BOOKING_DEFAULT_INCLUDES,
    });

    return records.map((r) => mapPrismaBookingToDomain(r as unknown as FullPrismaBooking));
  } catch (error) {
    console.error(`[db/bookings] getBookingsForCustomer failed for ${customerIdOrUserId}:`, error);
    return [];
  }
}

/**
 * Retrieves all bookings for a given provider.
 */
export async function getBookingsForProvider(providerIdOrUserId: string): Promise<Booking[]> {
  try {
    const records = await prisma.booking.findMany({
      where: {
        OR: [{ providerId: providerIdOrUserId }, { provider: { userId: providerIdOrUserId } }],
      },
      orderBy: { createdAt: 'desc' },
      include: BOOKING_DEFAULT_INCLUDES,
    });

    return records.map((r) => mapPrismaBookingToDomain(r as unknown as FullPrismaBooking));
  } catch (error) {
    console.error(`[db/bookings] getBookingsForProvider failed for ${providerIdOrUserId}:`, error);
    return [];
  }
}

/**
 * Retrieves all bookings across the platform for admin audit log.
 */
export async function getAllBookingsForAdmin(): Promise<Booking[]> {
  try {
    const records = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: BOOKING_DEFAULT_INCLUDES,
    });

    return records.map((r) => mapPrismaBookingToDomain(r as unknown as FullPrismaBooking));
  } catch (error) {
    console.error('[db/bookings] getAllBookingsForAdmin failed:', error);
    return [];
  }
}

/**
 * Cancels a booking, restoring capacity on the departure date.
 */
export async function cancelBookingInDb(
  bookingIdOrRef: string,
  userId: string,
  userRole: string,
  reason: string
): Promise<Booking> {
  const existing = await prisma.booking.findFirst({
    where: {
      OR: [{ id: bookingIdOrRef }, { bookingRef: bookingIdOrRef }],
    },
    include: {
      customer: true,
      provider: true,
      payments: true,
    },
  });

  if (!existing) {
    throw new Error('Booking not found.');
  }

  // Authorization check
  if (userRole !== 'admin') {
    const isCustomer = existing.customerId === userId || existing.customer?.userId === userId;
    const isProvider = existing.providerId === userId || existing.provider?.userId === userId;
    if (!isCustomer && !isProvider) {
      throw new Error('You are not authorized to cancel this reservation.');
    }
  }

  // Lifecycle check
  if (existing.bookingStatus === BookingStatus.CANCELLED) {
    throw new Error('This booking is already cancelled.');
  }

  if (existing.bookingStatus === BookingStatus.COMPLETED) {
    throw new Error('Completed trips cannot be cancelled.');
  }

  const cancelledBooking = await prisma.$transaction(
    async (tx) => {
      const totalTravelers = existing.adults + existing.children;

      // Release capacity if linked to an availability record and not already restored
      if (!existing.isCapacityRestored && existing.availabilityId) {
        const avail = await tx.packageAvailability.findUnique({
          where: { id: existing.availabilityId },
        });
        if (avail) {
          const newBookedCount = Math.max(0, avail.bookedCount - totalTravelers);
          await tx.packageAvailability.update({
            where: { id: avail.id },
            data: {
              bookedCount: newBookedCount,
              isAvailable: newBookedCount < avail.capacity,
            },
          });
        }
        await tx.package.update({
          where: { id: existing.packageId },
          data: { bookingCount: { decrement: 1 } },
        });
      }

      const hasPaidPayment = existing.payments.some((p) => p.status === PaymentStatus.PAID);
      let eligibleRefund = 0;
      let refundStatusStr = 'not_applicable';

      if (hasPaidPayment) {
        const refundCalc = calculateCancellationRefund({
          travelDate: existing.travelDate,
          totalAmount: existing.totalAmount,
        });
        eligibleRefund = refundCalc.eligibleRefundAmount;
        refundStatusStr = eligibleRefund > 0 ? 'pending' : 'non_refundable';
      }

      const updated = await tx.booking.update({
        where: { id: existing.id },
        data: {
          bookingStatus: BookingStatus.CANCELLED,
          cancellationReason: reason.trim() || 'Customer requested cancellation',
          cancelledAt: new Date(),
          refundAmount: eligibleRefund,
          refundStatus: refundStatusStr,
          isCapacityRestored: true,
        },
        include: BOOKING_DEFAULT_INCLUDES,
      });

      await tx.settlementLedger.updateMany({
        where: { bookingId: existing.id },
        data: { status: 'CANCELLED', providerAmount: 0 },
      });

      return mapPrismaBookingToDomain(updated as unknown as FullPrismaBooking);
    },
    {
      maxWait: 10000,
      timeout: 25000,
    }
  );

  // Dispatch In-App Notifications (Asynchronous, Non-blocking, Idempotent)
  if (cancelledBooking) {
    (async () => {
      try {
        const custProfile = await prisma.customerProfile.findUnique({
          where: { id: cancelledBooking.customerId },
          select: { userId: true },
        });
        if (custProfile?.userId) {
          await createNotificationInDb({
            userId: custProfile.userId,
            type: NotificationType.BOOKING_CANCELLED,
            title: 'Booking Cancelled',
            message: `Your booking ${cancelledBooking.bookingRef} (${cancelledBooking.packageName}) has been cancelled.`,
            link: '/account/cancelled',
            dedupKey: `notif:cust_cancel:${cancelledBooking.id}`,
            metadata: {
              bookingRef: cancelledBooking.bookingRef,
              refundAmount: cancelledBooking.refundAmount,
            },
          });
        }

        const provProfile = await prisma.providerProfile.findUnique({
          where: { id: cancelledBooking.providerId },
          select: { userId: true },
        });
        if (provProfile?.userId) {
          await createNotificationInDb({
            userId: provProfile.userId,
            type: NotificationType.BOOKING_CANCELLED,
            title: 'Booking Cancelled by Customer',
            message: `Booking ${cancelledBooking.bookingRef} for ${cancelledBooking.packageName} was cancelled. Capacity restored.`,
            link: '/provider/bookings',
            dedupKey: `notif:prov_cancel:${cancelledBooking.id}`,
            metadata: {
              bookingRef: cancelledBooking.bookingRef,
            },
          });
        }
      } catch (notifErr) {
        console.error('[Notification] Error dispatching cancellation notification:', notifErr);
      }
    })();
  }

  return cancelledBooking;
}

/**
 * Actively expires an unpaid booking whose hold window has elapsed.
 * Safely releases capacity once without prematurely cancelling bookings currently being paid.
 */
export async function expireUnpaidBookingInDb(bookingId: string): Promise<boolean> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payments: { orderBy: { createdAt: 'desc' } } },
  });

  if (!booking) return false;
  if (booking.bookingStatus !== BookingStatus.PENDING) return false;
  if (!booking.expiresAt || booking.expiresAt >= new Date()) return false;

  const isPaid = booking.payments.some((p) => p.status === PaymentStatus.PAID);
  if (isPaid) return false;

  await prisma.$transaction(
    async (tx) => {
      if (!booking.isCapacityRestored && booking.availabilityId) {
        const totalTravelers = booking.adults + booking.children;
        const avail = await tx.packageAvailability.findUnique({
          where: { id: booking.availabilityId },
        });
        if (avail) {
          const newBookedCount = Math.max(0, avail.bookedCount - totalTravelers);
          await tx.packageAvailability.update({
            where: { id: avail.id },
            data: {
              bookedCount: newBookedCount,
              isAvailable: newBookedCount < avail.capacity,
            },
          });
        }
        await tx.package.update({
          where: { id: booking.packageId },
          data: { bookingCount: { decrement: 1 } },
        });
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          bookingStatus: BookingStatus.CANCELLED,
          cancellationReason: 'Payment window expired (15 minutes hold elapsed)',
          cancelledAt: new Date(),
          isCapacityRestored: true,
          refundAmount: 0,
          refundStatus: 'not_applicable',
        },
      });

      const pendingPayment = booking.payments.find((p) => p.status === PaymentStatus.PENDING);
      if (pendingPayment) {
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: 'Reservation hold window expired without payment completion',
          },
        });
      }

      await tx.settlementLedger.updateMany({
        where: { bookingId: booking.id },
        data: { status: 'CANCELLED', providerAmount: 0 },
      });
    },
    { maxWait: 10000, timeout: 25000 }
  );

  return true;
}

/**
 * Periodically sweeps all expired pending bookings across the platform.
 */
export async function sweepExpiredBookingsInDb(): Promise<number> {
  const now = new Date();
  const expiredBookings = await prisma.booking.findMany({
    where: {
      bookingStatus: BookingStatus.PENDING,
      expiresAt: { lt: now },
      payments: {
        none: { status: PaymentStatus.PAID },
      },
    },
    select: { id: true },
    take: 50,
  });

  let count = 0;
  for (const b of expiredBookings) {
    const expired = await expireUnpaidBookingInDb(b.id);
    if (expired) count++;
  }
  return count;
}

/**
 * Transitions booking state adhering to strict business lifecycle rules.
 */
export async function updateBookingStatusInDb(
  bookingId: string,
  newStatus: BookingStatus,
  userId: string,
  userRole: string
): Promise<Booking> {
  const existing = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true, provider: true },
  });

  if (!existing) {
    throw new Error('Booking not found.');
  }

  // Only admin or the package provider can update status directly
  if (userRole !== 'admin') {
    const isProvider = existing.providerId === userId || existing.provider?.userId === userId;
    if (!isProvider) {
      throw new Error('Access denied: insufficient permissions to update booking status.');
    }
  }

  const current = existing.bookingStatus;

  // Enforce valid transitions
  const validTransitions: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.REJECTED],
    [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    [BookingStatus.COMPLETED]: [], // terminal
    [BookingStatus.CANCELLED]: [], // terminal
    [BookingStatus.REJECTED]: [], // terminal
  };

  if (!validTransitions[current]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${current} to ${newStatus}.`);
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingStatus: newStatus,
      updatedAt: new Date(),
    },
    include: BOOKING_DEFAULT_INCLUDES,
  });

  return mapPrismaBookingToDomain(updated as unknown as FullPrismaBooking);
}
