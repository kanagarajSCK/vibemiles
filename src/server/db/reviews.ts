import { prisma } from '@/lib/prisma';
import { ReviewStatus, NotificationType, UserRole, PaymentStatus } from '@prisma/client';
import { handleDbError } from './errors';
import { mapPrismaReviewToDomain } from './mappers';
import type { Review } from '@/types';
import { createNotificationInDb } from './notifications';
import { recordAuditLog } from './admin';

export interface CreateReviewParams {
  customerUserId: string;
  bookingId: string;
  rating: number;
  title?: string;
  comment: string;
  packageId?: string;
}

export interface ReplyReviewParams {
  providerUserId: string;
  reviewId: string;
  reply: string;
}

export interface ModerateReviewParams {
  adminUser: { id: string; email: string };
  reviewId: string;
  status: ReviewStatus;
  moderationNote?: string;
}

/**
 * Creates a verified customer review for an eligible completed booking.
 * 
 * Strict Enforcement:
 * - Only the booking owner can review.
 * - Suspended/blocked customer accounts are rejected.
 * - Booking must be PAID and COMPLETED (or past travel date).
 * - Duplicate reviews on the same booking are rejected.
 * - Server resolves package, provider, and customer entities.
 * - Recalculates package and provider aggregate ratings.
 * - Dispatches in-app notification to host.
 */
