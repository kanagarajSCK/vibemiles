import { prisma } from '@/lib/prisma';
import {
  BookingStatus,
  PaymentStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { createNotificationInDb } from './notifications';
import {
  createRazorpayOrder,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  issueRazorpayRefund,
  getPublicRazorpayKey,
  getPlatformCommissionRate,
} from '@/server/payments/razorpay';
import {
  mapPrismaBookingToDomain,
  BOOKING_DEFAULT_INCLUDES,
  type FullPrismaBooking,
} from '@/server/db/bookings';
import type { Booking } from '@/types';

/**
 * Calculates cancellation policy refund percentage based on days until travel date:
 * - 15+ days: 100% full refund
 * - 7-14 days: 75% refund
 * - 3-6 days: 50% refund
 * - < 3 days: 0% non-refundable
 */
export function calculateCancellationRefund({
  travelDate,
  totalAmount,
  now = new Date(),
}: {
  travelDate: Date;
  totalAmount: number;
  now?: Date;
}): {
  refundPercent: number;
  eligibleRefundAmount: number;
  daysUntilDeparture: number;
} {
  const travelTime = new Date(travelDate).getTime();
  const currentTime = now.getTime();
  const diffDays = Math.ceil((travelTime - currentTime) / (1000 * 60 * 60 * 24));

  let percent = 0;
  if (diffDays >= 15) {
    percent = 100;
  } else if (diffDays >= 7) {
    percent = 75;
  } else if (diffDays >= 3) {
    percent = 50;
  } else {
    percent = 0;
  }

  const eligibleRefundAmount = Math.round(((totalAmount * percent) / 100) * 100) / 100;

  return {
    refundPercent: percent,
    eligibleRefundAmount,
    daysUntilDeparture: Math.max(0, diffDays),
  };
}

/**
 * Creates an authorized payment gateway order for an authenticated customer's booking.
 * Amount is derived exclusively from persisted booking total.
 */
export async function createPaymentOrderForBooking({
  bookingIdOrRef,
  customerId,
  userRole,
}: {
  bookingIdOrRef: string;
  customerId: string;
  userRole?: string;
}): Promise<{
  orderId: string;
  amount: number; // in paise
  amountRupees: number;
  currency: string;
  keyId: string;
  bookingRef: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}> {
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id: bookingIdOrRef }, { bookingRef: bookingIdOrRef }],
    },
    include: {
      customer: { include: { user: true } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  // Enforce customer ownership
  if (userRole !== 'admin') {
    const isOwner =
      booking.customerId === customerId ||
      booking.customer?.userId === customerId ||
      booking.customer?.user?.id === customerId;
    if (!isOwner) {
      throw new Error('You are not authorized to initiate payment for this booking.');
    }
  }

  // Reject payments from suspended or blocked customer accounts
  if (booking.customer?.isBlocked || booking.customer?.user?.status === 'SUSPENDED') {
    throw new Error('This customer account is currently suspended from completing payments. Please contact support.');
  }

  // Reject payments on non-pending or cancelled bookings
  if (booking.bookingStatus === BookingStatus.CANCELLED) {
    throw new Error('Cannot pay for a cancelled booking.');
  }

  if (booking.bookingStatus === BookingStatus.COMPLETED) {
    throw new Error('This booking is already completed.');
  }

  const latestPayment = booking.payments[0];
  if (latestPayment?.status === PaymentStatus.PAID) {
    throw new Error('This reservation has already been paid and confirmed.');
  }

  // Enforce hold window expiry
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    throw new Error('Reservation hold time has expired. Please select new departure dates.');
  }

  // Create gateway order
  const order = await createRazorpayOrder({
    amountInRupees: booking.totalAmount,
    receipt: booking.bookingRef,
    notes: {
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      customerId: booking.customerId,
    },
  });

  // Persist order in Payment record
  if (latestPayment && latestPayment.status === PaymentStatus.PENDING) {
    await prisma.payment.update({
      where: { id: latestPayment.id },
      data: {
        gatewayOrderId: order.orderId,
        paymentMethod: 'razorpay',
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        transactionId: `TXN-${Date.now()}-${booking.bookingRef.slice(-4)}`,
        paymentMethod: 'razorpay',
        amount: booking.totalAmount,
        currency: order.currency,
        status: PaymentStatus.PENDING,
        gatewayOrderId: order.orderId,
      },
    });
  }

  return {
    orderId: order.orderId,
    amount: order.amount,
    amountRupees: booking.totalAmount,
    currency: order.currency,
    keyId: getPublicRazorpayKey(),
    bookingRef: booking.bookingRef,
    bookingId: booking.id,
    customerName: booking.contactName || booking.customer?.fullName || 'Traveler',
    customerEmail: booking.contactEmail || booking.customer?.user?.email || '',
    customerPhone: booking.contactPhone || booking.customer?.user?.phone || '',
  };
}