export async function createVerifiedReviewInDb(params: CreateReviewParams): Promise<Review> {
  const { customerUserId, bookingId, rating, title, comment } = params;

  // 1. Verify Customer
  const user = await prisma.user.findUnique({
    where: { id: customerUserId },
    include: { customerProfile: true },
  });

  if (!user || user.role !== UserRole.CUSTOMER || !user.customerProfile) {
    throw new Error('Customer account not found');
  }

  if (user.status === 'SUSPENDED' || user.customerProfile.isBlocked) {
    throw new Error('Suspended customer accounts are not permitted to submit reviews');
  }

  // 2. Verify Booking & Ownership
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      package: {
        include: {
          provider: true,
        },
      },
      payments: true,
      review: true,
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.customerId !== user.customerProfile.id && booking.customerId !== user.id) {
    throw new Error('You can only submit reviews for bookings placed under your account');
  }

  // 3. Verify Review Eligibility
  if (booking.bookingStatus === 'CANCELLED') {
    throw new Error('Cancelled bookings are not eligible for review');
  }

  const isPaid =
    booking.payments.some((p) => p.status === PaymentStatus.PAID) ||
    booking.bookingStatus === 'CONFIRMED' ||
    booking.bookingStatus === 'COMPLETED';

  if (!isPaid) {
    throw new Error('Only paid, confirmed bookings are eligible for review');
  }

  const travelDate = new Date(booking.travelDate);
  const now = new Date();
  const travelDatePassed = travelDate <= now;
  const isCompleted = booking.bookingStatus === 'COMPLETED';

  if (!isCompleted && !travelDatePassed) {
    throw new Error('Reviews can only be submitted for concluded journeys or past travel dates');
  }

  // 4. Duplicate Review Prevention
  if (booking.review) {
    throw new Error('A verified review has already been submitted for this booking');
  }

  const existingReview = await prisma.review.findUnique({
    where: { bookingId: booking.id },
  });
  if (existingReview) {
    throw new Error('A verified review has already been submitted for this booking');
  }

  // 5. Validation
  const numericRating = Number(rating);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error('Rating must be a valid number between 1 and 5 stars');
  }
  const safeRating = Math.round(numericRating * 10) / 10;

  const cleanComment = (comment || '').trim();
  if (cleanComment.length < 10) {
    throw new Error('Review comment must be at least 10 characters long');
  }
  if (cleanComment.length > 2000) {
    throw new Error('Review comment cannot exceed 2000 characters');
  }

  const cleanTitle = (title || '').trim().slice(0, 120);

  // 6. Transactional Persistence
  const newReview = await prisma.$transaction(async (tx) => {
    const record = await tx.review.create({
      data: {
        packageId: booking.packageId,
        customerId: user.customerProfile!.id,
        bookingId: booking.id,
        rating: safeRating,
        title: cleanTitle || null,
        comment: cleanComment,
        status: ReviewStatus.APPROVED,
      },
      include: {
        customer: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Mark booking as completed if not already
    if (booking.bookingStatus !== 'COMPLETED') {
      await tx.booking.update({
        where: { id: booking.id },
        data: { bookingStatus: 'COMPLETED' },
      });
    }

    return record;
  });

  // 7. Aggregate Ratings Update
  await recalculatePackageRatings(booking.packageId);
  if (booking.package?.providerId) {
    await recalculateProviderRatings(booking.package.providerId);
  }

  // 8. In-App Notification to Tour Operator
  if (booking.package?.provider?.userId) {
    await createNotificationInDb({
      userId: booking.package.provider.userId,
      type: NotificationType.NEW_REVIEW,
      title: `New ${safeRating}★ Review Received`,
      message: `${user.customerProfile.fullName} reviewed "${booking.package.name}": "${cleanComment.slice(0, 80)}..."`,
      link: '/provider/reviews',
      dedupKey: `notif:review:${newReview.id}`,
      metadata: {
        reviewId: newReview.id,
        packageId: booking.packageId,
        rating: safeRating,
      },
    });
  }

  return mapPrismaReviewToDomain(newReview);
}

/**
 * Allows verified hosts to reply to reviews on their packages.
 */
export async function replyToReviewInDb(params: ReplyReviewParams): Promise<Review> {
  const { providerUserId, reviewId, reply } = params;

  // 1. Verify Provider
  const provider = await prisma.providerProfile.findFirst({
    where: {
      OR: [{ id: providerUserId }, { userId: providerUserId }],
    },
  });

  if (!provider) {
    throw new Error('Host provider profile not found');
  }

  if (!provider.isActive) {
    throw new Error('Suspended tour operators cannot respond to reviews');
  }

  // 2. Verify Review & Ownership
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      package: true,
      customer: {
        include: { user: true },
      },
    },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  if (review.package.providerId !== provider.id) {
    throw new Error('You can only post official responses to reviews on your own packages');
  }

  // 3. Validate Reply
  const cleanReply = (reply || '').trim();
  if (cleanReply.length < 2) {
    throw new Error('Reply must be at least 2 characters long');
  }
  if (cleanReply.length > 1000) {
    throw new Error('Reply cannot exceed 1000 characters');
  }

  // 4. Update Review
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      providerReply: cleanReply,
      providerReplyAt: new Date(),
    },
    include: {
      customer: {
        select: {
          fullName: true,
          avatar: true,
        },
      },
    },
  });

  // 5. Notify Customer of Host Reply
  if (review.customer?.user?.id) {
    await createNotificationInDb({
      userId: review.customer.user.id,
      type: NotificationType.NEW_REVIEW,
      title: `Host Responded to Your Review`,
      message: `${provider.businessName} responded to your review on "${review.package.name}".`,
      link: `/packages/${review.package.slug}`,
      dedupKey: `notif:reply:${review.id}`,
      metadata: {
        reviewId: review.id,
        packageId: review.packageId,
      },
    });
  }

  return mapPrismaReviewToDomain(updatedReview);
}

/**
 * Allows admin operators to moderate reviews (APPROVE or REJECT).
 */
export async function adminModerateReviewInDb(params: ModerateReviewParams): Promise<Review> {
  const { adminUser, reviewId, status, moderationNote } = params;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      package: true,
      customer: {
        select: {
          fullName: true,
          avatar: true,
        },
      },
    },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      status,
      moderationNote: moderationNote?.trim() || null,
    },
    include: {
      customer: {
        select: {
          fullName: true,
          avatar: true,
        },
      },
    },
  });

  // Recalculate ratings
  await recalculatePackageRatings(review.packageId);
  if (review.package?.providerId) {
    await recalculateProviderRatings(review.package.providerId);
  }

  // Log to Audit Trail
  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: 'ADMIN',
    action: 'REVIEW_MODERATED',
    targetType: 'REVIEW',
    targetId: review.id,
    reason: moderationNote || `Review status set to ${status}`,
    metadata: {
      previousStatus: review.status,
      newStatus: status,
      packageId: review.packageId,
    },
  });

  return mapPrismaReviewToDomain(updated);
}