/**
 * Server-side payment verification and booking confirmation.
 * Verifies HMAC SHA256 signature, validates amounts, marks payment PAID and booking CONFIRMED.
 */
export async function verifyPaymentAndConfirmBooking({
  bookingId,
  orderId,
  paymentId,
  signature,
  userId,
  userRole,
}: {
  bookingId: string;
  orderId: string;
  paymentId: string;
  signature: string;
  userId: string;
  userRole?: string;
}): Promise<Booking> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: { include: { user: true } },
      payments: { orderBy: { createdAt: 'desc' } },
      package: true,
      availability: true,
    },
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  // Anti-IDOR: verify ownership
  if (userRole !== 'admin') {
    const isOwner =
      booking.customerId === userId ||
      booking.customer?.userId === userId ||
      booking.customer?.user?.id === userId;
    if (!isOwner) {
      throw new Error('Access denied: unauthorized payment verification attempt.');
    }
  }

  // Cryptographic signature check
  const isValidSignature = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature,
  });

  if (!isValidSignature) {
    throw new Error('Cryptographic signature verification failed. Forged or corrupted payment request.');
  }

  // Interactive transaction for atomic verification and state advancement
  const confirmedBooking = await prisma.$transaction(
    async (tx) => {
      const currentBooking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          payments: { orderBy: { createdAt: 'desc' } },
          availability: true,
          package: true,
          customer: true,
        },
      });

      if (!currentBooking) {
        throw new Error('Booking record unavailable.');
      }

      // Idempotency: if already paid with this gateway reference, return immediately
      const existingPaidPayment = currentBooking.payments.find(
        (p) => p.status === PaymentStatus.PAID && p.gatewayRef === paymentId
      );
      if (existingPaidPayment && currentBooking.bookingStatus === BookingStatus.CONFIRMED) {
        const full = await tx.booking.findUnique({
          where: { id: bookingId },
          include: BOOKING_DEFAULT_INCLUDES,
        });
        return mapPrismaBookingToDomain(full as unknown as FullPrismaBooking);
      }

      // Check if orderId matches pending payment
      const paymentToUpdate = currentBooking.payments.find(
        (p) => p.gatewayOrderId === orderId || p.status === PaymentStatus.PENDING
      );

      if (paymentToUpdate) {
        await tx.payment.update({
          where: { id: paymentToUpdate.id },
          data: {
            status: PaymentStatus.PAID,
            gatewayRef: paymentId,
            gatewayOrderId: orderId,
            gatewaySignature: signature,
            paidAt: new Date(),
          },
        });
      } else {
        await tx.payment.create({
          data: {
            bookingId: currentBooking.id,
            transactionId: `TXN-${Date.now()}-${paymentId.slice(-6)}`,
            paymentMethod: 'razorpay',
            amount: currentBooking.totalAmount,
            currency: 'INR',
            status: PaymentStatus.PAID,
            gatewayRef: paymentId,
            gatewayOrderId: orderId,
            gatewaySignature: signature,
            paidAt: new Date(),
          },
        });
      }

      // Update Booking: Confirm status, clear expiry hold window
      const updatedBooking = await tx.booking.update({
        where: { id: currentBooking.id },
        data: {
          bookingStatus: BookingStatus.CONFIRMED,
          expiresAt: null, // confirmed, hold window removed
          updatedAt: new Date(),
        },
        include: BOOKING_DEFAULT_INCLUDES,
      });

      // Credit customer reward points (1% of booking total)
      if (currentBooking.customerId) {
        const pointsEarned = Math.max(1, Math.floor(currentBooking.totalAmount * 0.01));
        await tx.customerProfile.update({
          where: { id: currentBooking.customerId },
          data: { rewardPoints: { increment: pointsEarned } },
        });
      }

      // Ensure settlement ledger entry exists
      await tx.settlementLedger.upsert({
        where: { bookingId: currentBooking.id },
        create: {
          bookingId: currentBooking.id,
          providerId: currentBooking.providerId,
          grossAmount: currentBooking.totalAmount,
          taxAmount: currentBooking.taxAmount,
          commissionRate: currentBooking.commissionRate,
          commissionAmount: currentBooking.commissionAmount,
          providerAmount: currentBooking.providerAmount,
          status: 'PENDING',
        },
        update: {
          status: 'PENDING',
        },
      });

      return mapPrismaBookingToDomain(updatedBooking as unknown as FullPrismaBooking);
    },
    { maxWait: 10000, timeout: 25000 }
  );

  // Dispatch In-App Notifications (Asynchronous, Non-blocking, Idempotent)
  if (confirmedBooking) {
    (async () => {
      try {
        const customerProfile = await prisma.customerProfile.findUnique({
          where: { id: confirmedBooking.customerId },
          select: { userId: true },
        });
        if (customerProfile?.userId) {
          await createNotificationInDb({
            userId: customerProfile.userId,
            type: NotificationType.PAYMENT_SUCCESS,
            title: 'Payment Successful & Booking Confirmed',
            message: `Your booking ${confirmedBooking.bookingRef} for ${confirmedBooking.packageName} has been confirmed.`,
            link: '/account/bookings',
            dedupKey: `notif:pay_succ:${paymentId}`,
            metadata: {
              bookingRef: confirmedBooking.bookingRef,
              totalAmount: confirmedBooking.totalAmount,
            },
          });
        }

        const providerProfile = await prisma.providerProfile.findUnique({
          where: { id: confirmedBooking.providerId },
          select: { userId: true },
        });
        if (providerProfile?.userId) {
          await createNotificationInDb({
            userId: providerProfile.userId,
            type: NotificationType.BOOKING_CONFIRMED,
            title: 'New Booking & Payment Received',
            message: `Reservation ${confirmedBooking.bookingRef} (${confirmedBooking.packageName}) has been confirmed and paid.`,
            link: '/provider/bookings',
            dedupKey: `notif:prov_book_conf:${paymentId}`,
            metadata: {
              bookingRef: confirmedBooking.bookingRef,
              providerAmount: confirmedBooking.providerAmount,
            },
          });
        }
      } catch (notifErr) {
        console.error('[Notification] Error dispatching payment confirmation notifications:', notifErr);
      }
    })();
  }

  return confirmedBooking;
}

/**
 * Handles verified Razorpay webhook events idempotently.
 */
export async function processRazorpayWebhookEvent({
  rawBody,
  signatureHeader,
}: {
  rawBody: string;
  signatureHeader: string;
}): Promise<{
  success: boolean;
  event: string;
  message: string;
}> {
  const isValid = verifyRazorpayWebhookSignature({
    rawBody,
    signature: signatureHeader,
  });

  if (!isValid) {
    throw new Error('Invalid webhook cryptographic signature. Request rejected.');
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event as string;
  const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity;

  if (!entity) {
    return { success: true, event, message: 'Event ignored: no entity payload.' };
  }

  const orderId = entity.order_id || (event.startsWith('order.') ? entity.id : null);
  const paymentId = entity.id;

  if (event === 'payment.captured' || event === 'order.paid') {
    // Find payment record by orderId or gatewayRef
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { gatewayOrderId: orderId },
          { gatewayRef: paymentId },
        ],
      },
      include: { booking: true },
    });

    if (payment) {
      if (payment.status !== PaymentStatus.PAID) {
        await prisma.$transaction(
          async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: PaymentStatus.PAID,
                gatewayRef: paymentId,
                gatewayOrderId: orderId || payment.gatewayOrderId,
                paidAt: new Date(),
                metadata: payload as unknown as Prisma.InputJsonValue,
              },
            });

            let shouldConfirm = true;
            let overbooked = false;

            if (payment.booking.bookingStatus === BookingStatus.CANCELLED) {
              if (payment.booking.isCapacityRestored && payment.booking.availabilityId) {
                const totalTravelers = payment.booking.adults + payment.booking.children;
                const reacquired = await tx.$executeRaw`
                  UPDATE "PackageAvailability"
                  SET "bookedCount" = "bookedCount" + ${totalTravelers},
                      "isAvailable" = ("bookedCount" + ${totalTravelers} < "capacity"),
                      "updatedAt" = NOW()
                  WHERE "id" = ${payment.booking.availabilityId}
                    AND ("capacity" - "bookedCount") >= ${totalTravelers}
                `;
                if (reacquired > 0) {
                  await tx.package.update({
                    where: { id: payment.booking.packageId },
                    data: { bookingCount: { increment: 1 } },
                  });
                } else {
                  shouldConfirm = false;
                  overbooked = true;
                }
              }
            }

            if (shouldConfirm) {
              await tx.booking.update({
                where: { id: payment.bookingId },
                data: {
                  bookingStatus: BookingStatus.CONFIRMED,
                  expiresAt: null,
                  isCapacityRestored: false,
                  cancelledAt: null,
                  cancellationReason: null,
                },
              });

              await tx.settlementLedger.upsert({
                where: { bookingId: payment.bookingId },
                create: {
                  bookingId: payment.bookingId,
                  providerId: payment.booking.providerId,
                  grossAmount: payment.booking.totalAmount,
                  taxAmount: payment.booking.taxAmount,
                  commissionRate: payment.booking.commissionRate,
                  commissionAmount: payment.booking.commissionAmount,
                  providerAmount: payment.booking.providerAmount,
                  status: 'PENDING',
                },
                update: { status: 'PENDING' },
              });
            } else if (overbooked) {
              await tx.booking.update({
                where: { id: payment.bookingId },
                data: {
                  cancellationReason: 'Payment captured after reservation hold expired and departure is sold out; automated refund required.',
                  refundStatus: 'pending',
                  refundAmount: payment.booking.totalAmount,
                },
              });
            }
          },
          { maxWait: 10000, timeout: 25000 }
        );

        // Dispatch In-App Notifications (Asynchronous, Non-blocking, Idempotent)
        if (payment.booking) {
          const custUser = await prisma.customerProfile.findUnique({
            where: { id: payment.booking.customerId },
            select: { userId: true },
          });
          if (custUser?.userId) {
            await createNotificationInDb({
              userId: custUser.userId,
              type: NotificationType.PAYMENT_SUCCESS,
              title: 'Payment Confirmed',
              message: `Payment of ₹${payment.amount.toLocaleString('en-IN')} confirmed for booking ${payment.booking.bookingRef}.`,
              link: '/account/bookings',
              dedupKey: `notif:webhook_pay_succ:${payment.id}`,
            });
          }
          const provUser = await prisma.providerProfile.findUnique({
            where: { id: payment.booking.providerId },
            select: { userId: true },
          });
          if (provUser?.userId) {
            await createNotificationInDb({
              userId: provUser.userId,
              type: NotificationType.BOOKING_CONFIRMED,
              title: 'New Booking & Payment Received',
              message: `Reservation ${payment.booking.bookingRef} confirmed via payment gateway webhook.`,
              link: '/provider/bookings',
              dedupKey: `notif:webhook_prov_conf:${payment.id}`,
            });
          }
        }
      }
      return { success: true, event, message: 'Payment successfully captured via webhook.' };
    }
  } else if (event === 'payment.failed') {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { gatewayOrderId: orderId },
          { gatewayRef: paymentId },
        ],
      },
    });

    if (payment && payment.status !== PaymentStatus.PAID) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: entity.error_description || 'Payment rejected by gateway',
          metadata: payload as unknown as Prisma.InputJsonValue,
        },
      });

      // Notify customer of payment failure
      if (payment.bookingId) {
        const bk = await prisma.booking.findUnique({
          where: { id: payment.bookingId },
          select: { bookingRef: true, customerId: true },
        });
        if (bk) {
          const custUser = await prisma.customerProfile.findUnique({
            where: { id: bk.customerId },
            select: { userId: true },
          });
          if (custUser?.userId) {
            await createNotificationInDb({
              userId: custUser.userId,
              type: NotificationType.PAYMENT_FAILED,
              title: 'Payment Processing Failed',
              message: `Payment of ₹${payment.amount.toLocaleString('en-IN')} for booking ${bk.bookingRef} failed: ${entity.error_description || 'Gateway declined the transaction'}.`,
              link: `/account/bookings`,
              dedupKey: `notif:pay_fail:${payment.id}`,
            });
          }
        }
      }

      return { success: true, event, message: 'Recorded payment failure.' };
    }
  }

  return { success: true, event, message: 'Webhook processed without action required.' };
}