/**
 * Retrieves all approved reviews for a given package directly from PostgreSQL.
 */
export async function getReviewsForPackage(packageId: string, limit = 20): Promise<Review[]> {
  try {
    const records = await prisma.review.findMany({
      where: {
        packageId,
        status: ReviewStatus.APPROVED,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return records.map(mapPrismaReviewToDomain);
  } catch (error) {
    return handleDbError(error, `getReviewsForPackage(${packageId})`, () => []);
  }
}

/**
 * Retrieves reviews submitted by a specific customer.
 */
export async function getReviewsForCustomer(customerId: string): Promise<Review[]> {
  try {
    const records = await prisma.review.findMany({
      where: {
        OR: [{ customerId }, { customer: { userId: customerId } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return records.map(mapPrismaReviewToDomain);
  } catch (error) {
    return handleDbError(error, `getReviewsForCustomer(${customerId})`, () => []);
  }
}

/**
 * Retrieves reviews for a booking if one has been submitted.
 */
export async function getReviewForBooking(bookingId: string): Promise<Review | null> {
  try {
    const record = await prisma.review.findUnique({
      where: { bookingId },
      include: {
        customer: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    if (!record) return null;
    return mapPrismaReviewToDomain(record);
  } catch (error) {
    return handleDbError(error, `getReviewForBooking(${bookingId})`, () => null);
  }
}

/**
 * Retrieves all reviews for packages owned by a given provider with pagination.
 */
export async function getReviewsForProvider(
  providerId: string,
  limit = 20
): Promise<Review[]> {
  try {
    const records = await prisma.review.findMany({
      where: {
        package: {
          OR: [{ providerId }, { provider: { userId: providerId } }],
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return records.map(mapPrismaReviewToDomain);
  } catch (error) {
    return handleDbError(error, `getReviewsForProvider(${providerId})`, () => []);
  }
}

/**
 * Recalculates average rating and reviewCount for a Package based on approved reviews.
 */
export async function recalculatePackageRatings(packageId: string): Promise<{ rating: number; reviewCount: number }> {
  const stats = await prisma.review.aggregate({
    _avg: { rating: true },
    _count: { id: true },
    where: {
      packageId,
      status: ReviewStatus.APPROVED,
    },
  });

  const rating = stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0;
  const reviewCount = stats._count.id || 0;

  await prisma.package.update({
    where: { id: packageId },
    data: { rating, reviewCount },
  });

  return { rating, reviewCount };
}

/**
 * Recalculates average rating and reviewCount for a Provider across all approved reviews.
 */
export async function recalculateProviderRatings(providerId: string): Promise<{ rating: number; reviewCount: number }> {
  const stats = await prisma.review.aggregate({
    _avg: { rating: true },
    _count: { id: true },
    where: {
      package: { providerId },
      status: ReviewStatus.APPROVED,
    },
  });

  const rating = stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0;
  const reviewCount = stats._count.id || 0;

  await prisma.providerProfile.update({
    where: { id: providerId },
    data: { rating, reviewCount },
  });

  return { rating, reviewCount };
}

/**
 * Retrieves all reviews with filtering and pagination for admin moderation.
 */
export async function getAllReviewsForAdminInDb(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.status && params.status !== 'ALL') {
    where.status = params.status as ReviewStatus;
  }

  const [records, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { fullName: true, avatar: true } },
        package: { select: { name: true, id: true, slug: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    items: records.map((r) => ({
      ...mapPrismaReviewToDomain(r),
      moderationNote: r.moderationNote,
      packageTitle: r.package?.name,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