/**
 * Processes a refund for a booking according to cancellation policy.
 * Interacts with Razorpay Refund API if payment was PAID, updates ledger, and restores capacity.
 */
export async function processRefundForBooking({
  bookingIdOrRef,
  requestedByUserId,
  userRole,
  reason,
}: {
  bookingIdOrRef: string;
  requestedByUserId: string;
  userRole: string;
  reason?: string;
}): Promise<{
  booking: Booking;
  refundAmount: number;
  refundStatus: string;
  gatewayRefundId?: string;
}> {
  const existing = await prisma.booking.findFirst({
    where: {
      OR: [{ id: bookingIdOrRef }, { bookingRef: bookingIdOrRef }],
    },
    include: {
      customer: true,
      provider: true,
      payments: { orderBy: { createdAt: 'desc' } },
      refunds: true,
      availability: true,
      package: true,
    },
  });

  if (!existing) {
    throw new Error('Booking not found.');
  }

  // Authorization check: Admin or owning Customer
  if (userRole !== 'admin') {
    const isCustomer =
      existing.customerId === requestedByUserId ||
      existing.customer?.userId === requestedByUserId;
    if (!isCustomer) {
      throw new Error('You are not authorized to request or process a refund for this booking.');
    }
  }

  // Duplicate refund prevention
  if (existing.refundStatus === 'processed' || existing.refundStatus === 'PROCESSED') {
    throw new Error('A refund has already been processed for this reservation.');
  }

  const latestPayment = existing.payments[0];
  const isPaid = latestPayment?.status === PaymentStatus.PAID;

  let eligibleRefund = 0;
  let gatewayRefundId: string | undefined = undefined;

  if (isPaid) {
    const refundCalculation = calculateCancellationRefund({
      travelDate: existing.travelDate,
      totalAmount: existing.totalAmount,
    });
    eligibleRefund = refundCalculation.eligibleRefundAmount;

    if (eligibleRefund > 0 && latestPayment.gatewayRef) {
      const refundResult = await issueRazorpayRefund({
        paymentId: latestPayment.gatewayRef,
        amountInRupees: eligibleRefund,
        notes: {
          bookingId: existing.id,
          bookingRef: existing.bookingRef,
          reason: reason || 'Traveler requested cancellation',
        },
      });
      gatewayRefundId = refundResult.refundId;
    }
  }

  // Execute database updates inside transaction
  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Capacity restoration: ensure it only restores capacity once!
      if (!existing.isCapacityRestored && existing.availabilityId) {
        const avail = await tx.packageAvailability.findUnique({
          where: { id: existing.availabilityId },
        });
        if (avail) {
          const totalTravelers = existing.adults + existing.children;
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

      // 2. Persist Refund Record
      if (eligibleRefund > 0) {
        await tx.refund.create({
          data: {
            bookingId: existing.id,
            paymentId: latestPayment?.id,
            gatewayRefundId,
            amount: eligibleRefund,
            currency: 'INR',
            status: 'PROCESSED',
            reason: reason || 'Booking cancellation refund',
            initiatedBy: requestedByUserId,
            processedAt: new Date(),
          },
        });
      }

      // 3. Update Payment record
      if (latestPayment) {
        await tx.payment.update({
          where: { id: latestPayment.id },
          data: {
            refundId: gatewayRefundId,
            refundAmount: eligibleRefund,
            refundStatus: 'PROCESSED',
            status:
              eligibleRefund >= existing.totalAmount
                ? PaymentStatus.REFUNDED
                : eligibleRefund > 0
                ? PaymentStatus.PARTIALLY_REFUNDED
                : latestPayment.status,
          },
        });
      }

      // 4. Update Booking
      const updatedBooking = await tx.booking.update({
        where: { id: existing.id },
        data: {
          bookingStatus: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason || 'Cancelled with refund processed',
          refundAmount: eligibleRefund,
          refundStatus: 'processed',
          isCapacityRestored: true,
        },
        include: BOOKING_DEFAULT_INCLUDES,
      });

      // 5. Update Settlement Ledger to CANCELLED
      await tx.settlementLedger.upsert({
        where: { bookingId: existing.id },
        create: {
          bookingId: existing.id,
          providerId: existing.providerId,
          grossAmount: existing.totalAmount,
          taxAmount: existing.taxAmount,
          commissionRate: existing.commissionRate,
          commissionAmount: existing.commissionAmount,
          providerAmount: 0,
          status: 'CANCELLED',
        },
        update: {
          status: 'CANCELLED',
          providerAmount: 0,
        },
      });

      return {
        booking: mapPrismaBookingToDomain(updatedBooking as unknown as FullPrismaBooking),
        refundAmount: eligibleRefund,
        refundStatus: 'processed',
        gatewayRefundId,
      };
    },
    { maxWait: 10000, timeout: 25000 }
  );

  // Dispatch In-App Notifications (Asynchronous, Non-blocking, Idempotent)
  if (result.booking) {
    (async () => {
      try {
        const custProfile = await prisma.customerProfile.findUnique({
          where: { id: result.booking.customerId },
          select: { userId: true },
        });
        if (custProfile?.userId) {
          await createNotificationInDb({
            userId: custProfile.userId,
            type: NotificationType.REFUND_PROCESSED,
            title: 'Refund Processed',
            message: `A refund of ₹${result.refundAmount.toLocaleString('en-IN')} has been processed for booking ${result.booking.bookingRef}.`,
            link: '/account/cancelled',
            dedupKey: `notif:refund_cust:${result.booking.id}`,
            metadata: {
              bookingRef: result.booking.bookingRef,
              refundAmount: result.refundAmount,
            },
          });
        }

        const provProfile = await prisma.providerProfile.findUnique({
          where: { id: result.booking.providerId },
          select: { userId: true },
        });
        if (provProfile?.userId) {
          await createNotificationInDb({
            userId: provProfile.userId,
            type: NotificationType.BOOKING_CANCELLED,
            title: 'Booking Cancelled',
            message: `Booking ${result.booking.bookingRef} has been cancelled.`,
            link: '/provider/bookings',
            dedupKey: `notif:refund_prov_cancel:${result.booking.id}`,
            metadata: {
              bookingRef: result.booking.bookingRef,
            },
          });
        }
      } catch (notifErr) {
        console.error('[Notification] Error dispatching refund notifications:', notifErr);
      }
    })();
  }

  return result;
}

/**
 * Financial metrics and settlement ledger for a specific provider.
 */
export async function getProviderFinancialSummary(providerId: string): Promise<{
  grossRevenue: number;
  platformCommission: number;
  netPayable: number;
  settledAmount: number;
  pendingSettlementAmount: number;
  settlements: Array<{
    id: string;
    bookingRef: string;
    packageName: string;
    grossAmount: number;
    commissionAmount: number;
    providerAmount: number;
    status: string;
    travelDate: string;
    createdAt: string;
  }>;
}> {
  const records = await prisma.settlementLedger.findMany({
    where: { providerId },
    include: {
      booking: {
        include: { package: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  let grossRevenue = 0;
  let platformCommission = 0;
  let netPayable = 0;
  let settledAmount = 0;
  let pendingSettlementAmount = 0;

  const settlements = records.map((r) => {
    if (r.status !== 'CANCELLED') {
      grossRevenue += r.grossAmount;
      platformCommission += r.commissionAmount;
      netPayable += r.providerAmount;

      if (r.status === 'SETTLED') {
        settledAmount += r.providerAmount;
      } else if (r.status === 'PENDING') {
        pendingSettlementAmount += r.providerAmount;
      }
    }

    return {
      id: r.id,
      bookingRef: r.booking.bookingRef,
      packageName: r.booking.package.name,
      grossAmount: r.grossAmount,
      commissionAmount: r.commissionAmount,
      providerAmount: r.providerAmount,
      status: r.status,
      travelDate: r.booking.travelDate.toISOString().split('T')[0],
      createdAt: r.createdAt.toISOString(),
    };
  });

  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    platformCommission: Math.round(platformCommission * 100) / 100,
    netPayable: Math.round(netPayable * 100) / 100,
    settledAmount: Math.round(settledAmount * 100) / 100,
    pendingSettlementAmount: Math.round(pendingSettlementAmount * 100) / 100,
    settlements,
  };
}

/**
 * Platform-wide financial summary for Admin oversight.
 */
export async function getAdminFinancialAnalytics(): Promise<{
  grossVolume: number;
  totalCommissionEarned: number;
  totalTaxCollected: number;
  totalProviderPayables: number;
  totalRefunds: number;
  commissionRate: number;
  recentLedger: Array<{
    id: string;
    bookingRef: string;
    providerName: string;
    grossAmount: number;
    commissionAmount: number;
    taxAmount: number;
    providerAmount: number;
    status: string;
    createdAt: string;
  }>;
}> {
  const records = await prisma.settlementLedger.findMany({
    include: {
      booking: true,
      provider: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const allActiveSettlements = await prisma.settlementLedger.findMany({
    where: { status: { not: 'CANCELLED' } },
  });

  const allRefunds = await prisma.refund.findMany({
    where: { status: 'PROCESSED' },
  });

  const grossVolume = allActiveSettlements.reduce((sum, s) => sum + s.grossAmount, 0);
  const totalCommissionEarned = allActiveSettlements.reduce((sum, s) => sum + s.commissionAmount, 0);
  const totalTaxCollected = allActiveSettlements.reduce((sum, s) => sum + s.taxAmount, 0);
  const totalProviderPayables = allActiveSettlements.reduce((sum, s) => sum + s.providerAmount, 0);
  const totalRefunds = allRefunds.reduce((sum, r) => sum + r.amount, 0);

  return {
    grossVolume: Math.round(grossVolume * 100) / 100,
    totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
    totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
    totalProviderPayables: Math.round(totalProviderPayables * 100) / 100,
    totalRefunds: Math.round(totalRefunds * 100) / 100,
    commissionRate: getPlatformCommissionRate(),
    recentLedger: records.map((r) => ({
      id: r.id,
      bookingRef: r.booking.bookingRef,
      providerName: r.provider.businessName,
      grossAmount: r.grossAmount,
      commissionAmount: r.commissionAmount,
      taxAmount: r.taxAmount,
      providerAmount: r.providerAmount,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
