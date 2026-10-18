import { prisma } from '@/lib/prisma';
import {
  UserRole,
  UserStatus,
  VerificationStatus,
  ListingStatus,
  ApprovalStatus,
  BookingStatus,
  PaymentStatus,
  NotificationType,
  DocumentType,
  DocumentStatus,
  Prisma,
} from '@prisma/client';
import { createNotificationInDb } from './notifications';

// ─── AUDIT LOGGING ───────────────────────────────────────────

export interface RecordAuditLogParams {
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Strips sensitive keys (passwords, tokens, keys) before persisting metadata.
 */
function sanitizeAuditMetadata(metadata?: Record<string, unknown> | null): Prisma.InputJsonValue | undefined {
  if (!metadata) return undefined;
  const sensitiveSubstrings = ['password', 'passwordhash', 'token', 'secret', 'cardnumber', 'cvv', 'creditcard'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    const isSensitive =
      sensitiveSubstrings.some((s) => lowerKey.includes(s)) ||
      lowerKey === 'key' ||
      lowerKey.endsWith('_key') ||
      lowerKey.endsWith('apikey');

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as Prisma.InputJsonValue;
}

/**
 * Persists an immutable administrative audit log.
 */
export async function recordAuditLog(params: RecordAuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        reason: params.reason || null,
        metadata: sanitizeAuditMetadata(params.metadata),
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
    // Don't fail the primary transaction if logging fails, but log to stderr
    return null;
  }
}

export interface GetAuditLogsParams {
  targetType?: string;
  targetId?: string;
  actorId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(params: GetAuditLogsParams = {}) {
  const { targetType, targetId, actorId, action, limit = 50, offset = 0 } = params;

  const where: Prisma.AuditLogWhereInput = {
    ...(targetType ? { targetType } : {}),
    ...(targetId ? { targetId } : {}),
    ...(actorId ? { actorId } : {}),
    ...(action ? { action } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
    }),
  ]);

  return { total, logs };
}

// ─── ADMIN DASHBOARD METRICS ─────────────────────────────────

export interface DashboardMetricsFilter {
  startDate?: Date;
  endDate?: Date;
}

interface CachedMetricsEntry {
  data: any;
  timestamp: number;
}
let adminMetricsCache: CachedMetricsEntry | null = null;
const ADMIN_METRICS_CACHE_TTL_MS = 20 * 1000; // 20 seconds

export function invalidateAdminMetricsCache(): void {
  adminMetricsCache = null;
}

export async function getAdminDashboardMetrics(filters?: DashboardMetricsFilter) {
  const isDefaultQuery = !filters || (!filters.startDate && !filters.endDate);
  const now = Date.now();
  if (isDefaultQuery && adminMetricsCache && now - adminMetricsCache.timestamp < ADMIN_METRICS_CACHE_TTL_MS) {
    return adminMetricsCache.data;
  }

  const dateFilter: Prisma.DateTimeFilter | undefined =
    filters?.startDate || filters?.endDate
      ? {
          ...(filters.startDate ? { gte: filters.startDate } : {}),
          ...(filters.endDate ? { lte: filters.endDate } : {}),
        }
      : undefined;

  const bookingWhere: Prisma.BookingWhereInput = dateFilter ? { createdAt: dateFilter } : {};
  const paymentWhere: Prisma.PaymentWhereInput = dateFilter ? { createdAt: dateFilter } : {};
  const refundWhere: Prisma.RefundWhereInput = dateFilter ? { createdAt: dateFilter } : {};
  const settlementWhere: Prisma.SettlementLedgerWhereInput = dateFilter ? { createdAt: dateFilter } : {};

  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

  // Execute all counts and financial aggregates concurrently in one single roundtrip batch
  const [
    // 1. User & Account Counts
    totalUsers,
    totalCustomers,
    activeCustomers,
    suspendedCustomers,
    totalProviders,
    pendingProviders,
    verifiedProviders,
    rejectedProviders,
    suspendedProviders,
    totalAdmins,
    activeUsers,
    suspendedUsers,
    inactiveUsers,
    newRegistrations7d,
    newRegistrations30d,
    newRegistrations90d,

    // 2. Listing Moderation Counts
    totalPackages,
    listingsAwaitingModeration,
    approvedPackages,
    publishedListings,
    archivedListings,
    rejectedListings,
    draftListings,

    // 3. Booking Counts by Status
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    rejectedBookings,

    // 4. Payment Counts by Status
    totalPayments,
    paidPayments,
    pendingPayments,
    failedPayments,
    refundedPayments,

    // 5. Refund Counts by Status
    totalRefunds,
    processedRefunds,
    pendingRefunds,
    failedRefunds,

    // 6. Financial Calculations
    gmvAgg,
    collectedAgg,
    commissionAgg,
    pendingPayablesAgg,
    settledPayablesAgg,
    refundAmtAgg,
  ] = await Promise.all([
    // 1. Users
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
    prisma.user.count({ where: { role: UserRole.CUSTOMER, status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { role: UserRole.CUSTOMER, status: UserStatus.SUSPENDED } }),
    prisma.providerProfile.count(),
    prisma.providerProfile.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
    prisma.providerProfile.count({ where: { verificationStatus: VerificationStatus.VERIFIED } }),
    prisma.providerProfile.count({ where: { verificationStatus: VerificationStatus.REJECTED } }),
    prisma.user.count({ where: { role: UserRole.PROVIDER, status: UserStatus.SUSPENDED } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
    prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: ninetyDaysAgo } } }),

    // 2. Listings
    prisma.package.count(),
    prisma.package.count({ where: { status: ListingStatus.PENDING_REVIEW } }),
    prisma.package.count({ where: { approvalStatus: ApprovalStatus.APPROVED } }),
    prisma.package.count({ where: { status: ListingStatus.PUBLISHED, isActive: true } }),
    prisma.package.count({ where: { status: ListingStatus.ARCHIVED } }),
    prisma.package.count({ where: { status: ListingStatus.REJECTED } }),
    prisma.package.count({ where: { status: ListingStatus.DRAFT } }),

    // 3. Bookings
    prisma.booking.count({ where: bookingWhere }),
    prisma.booking.count({ where: { ...bookingWhere, bookingStatus: BookingStatus.PENDING } }),
    prisma.booking.count({ where: { ...bookingWhere, bookingStatus: BookingStatus.CONFIRMED } }),
    prisma.booking.count({ where: { ...bookingWhere, bookingStatus: BookingStatus.COMPLETED } }),
    prisma.booking.count({ where: { ...bookingWhere, bookingStatus: BookingStatus.CANCELLED } }),
    prisma.booking.count({ where: { ...bookingWhere, bookingStatus: BookingStatus.REJECTED } }),

    // 4. Payments
    prisma.payment.count({ where: paymentWhere }),
    prisma.payment.count({ where: { ...paymentWhere, status: PaymentStatus.PAID } }),
    prisma.payment.count({ where: { ...paymentWhere, status: PaymentStatus.PENDING } }),
    prisma.payment.count({ where: { ...paymentWhere, status: PaymentStatus.FAILED } }),
    prisma.payment.count({
      where: {
        ...paymentWhere,
        status: { in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED] },
      },
    }),

    // 5. Refunds
    prisma.refund.count({ where: refundWhere }),
    prisma.refund.count({ where: { ...refundWhere, status: 'PROCESSED' } }),
    prisma.refund.count({ where: { ...refundWhere, status: 'PENDING' } }),
    prisma.refund.count({ where: { ...refundWhere, status: 'FAILED' } }),

    // 6. Aggregates
    prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: {
        ...bookingWhere,
        bookingStatus: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        ...paymentWhere,
        status: PaymentStatus.PAID,
      },
    }),
    prisma.settlementLedger.aggregate({
      _sum: { commissionAmount: true, providerAmount: true },
      where: {
        ...settlementWhere,
        status: { not: 'CANCELLED' },
      },
    }),
    prisma.settlementLedger.aggregate({
      _sum: { providerAmount: true },
      where: {
        ...settlementWhere,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    }),
    prisma.settlementLedger.aggregate({
      _sum: { providerAmount: true },
      where: {
        ...settlementWhere,
        status: 'SETTLED',
      },
    }),
    prisma.refund.aggregate({
      _sum: { amount: true },
      where: {
        ...refundWhere,
        status: 'PROCESSED',
      },
    }),
  ]);

  const grossBookingValue = gmvAgg._sum.totalAmount ?? 0;
  const collectedRevenue = collectedAgg._sum.amount ?? 0;
  const platformCommissionEarned = commissionAgg._sum.commissionAmount ?? 0;
  const providerPayablesPending = pendingPayablesAgg._sum.providerAmount ?? 0;
  const providerAmountSettled = settledPayablesAgg._sum.providerAmount ?? 0;
  const processedRefundAmount = refundAmtAgg._sum.amount ?? 0;

  const result = {
    metrics: {
      users: {
        totalUsers,
        totalCustomers,
        activeCustomers,
        suspendedCustomers,
        totalProviders,
        pendingProviders,
        verifiedProviders,
        rejectedProviders,
        suspendedProviders,
        totalAdmins,
        activeUsers,
        suspendedUsers,
        inactiveUsers,
        newRegistrations7d,
        newRegistrations30d,
        newRegistrations90d,
      },
      listings: {
        totalPackages,
        awaitingModeration: listingsAwaitingModeration,
        approved: approvedPackages,
        published: publishedListings,
        archived: archivedListings,
        rejected: rejectedListings,
        draft: draftListings,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        rejected: rejectedBookings,
      },
      payments: {
        total: totalPayments,
        paid: paidPayments,
        pending: pendingPayments,
        failed: failedPayments,
        refunded: refundedPayments,
      },
      refunds: {
        total: totalRefunds,
        processed: processedRefunds,
        pending: pendingRefunds,
        failed: failedRefunds,
      },
      financial: {
        grossBookingValue,
        collectedRevenue,
        platformCommissionEarned,
        providerPayablesPending,
        providerAmountSettled,
        processedRefundAmount,
      },
    },
    definitions: {
      grossBookingValue: 'Sum of total booking amounts for confirmed and completed bookings (GMV).',
      collectedRevenue: 'Actual funds captured via verified gateway payments with PAID status.',
      platformCommissionEarned: 'Net marketplace commission retained from active settlements.',
      providerPayablesPending: 'Net payouts awaiting settlement release to verified operators.',
      providerAmountSettled: 'Funds successfully remitted to tour operators.',
      processedRefundAmount: 'Total gateway refunds returned to travelers.',
    },
  };

  if (isDefaultQuery) {
    adminMetricsCache = { data: result, timestamp: now };
  }

  return result;
}

// ─── CUSTOMER MANAGEMENT ─────────────────────────────────────

export interface GetAdminCustomersParams {
  search?: string;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export async function getAdminCustomers(params: GetAdminCustomersParams = {}) {
  const { search, status, page = 1, limit = 20 } = params;
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;

  const where: Prisma.UserWhereInput = {
    role: UserRole.CUSTOMER,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            {
              customerProfile: {
                fullName: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: stringToTrue(),
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        customerProfile: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            city: true,
            state: true,
            rewardPoints: true,
            isBlocked: true,
            isVerified: true,
            suspensionReason: true,
            _count: {
              select: {
                bookings: true,
                reviews: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Aggregate total spent for these customers
  const customerProfileIds = users
    .map((u) => u.customerProfile?.id)
    .filter((id): id is string => Boolean(id));

  const spendingByCustomer = await prisma.booking.groupBy({
    by: ['customerId'],
    _sum: { totalAmount: true },
    where: {
      customerId: { in: customerProfileIds },
      bookingStatus: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    },
  });

  const spendingMap = new Map<string, number>();
  for (const s of spendingByCustomer) {
    spendingMap.set(s.customerId, s._sum.totalAmount ?? 0);
  }

  const items = users.map((u) => {
    const prof = u.customerProfile;
    return {
      userId: u.id,
      email: u.email,
      phone: u.phone,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      profileId: prof?.id ?? null,
      fullName: prof?.fullName ?? 'Anonymous Traveler',
      avatar: prof?.avatar ?? null,
      city: prof?.city ?? null,
      state: prof?.state ?? null,
      rewardPoints: prof?.rewardPoints ?? 0,
      isBlocked: prof?.isBlocked ?? false,
      isVerified: prof?.isVerified ?? false,
      suspensionReason: prof?.suspensionReason ?? null,
      bookingCount: prof?._count.bookings ?? 0,
      reviewCount: prof?._count.reviews ?? 0,
      totalSpent: prof?.id ? spendingMap.get(prof.id) ?? 0 : 0,
    };
  });

  return {
    items,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
}

function stringToTrue() {
  return true;
}

export async function getCustomerDetailsForAdmin(userIdOrProfileId: string) {
  const user = await prisma.user.findFirst({
    where: {
      role: UserRole.CUSTOMER,
      OR: [{ id: userIdOrProfileId }, { customerProfile: { id: userIdOrProfileId } }],
    },
    include: {
      customerProfile: {
        include: {
          bookings: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              package: {
                select: { id: true, name: true, slug: true },
              },
              payments: {
                select: { id: true, transactionId: true, amount: true, status: true, paidAt: true },
              },
              refunds: {
                select: { id: true, amount: true, status: true, processedAt: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.customerProfile) return null;

  // Retrieve audit trail for this customer
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      targetType: 'CUSTOMER',
      targetId: user.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    profile: {
      id: user.customerProfile.id,
      fullName: user.customerProfile.fullName,
      avatar: user.customerProfile.avatar,
      city: user.customerProfile.city,
      state: user.customerProfile.state,
      country: user.customerProfile.country,
      rewardPoints: user.customerProfile.rewardPoints,
      isBlocked: user.customerProfile.isBlocked,
      isVerified: user.customerProfile.isVerified,
      suspensionReason: user.customerProfile.suspensionReason,
    },
    bookings: user.customerProfile.bookings.map((b) => ({
      id: b.id,
      bookingRef: b.bookingRef,
      packageName: b.package.name,
      packageSlug: b.package.slug,
      travelDate: b.travelDate.toISOString(),
      totalAmount: b.totalAmount,
      bookingStatus: b.bookingStatus,
      payments: b.payments,
      refunds: b.refunds,
      createdAt: b.createdAt.toISOString(),
    })),
    auditLogs,
  };
}

export async function updateCustomerStatusInDb(params: {
  adminUser: { id: string; email: string };
  userId: string;
  status: UserStatus;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, userId, status, reason, ipAddress, userAgent } = params;

  if (!reason || reason.trim().length === 0) {
    throw new Error('A descriptive reason is strictly required for modifying account status.');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { customerProfile: true },
  });

  if (!targetUser) {
    throw new Error('User not found.');
  }

  const isSuspended = status === UserStatus.SUSPENDED;

  // Atomic update: User.status, CustomerProfile.isBlocked, and CustomerProfile.suspensionReason
  const { updatedUser, updatedProfile } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { status },
    });

    let profile = null;
    if (targetUser.customerProfile) {
      profile = await tx.customerProfile.update({
        where: { id: targetUser.customerProfile.id },
        data: {
          isBlocked: isSuspended,
          suspensionReason: isSuspended ? reason.trim() : null,
        },
      });
    }

    // Invalidate all active sessions immediately if suspending
    if (isSuspended) {
      await tx.session.deleteMany({ where: { userId } });
    }

    return { updatedUser: user, updatedProfile: profile };
  });

  // Record audit log
  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: UserRole.ADMIN,
    action: isSuspended ? 'CUSTOMER_SUSPEND' : 'CUSTOMER_ACTIVATE',
    targetType: 'CUSTOMER',
    targetId: userId,
    reason: reason.trim(),
    metadata: {
      previousStatus: targetUser.status,
      newStatus: status,
      customerEmail: targetUser.email,
    },
    ipAddress,
    userAgent,
  });

  // Dispatch In-App Notification (Fault-tolerant, Non-blocking, Idempotent)
  try {
    if (isSuspended) {
      await createNotificationInDb({
        userId,
        type: NotificationType.ACCOUNT_SUSPENDED,
        title: 'Account Suspended',
        message: `Your VibeMiles customer privileges have been temporarily suspended: "${reason.trim()}". Please contact support.`,
        dedupKey: `notif:cust_susp:${Date.now()}:${userId}`,
      });
    } else {
      await createNotificationInDb({
        userId,
        type: NotificationType.ACCOUNT_REACTIVATED,
        title: 'Account Reactivated',
        message: 'Your VibeMiles customer privileges have been restored. You can now resume booking journeys.',
        link: '/packages',
        dedupKey: `notif:cust_react:${Date.now()}:${userId}`,
      });
    }
  } catch (notifErr) {
    console.error('[Notification] Error dispatching customer status notification:', notifErr);
  }

  return {
    userId: updatedUser.id,
    status: updatedUser.status,
    isBlocked: updatedProfile?.isBlocked ?? isSuspended,
    suspensionReason: updatedProfile?.suspensionReason ?? (isSuspended ? reason.trim() : null),
  };
}

// ─── PROVIDER MANAGEMENT ─────────────────────────────────────

export interface GetAdminProvidersParams {
  search?: string;
  verificationStatus?: VerificationStatus;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function getAdminProviders(params: GetAdminProvidersParams = {}) {
  const { search, verificationStatus, isActive, page = 1, limit = 20 } = params;
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;

  const where: Prisma.ProviderProfileWhereInput = {
    ...(verificationStatus ? { verificationStatus } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { businessName: { contains: search, mode: 'insensitive' } },
            { ownerName: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { state: { contains: search, mode: 'insensitive' } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, providers] = await Promise.all([
    prisma.providerProfile.count({ where }),
    prisma.providerProfile.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            status: true,
            fileName: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
        _count: {
          select: {
            packages: true,
            bookings: true,
            documents: true,
          },
        },
      },
    }),
  ]);

  const items = providers.map((p) => {
    const pendingDocs = p.documents.filter((d) => d.status === DocumentStatus.PENDING);
    const verifiedDocs = p.documents.filter((d) => d.status === DocumentStatus.VERIFIED);
    const rejectedDocs = p.documents.filter((d) => d.status === DocumentStatus.REJECTED);

    return {
      id: p.id,
      userId: p.userId,
      businessName: p.businessName,
      ownerName: p.ownerName,
      businessCategory: p.businessCategory,
      city: p.city,
      state: p.state,
      email: p.user.email,
      phone: p.user.phone,
      userStatus: p.user.status,
      verificationStatus: p.verificationStatus,
      isActive: p.isActive,
      rating: p.rating,
      reviewCount: p.reviewCount,
      totalPackages: p._count.packages,
      totalBookings: p._count.bookings,
      documentsCount: p.documents.length,
      pendingDocsCount: pendingDocs.length,
      verifiedDocsCount: verifiedDocs.length,
      rejectedDocsCount: rejectedDocs.length,
      hasPendingDocuments: pendingDocs.length > 0,
      documents: p.documents.map((d) => ({
        id: d.id,
        type: d.type,
        status: d.status,
        fileName: d.fileName,
        fileSize: d.fileSize,
        uploadedAt: d.uploadedAt.toISOString(),
      })),
      rejectionReason: p.rejectionReason,
      suspensionReason: p.suspensionReason,
      joinedAt: p.joinedAt.toISOString(),
    };
  });

  return {
    items,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
}

export async function getProviderDetailsForAdmin(providerId: string) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      },
      packages: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          approvalStatus: true,
          finalPrice: true,
          bookingCount: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      settlements: {
        select: {
          id: true,
          grossAmount: true,
          commissionAmount: true,
          providerAmount: true,
          status: true,
          settledAt: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  if (!provider) return null;

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      targetType: 'PROVIDER',
      targetId: provider.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    id: provider.id,
    userId: provider.userId,
    businessName: provider.businessName,
    ownerName: provider.ownerName,
    businessCategory: provider.businessCategory,
    description: provider.description,
    address: {
      line1: provider.addressLine1,
      city: provider.city,
      state: provider.state,
      pincode: provider.pincode,
      country: provider.country,
    },
    kyc: {
      panNumber: provider.panNumber,
      gstNumber: provider.gstNumber,
      bankAccountHolder: provider.bankAccountHolder,
      bankAccountNumber: provider.bankAccountNumber ? '••••' + provider.bankAccountNumber.slice(-4) : null,
      bankIfsc: provider.bankIfsc,
      bankName: provider.bankName,
      bankBranch: provider.bankBranch,
    },
    verificationStatus: provider.verificationStatus,
    rejectionReason: provider.rejectionReason,
    suspensionReason: provider.suspensionReason,
    isActive: provider.isActive,
    user: provider.user,
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    packages: provider.packages,
    settlements: provider.settlements,
    documents: provider.documents.map((d) => ({
      id: d.id,
      type: d.type,
      fileName: d.fileName,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      status: d.status,
      rejectionReason: d.rejectionReason,
      reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
      uploadedAt: d.uploadedAt.toISOString(),
    })),
    auditLogs,
  };
}

export async function reviewProviderVerificationInDb(params: {
  adminUser: { id: string; email: string };
  providerId: string;
  status: VerificationStatus;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, providerId, status, reason, ipAddress, userAgent } = params;

  if (status === VerificationStatus.REJECTED && (!reason || reason.trim().length === 0)) {
    throw new Error('A rejection reason is strictly required when declining KYC verification.');
  }

  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: { user: true, documents: true },
  });

  if (!provider) {
    throw new Error('Provider not found.');
  }

  if (status === VerificationStatus.VERIFIED) {
    const requiredTypes: DocumentType[] = [
      DocumentType.BUSINESS_REGISTRATION,
      DocumentType.GOVERNMENT_ID,
      DocumentType.ADDRESS_PROOF,
    ];
    const uploadedTypes = new Set(provider.documents.map((d) => d.type));
    const missingTypes = requiredTypes.filter((t) => !uploadedTypes.has(t));
    if (missingTypes.length > 0) {
      const missingLabels = missingTypes.map((t) => t.replace(/_/g, ' ')).join(', ');
      throw new Error(
        `Cannot approve KYC verification: Missing required documents (${missingLabels}). All 3 statutory documents (Business Registration, Government ID, Address Proof) must be uploaded by the operator before verification.`
      );
    }
  }

  const updated = await prisma.providerProfile.update({
    where: { id: providerId },
    data: {
      verificationStatus: status,
      rejectionReason: status === VerificationStatus.REJECTED ? reason?.trim() : null,
    },
  });

  // Synchronize all uploaded documents for this provider
  if (status === VerificationStatus.VERIFIED) {
    await prisma.providerDocument.updateMany({
      where: {
        providerId,
        status: { in: [DocumentStatus.PENDING, DocumentStatus.REJECTED] },
      },
      data: {
        status: DocumentStatus.VERIFIED,
        rejectionReason: null,
        reviewedByAdminId: adminUser.id,
        reviewedAt: new Date(),
      },
    });
  } else if (status === VerificationStatus.REJECTED) {
    await prisma.providerDocument.updateMany({
      where: {
        providerId,
        status: DocumentStatus.PENDING,
      },
      data: {
        status: DocumentStatus.REJECTED,
        rejectionReason: reason?.trim() || 'KYC verification declined by administrator.',
        reviewedByAdminId: adminUser.id,
        reviewedAt: new Date(),
      },
    });
  }

  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: UserRole.ADMIN,
    action: status === VerificationStatus.VERIFIED ? 'PROVIDER_VERIFY' : 'PROVIDER_REJECT',
    targetType: 'PROVIDER',
    targetId: providerId,
    reason: reason?.trim() || `KYC status set to ${status}`,
    metadata: {
      previousVerificationStatus: provider.verificationStatus,
      newVerificationStatus: status,
      businessName: provider.businessName,
    },
    ipAddress,
    userAgent,
  });

  // Dispatch In-App Notification to Host (Fault-tolerant, Non-blocking, Idempotent)
  try {
    if (status === VerificationStatus.VERIFIED) {
      await createNotificationInDb({
        userId: provider.userId,
        type: NotificationType.PROVIDER_VERIFIED,
        title: 'KYC Verification Approved',
        message: 'Congratulations! Your tour operator KYC documents have been verified and approved. You can now publish packages.',
        link: '/provider/packages',
        dedupKey: `notif:prov_verify:${provider.id}`,
      });
    } else if (status === VerificationStatus.REJECTED) {
      await createNotificationInDb({
        userId: provider.userId,
        type: NotificationType.PROVIDER_REJECTED,
        title: 'KYC Verification Declined',
        message: `Your partner verification was declined: "${reason?.trim()}". Please update your statutory details and resubmit.`,
        link: '/partner/verification',
        dedupKey: `notif:prov_reject:${provider.id}`,
      });
    }
  } catch (notifErr) {
    console.error('[Notification] Error dispatching provider verification notification:', notifErr);
  }

  return {
    providerId: updated.id,
    verificationStatus: updated.verificationStatus,
    rejectionReason: updated.rejectionReason,
  };
}

export async function updateProviderStatusInDb(params: {
  adminUser: { id: string; email: string };
  providerId: string;
  isActive: boolean;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, providerId, isActive, reason, ipAddress, userAgent } = params;

  if (!reason || reason.trim().length === 0) {
    throw new Error('A descriptive reason is required for suspending or activating a provider.');
  }

  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: { user: true },
  });

  if (!provider) {
    throw new Error('Provider not found.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const prof = await tx.providerProfile.update({
      where: { id: providerId },
      data: {
        isActive,
        suspensionReason: isActive ? null : reason.trim(),
      },
    });

    await tx.user.update({
      where: { id: provider.userId },
      data: {
        status: isActive ? UserStatus.ACTIVE : UserStatus.SUSPENDED,
      },
    });

    // Invalidate sessions immediately if suspending
    if (!isActive) {
      await tx.session.deleteMany({ where: { userId: provider.userId } });
    }

    return prof;
  });

  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: UserRole.ADMIN,
    action: isActive ? 'PROVIDER_ACTIVATE' : 'PROVIDER_SUSPEND',
    targetType: 'PROVIDER',
    targetId: providerId,
    reason: reason.trim(),
    metadata: {
      previousIsActive: provider.isActive,
      newIsActive: isActive,
      businessName: provider.businessName,
    },
    ipAddress,
    userAgent,
  });

  // Dispatch In-App Notification (Fault-tolerant, Non-blocking, Idempotent)
  try {
    if (!isActive) {
      await createNotificationInDb({
        userId: provider.userId,
        type: NotificationType.ACCOUNT_SUSPENDED,
        title: 'Partner Account Suspended',
        message: `Your tour operator account has been temporarily suspended: "${reason.trim()}". Please contact admin support.`,
        dedupKey: `notif:prov_susp:${Date.now()}:${provider.id}`,
      });
    } else {
      await createNotificationInDb({
        userId: provider.userId,
        type: NotificationType.ACCOUNT_REACTIVATED,
        title: 'Partner Account Reactivated',
        message: 'Your tour operator access has been restored. You can now manage your listings and bookings.',
        link: '/provider/dashboard',
        dedupKey: `notif:prov_react:${Date.now()}:${provider.id}`,
      });
    }
  } catch (notifErr) {
    console.error('[Notification] Error dispatching provider status notification:', notifErr);
  }

  return {
    providerId: updated.id,
    isActive: updated.isActive,
    suspensionReason: updated.suspensionReason,
  };
}

// ─── CATEGORY MANAGEMENT ─────────────────────────────────────

export async function getAdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { packages: true },
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    description: c.description,
    isActive: c.isActive,
    packagesCount: c._count.packages,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function createCategoryInDb(params: {
  adminUser: { id: string; email: string };
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, name, icon, description, ipAddress, userAgent } = params;

  if (!name || name.trim().length === 0) {
    throw new Error('Category name is required.');
  }

  const cleanName = name.trim();
  const rawSlug = params.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cleanSlug = rawSlug
    .toLowerCase()
    .trim()
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    .replace(/[^a-z0-9-]+/g, '-');

  if (!cleanSlug) {
    throw new Error('A valid slug containing alphanumeric characters is required.');
  }

  // Check unique slug
  const existing = await prisma.category.findUnique({
    where: { slug: cleanSlug },
  });

  if (existing) {
    throw new Error(`Category with slug "${cleanSlug}" already exists.`);
  }

  const category = await prisma.category.create({
    data: {
      name: cleanName,
      slug: cleanSlug,
      icon: icon?.trim() || null,
      description: description?.trim() || null,
      isActive: true,
    },
  });

  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: UserRole.ADMIN,
    action: 'CATEGORY_CREATE',
    targetType: 'CATEGORY',
    targetId: category.id,
    reason: 'New category created by administrator',
    metadata: { name: cleanName, slug: cleanSlug },
    ipAddress,
    userAgent,
  });

  return category;
}

export async function updateCategoryInDb(params: {
  adminUser: { id: string; email: string };
  id: string;
  name?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, id, name, icon, description, isActive, ipAddress, userAgent } = params;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Category not found.');
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(icon !== undefined ? { icon: icon.trim() || null } : {}),
      ...(description !== undefined ? { description: description.trim() || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: UserRole.ADMIN,
    action: 'CATEGORY_UPDATE',
    targetType: 'CATEGORY',
    targetId: category.id,
    reason: 'Category details updated',
    metadata: { previousName: existing.name, newName: category.name, isActive: category.isActive },
    ipAddress,
    userAgent,
  });

  return category;
}

export async function archiveOrDeleteCategoryInDb(params: {
  adminUser: { id: string; email: string };
  id: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, id, ipAddress, userAgent } = params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { packages: true } } },
  });

  if (!category) {
    throw new Error('Category not found.');
  }

  // Referential Integrity: if referenced by packages, NEVER hard delete. Deactivate/archive instead.
  if (category._count.packages > 0) {
    const updated = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: UserRole.ADMIN,
      action: 'CATEGORY_ARCHIVE',
      targetType: 'CATEGORY',
      targetId: id,
      reason: `Category archived because it is referenced by ${category._count.packages} packages.`,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      action: 'ARCHIVED',
      message: `Category referenced by ${category._count.packages} package(s). Deactivated and archived to preserve historical package data.`,
      category: updated,
    };
  }

  // If 0 packages reference it, safe hard delete
  await prisma.category.delete({ where: { id } });

  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: UserRole.ADMIN,
    action: 'CATEGORY_DELETE',
    targetType: 'CATEGORY',
    targetId: id,
    reason: 'Zero packages referenced; category permanently removed.',
    ipAddress,
    userAgent,
  });

  return {
    success: true,
    action: 'DELETED',
    message: 'Category successfully deleted.',
  };
}

// ─── BOOKINGS & FINANCIAL OPERATIONS ─────────────────────────

export interface GetAdminBookingsFilter {
  search?: string;
  bookingStatus?: BookingStatus;
  paymentStatus?: PaymentStatus;
  providerId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export async function getAdminBookingsWithFilters(params: GetAdminBookingsFilter = {}) {
  const {
    search,
    bookingStatus,
    paymentStatus,
    providerId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = params;

  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;

  const dateFilter: Prisma.DateTimeFilter | undefined =
    startDate || endDate
      ? {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        }
      : undefined;

  const where: Prisma.BookingWhereInput = {
    ...(bookingStatus ? { bookingStatus } : {}),
    ...(providerId ? { providerId } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
    ...(paymentStatus
      ? { payments: { some: { status: paymentStatus } } }
      : {}),
    ...(search
      ? {
          OR: [
            { bookingRef: { contains: search, mode: 'insensitive' } },
            { contactName: { contains: search, mode: 'insensitive' } },
            { contactEmail: { contains: search, mode: 'insensitive' } },
            { customer: { fullName: { contains: search, mode: 'insensitive' } } },
            { package: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, records] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        provider: true,
        package: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        refunds: true,
        settlement: true,
      },
    }),
  ]);

  const items = records.map((b) => {
    const latestPayment = b.payments[0] ?? null;
    return {
      id: b.id,
      bookingRef: b.bookingRef,
      customerId: b.customerId,
      customerName: b.customer?.fullName || b.contactName || 'Guest',
      customerEmail: b.contactEmail || '',
      providerId: b.providerId,
      providerName: b.provider?.businessName || 'Provider',
      packageId: b.packageId,
      packageName: b.package?.name || 'Tour Package',
      travelDate: b.travelDate.toISOString(),
      adults: b.adults,
      children: b.children,
      totalAmount: b.totalAmount,
      commissionRate: b.commissionRate,
      commissionAmount: b.commissionAmount,
      providerAmount: b.providerAmount,
      bookingStatus: b.bookingStatus,
      paymentStatus: latestPayment?.status ?? 'PENDING',
      transactionId: latestPayment?.transactionId ?? null,
      refundAmount: b.refundAmount ?? null,
      refundStatus: b.refundStatus ?? null,
      createdAt: b.createdAt.toISOString(),
      settlementStatus: b.settlement?.status ?? null,
    };
  });

  return {
    items,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
}

// ─── OPERATIONAL REPORTS & CSV EXPORT ────────────────────────

export async function getAdminOperationalReport(params: { startDate?: Date; endDate?: Date } = {}) {
  const { startDate, endDate } = params;
  const dateFilter: Prisma.DateTimeFilter | undefined =
    startDate || endDate
      ? {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        }
      : undefined;

  const bookingWhere: Prisma.BookingWhereInput = dateFilter ? { createdAt: dateFilter } : {};

  // Bookings grouped by status
  const bookingsByStatus = await prisma.booking.groupBy({
    by: ['bookingStatus'],
    _count: { id: true },
    _sum: { totalAmount: true },
    where: bookingWhere,
  });

  // Top providers by completed/confirmed volume
  const topProvidersGroup = await prisma.booking.groupBy({
    by: ['providerId'],
    _count: { id: true },
    _sum: { totalAmount: true, providerAmount: true, commissionAmount: true },
    where: {
      ...bookingWhere,
      bookingStatus: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    },
    orderBy: {
      _sum: { totalAmount: 'desc' },
    },
    take: 10,
  });

  const providerIds = topProvidersGroup.map((t) => t.providerId);
  const providerProfiles = await prisma.providerProfile.findMany({
    where: { id: { in: providerIds } },
    select: { id: true, businessName: true, city: true, state: true, rating: true },
  });
  const providerMap = new Map(providerProfiles.map((p) => [p.id, p]));

  const topProviders = topProvidersGroup.map((t) => {
    const prof = providerMap.get(t.providerId);
    return {
      providerId: t.providerId,
      businessName: prof?.businessName || 'Unknown Operator',
      city: prof?.city || '',
      rating: prof?.rating || 0,
      bookingCount: t._count.id,
      grossAmount: t._sum.totalAmount || 0,
      providerEarnings: t._sum.providerAmount || 0,
      commissionGenerated: t._sum.commissionAmount || 0,
    };
  });

  return {
    bookingsByStatus: bookingsByStatus.map((b) => ({
      status: b.bookingStatus,
      count: b._count.id,
      volume: b._sum.totalAmount || 0,
    })),
    topProviders,
  };
}

/**
 * Formula Injection Protection:
 * Sanitizes cell values to neutralize spreadsheet formula injection vulnerabilities.
 * Prepends a single quote if the first character is =, +, -, @, \t, or \r.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  // Neutralize formula triggers
  if (/^[=+\-@\t\r]/.test(str)) {
    return `"'${str.replace(/"/g, '""')}"`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function generateOperationalCsv(type: 'bookings' | 'settlements' | 'providers') {
  if (type === 'bookings') {
    const records = await prisma.booking.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        provider: true,
        package: true,
        payments: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    const headers = [
      'Booking Ref',
      'Created Date',
      'Travel Date',
      'Customer Name',
      'Customer Email',
      'Provider Name',
      'Package Name',
      'Booking Status',
      'Total Amount (INR)',
      'Commission Amount (INR)',
      'Provider Payable (INR)',
      'Payment Status',
    ];

    const rows = records.map((b) => [
      sanitizeCsvCell(b.bookingRef),
      sanitizeCsvCell(b.createdAt.toISOString().slice(0, 10)),
      sanitizeCsvCell(b.travelDate.toISOString().slice(0, 10)),
      sanitizeCsvCell(b.customer?.fullName || b.contactName || 'Guest'),
      sanitizeCsvCell(b.contactEmail || ''),
      sanitizeCsvCell(b.provider?.businessName || ''),
      sanitizeCsvCell(b.package?.name || ''),
      sanitizeCsvCell(b.bookingStatus),
      sanitizeCsvCell(b.totalAmount),
      sanitizeCsvCell(b.commissionAmount),
      sanitizeCsvCell(b.providerAmount),
      sanitizeCsvCell(b.payments[0]?.status ?? 'PENDING'),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  if (type === 'settlements') {
    const records = await prisma.settlementLedger.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      include: {
        provider: true,
        booking: true,
      },
    });

    const headers = [
      'Settlement ID',
      'Booking Ref',
      'Provider Name',
      'Gross Amount (INR)',
      'Commission (INR)',
      'Provider Payable (INR)',
      'Status',
      'Settled Date',
      'Created Date',
    ];

    const rows = records.map((s) => [
      sanitizeCsvCell(s.id),
      sanitizeCsvCell(s.booking.bookingRef),
      sanitizeCsvCell(s.provider.businessName),
      sanitizeCsvCell(s.grossAmount),
      sanitizeCsvCell(s.commissionAmount),
      sanitizeCsvCell(s.providerAmount),
      sanitizeCsvCell(s.status),
      sanitizeCsvCell(s.settledAt ? s.settledAt.toISOString().slice(0, 10) : 'UNSETTLED'),
      sanitizeCsvCell(s.createdAt.toISOString().slice(0, 10)),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  // providers
  const records = await prisma.providerProfile.findMany({
    take: 500,
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      _count: { select: { packages: true, bookings: true } },
    },
  });

  const headers = [
    'Provider ID',
    'Business Name',
    'Owner Name',
    'Category',
    'Email',
    'Phone',
    'City',
    'State',
    'Verification Status',
    'Account Active',
    'Total Packages',
    'Total Bookings',
    'Joined Date',
  ];

  const rows = records.map((p) => [
    sanitizeCsvCell(p.id),
    sanitizeCsvCell(p.businessName),
    sanitizeCsvCell(p.ownerName),
    sanitizeCsvCell(p.businessCategory),
    sanitizeCsvCell(p.user.email),
    sanitizeCsvCell(p.user.phone || ''),
    sanitizeCsvCell(p.city),
    sanitizeCsvCell(p.state),
    sanitizeCsvCell(p.verificationStatus),
    sanitizeCsvCell(p.isActive ? 'ACTIVE' : 'SUSPENDED'),
    sanitizeCsvCell(p._count.packages),
    sanitizeCsvCell(p._count.bookings),
    sanitizeCsvCell(p.joinedAt.toISOString().slice(0, 10)),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

// ─── USER & IDENTITY MANAGEMENT (ALL ROLES) ─────────────────

export interface GetAdminUsersParams {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export async function getAdminUsers(params: GetAdminUsersParams = {}) {
  const { search, role, status, startDate, endDate, page = 1, limit = 20 } = params;
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;

  const dateFilter: Prisma.DateTimeFilter | undefined =
    startDate || endDate
      ? {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        }
      : undefined;

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { customerProfile: { fullName: { contains: search, mode: 'insensitive' } } },
            { providerProfile: { businessName: { contains: search, mode: 'insensitive' } } },
            { providerProfile: { ownerName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customerProfile: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            city: true,
            state: true,
            isBlocked: true,
            suspensionReason: true,
            _count: { select: { bookings: true, reviews: true } },
          },
        },
        providerProfile: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            businessCategory: true,
            city: true,
            state: true,
            verificationStatus: true,
            isActive: true,
            rating: true,
            _count: { select: { packages: true, bookings: true } },
          },
        },
        _count: { select: { sessions: true } },
      },
    }),
  ]);

  const items = users.map((u) => {
    const cust = u.customerProfile;
    const prov = u.providerProfile;
    const name = cust?.fullName || prov?.businessName || (u.role === 'ADMIN' ? 'Platform Administrator' : 'User');
    return {
      id: u.id,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      name,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      activeSessionsCount: u._count.sessions,
      customerProfile: cust
        ? {
            id: cust.id,
            fullName: cust.fullName,
            city: cust.city,
            state: cust.state,
            isBlocked: cust.isBlocked,
            suspensionReason: cust.suspensionReason,
            bookingCount: cust._count.bookings,
            reviewCount: cust._count.reviews,
          }
        : null,
      providerProfile: prov
        ? {
            id: prov.id,
            businessName: prov.businessName,
            ownerName: prov.ownerName,
            category: prov.businessCategory,
            city: prov.city,
            state: prov.state,
            verificationStatus: prov.verificationStatus,
            isActive: prov.isActive,
            rating: prov.rating,
            packagesCount: prov._count.packages,
            bookingsCount: prov._count.bookings,
          }
        : null,
    };
  });

  return {
    items,
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
}

export async function getUserDetailsForAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customerProfile: {
        include: {
          bookings: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              package: { select: { id: true, name: true, slug: true } },
              payments: { select: { id: true, amount: true, status: true } },
            },
          },
        },
      },
      providerProfile: {
        include: {
          packages: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, slug: true, status: true, approvalStatus: true, finalPrice: true },
          },
          documents: {
            select: { id: true, type: true, fileName: true, fileSize: true, status: true, uploadedAt: true },
          },
          settlements: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, grossAmount: true, commissionAmount: true, providerAmount: true, status: true },
          },
        },
      },
      sessions: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, ipAddress: true, userAgent: true, expiresAt: true, createdAt: true },
      },
    },
  });

  if (!user) return null;

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { targetId: user.id },
        { actorId: user.id },
        ...(user.customerProfile ? [{ targetId: user.customerProfile.id }] : []),
        ...(user.providerProfile ? [{ targetId: user.providerProfile.id }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  // Check financial records count to inform UI about deletion eligibility
  const [customerBookingsCount, providerBookingsCount] = await Promise.all([
    user.customerProfile ? prisma.booking.count({ where: { customerId: user.customerProfile.id } }) : 0,
    user.providerProfile ? prisma.booking.count({ where: { providerId: user.providerProfile.id } }) : 0,
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    customerProfile: user.customerProfile,
    providerProfile: user.providerProfile,
    sessions: user.sessions,
    auditLogs,
    financialSummary: {
      hasFinancialRecords: (customerBookingsCount + providerBookingsCount) > 0,
      customerBookingsCount,
      providerBookingsCount,
      canPermanentlyDeleteWithoutRetention: (customerBookingsCount + providerBookingsCount) === 0,
    },
  };
}

export async function updateUserStatusInDb(params: {
  adminUser: { id: string; email: string };
  userId: string;
  status: UserStatus;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, userId, status, reason, ipAddress, userAgent } = params;

  if (!reason || reason.trim().length === 0) {
    throw new Error('A descriptive reason is strictly required for modifying user account status.');
  }

  // Safety Check 1: Admin cannot suspend themselves
  if (adminUser.id === userId && status !== UserStatus.ACTIVE) {
    throw new Error('Action Prohibited: You cannot suspend or deactivate your own administrator account.');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { customerProfile: true, providerProfile: true },
  });

  if (!targetUser) {
    throw new Error('Target user not found.');
  }

  // Safety Check 2: Cannot suspend the last active administrator
  if (targetUser.role === UserRole.ADMIN && status !== UserStatus.ACTIVE) {
    const activeAdminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    });
    if (activeAdminCount <= 1) {
      throw new Error('Action Prohibited: Cannot suspend or deactivate the last active administrator on the platform.');
    }
  }

  const isSuspended = status === UserStatus.SUSPENDED;
  const isInactive = status === UserStatus.INACTIVE;

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { status },
    });

    if (targetUser.customerProfile) {
      await tx.customerProfile.update({
        where: { id: targetUser.customerProfile.id },
        data: {
          isBlocked: isSuspended || isInactive,
          suspensionReason: (isSuspended || isInactive) ? reason.trim() : null,
        },
      });
    }

    if (targetUser.providerProfile) {
      await tx.providerProfile.update({
        where: { id: targetUser.providerProfile.id },
        data: {
          isActive: status === UserStatus.ACTIVE,
          suspensionReason: (isSuspended || isInactive) ? reason.trim() : null,
        },
      });
    }

    // Immediately destroy all active sessions if user is suspended or deactivated
    if (isSuspended || isInactive) {
      await tx.session.deleteMany({ where: { userId } });
    }

    return updatedUser;
  });

  // Write audit log
  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: UserRole.ADMIN,
    action: isSuspended ? 'USER_SUSPEND' : isInactive ? 'USER_DEACTIVATE' : 'USER_ACTIVATE',
    targetType: 'USER',
    targetId: userId,
    reason: reason.trim(),
    metadata: {
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
      previousStatus: targetUser.status,
      newStatus: status,
    },
    ipAddress,
    userAgent,
  });

  // Notification (non-blocking)
  try {
    if (isSuspended || isInactive) {
      await createNotificationInDb({
        userId,
        type: NotificationType.ACCOUNT_SUSPENDED,
        title: 'Account Privileges Suspended',
        message: `Your VibeMiles account access has been restricted: "${reason.trim()}". Please contact administrator support.`,
        dedupKey: `notif:user_susp:${Date.now()}:${userId}`,
      });
    } else {
      await createNotificationInDb({
        userId,
        type: NotificationType.ACCOUNT_REACTIVATED,
        title: 'Account Privileges Restored',
        message: 'Your VibeMiles account access has been reactivated. You can now log in normally.',
        link: '/account/dashboard',
        dedupKey: `notif:user_react:${Date.now()}:${userId}`,
      });
    }
  } catch (notifErr) {
    console.error('Notification dispatch error:', notifErr);
  }

  return result;
}

export async function deleteUserInDb(params: {
  adminUser: { id: string; email: string };
  userId: string;
  permanent: boolean;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, userId, permanent, reason, ipAddress, userAgent } = params;

  if (!reason || reason.trim().length === 0) {
    throw new Error('A descriptive reason is strictly required for deleting an account.');
  }

  // Safety Check 1: Admin cannot delete themselves
  if (adminUser.id === userId) {
    throw new Error('Action Prohibited: You cannot delete your own administrator account.');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      customerProfile: true,
      providerProfile: {
        include: { documents: true },
      },
    },
  });

  if (!targetUser) {
    throw new Error('User not found.');
  }

  // Safety Check 2: Cannot delete the last active administrator
  if (targetUser.role === UserRole.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
    if (adminCount <= 1) {
      throw new Error('Action Prohibited: Cannot delete the last administrator account on the platform.');
    }
  }

  // Check financial records
  const [customerBookings, providerBookings] = await Promise.all([
    targetUser.customerProfile ? prisma.booking.count({ where: { customerId: targetUser.customerProfile.id } }) : 0,
    targetUser.providerProfile ? prisma.booking.count({ where: { providerId: targetUser.providerProfile.id } }) : 0,
  ]);

  const hasFinancialRecords = (customerBookings + providerBookings) > 0;

  if (hasFinancialRecords) {
    // Cannot perform hard delete because financial and legal retention mandates keeping booking/payment history!
    // Instead, perform irreversible PII Anonymization or Deactivation
    const result = await prisma.$transaction(
      async (tx) => {
        // Invalidate sessions immediately
        await tx.session.deleteMany({ where: { userId } });

        if (permanent) {
          // Anonymize User PII
          const anonymizedEmail = `anonymized_${userId.slice(-6)}_${Date.now()}@deleted.vibemiles.local`;
          await Promise.all([
            tx.user.update({
              where: { id: userId },
              data: {
                email: anonymizedEmail,
                phone: null,
                passwordHash: null,
                status: UserStatus.INACTIVE,
              },
            }),
            targetUser.customerProfile
              ? tx.customerProfile.update({
                  where: { id: targetUser.customerProfile.id },
                  data: {
                    fullName: 'Deactivated Traveler',
                    avatar: null,
                    emergencyContact: null,
                    city: null,
                    state: null,
                    isBlocked: true,
                    suspensionReason: `Account permanently removed upon user/admin request. Historical bookings preserved for accounting: ${reason}`,
                  },
                })
              : Promise.resolve(),
            targetUser.providerProfile
              ? tx.providerProfile.update({
                  where: { id: targetUser.providerProfile.id },
                  data: {
                    businessName: 'Deactivated Tour Operator',
                    ownerName: 'Deactivated Operator',
                    description: null,
                    logo: null,
                    gallery: [],
                    addressLine1: null,
                    panNumber: null,
                    gstNumber: null,
                    bankAccountHolder: null,
                    bankAccountNumber: null,
                    bankIfsc: null,
                    bankName: null,
                    bankBranch: null,
                    isActive: false,
                    verificationStatus: VerificationStatus.REJECTED,
                    suspensionReason: `Account permanently deleted upon request. Financial ledgers retained: ${reason}`,
                  },
                })
              : Promise.resolve(),
            targetUser.providerProfile
              ? tx.providerDocument.deleteMany({ where: { providerId: targetUser.providerProfile.id } })
              : Promise.resolve(),
          ]);

          return {
            action: 'ANONYMIZED_FOR_RETENTION' as const,
            message: `User has ${customerBookings + providerBookings} historical booking/settlement records required for financial & legal retention. Personal identity information (PII), credentials, phone, and documents were irreversibly anonymized and access terminated.`,
          };
        } else {
          // Soft delete / deactivation
          await Promise.all([
            tx.user.update({
              where: { id: userId },
              data: { status: UserStatus.INACTIVE },
            }),
            targetUser.customerProfile
              ? tx.customerProfile.update({
                  where: { id: targetUser.customerProfile.id },
                  data: { isBlocked: true, suspensionReason: reason.trim() },
                })
              : Promise.resolve(),
            targetUser.providerProfile
              ? tx.providerProfile.update({
                  where: { id: targetUser.providerProfile.id },
                  data: { isActive: false, suspensionReason: reason.trim() },
                })
              : Promise.resolve(),
          ]);

          return {
            action: 'DEACTIVATED' as const,
            message: 'User account has been deactivated and access revoked. Historical records remain preserved.',
          };
        }
      },
      { maxWait: 15000, timeout: 30000 }
    );

    await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: UserRole.ADMIN,
      action: permanent ? 'USER_ANONYMIZED_DELETE' : 'USER_SOFT_DELETE',
      targetType: 'USER',
      targetId: userId,
      reason: reason.trim(),
      metadata: {
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
        hasFinancialRecords: true,
        customerBookings,
        providerBookings,
        outcome: result.action,
      },
      ipAddress,
      userAgent,
    });

    return result;
  }

  // User has NO financial records (0 bookings, 0 settlements):
  if (permanent) {
    // Safe hard delete: bulk-delete related records cleanly, then delete user
    await prisma.$transaction(
      async (tx) => {
        // 1. If provider, delete all packages and their child relations in bulk
        if (targetUser.providerProfile) {
          const providerId = targetUser.providerProfile.id;
          const pkgList = await tx.package.findMany({
            where: { providerId },
            select: { id: true },
          });
          const pkgIds = pkgList.map((p) => p.id);

          if (pkgIds.length > 0) {
            await Promise.all([
              tx.packageImage.deleteMany({ where: { packageId: { in: pkgIds } } }),
              tx.itineraryDay.deleteMany({ where: { packageId: { in: pkgIds } } }),
              tx.packageInclusion.deleteMany({ where: { packageId: { in: pkgIds } } }),
              tx.packageAvailability.deleteMany({ where: { packageId: { in: pkgIds } } }),
              tx.review.deleteMany({ where: { packageId: { in: pkgIds } } }),
            ]);
            await tx.package.deleteMany({ where: { id: { in: pkgIds } } });
          }

          // Delete provider documents & settlements
          await Promise.all([
            tx.providerDocument.deleteMany({ where: { providerId } }),
            tx.settlementLedger.deleteMany({ where: { providerId } }),
          ]);
        }

        // 2. If customer, delete customer reviews (since Review has no cascade on CustomerProfile)
        if (targetUser.customerProfile) {
          await tx.review.deleteMany({ where: { customerId: targetUser.customerProfile.id } });
        }

        // 3. Delete user sessions and notifications
        await Promise.all([
          tx.session.deleteMany({ where: { userId } }),
          tx.notification.deleteMany({ where: { userId } }),
        ]);

        // 4. Delete the user (cascades to customerProfile / providerProfile)
        await tx.user.delete({ where: { id: userId } });
      },
      { maxWait: 15000, timeout: 30000 }
    );

    await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: UserRole.ADMIN,
      action: 'USER_PERMANENT_DELETE',
      targetType: 'USER',
      targetId: userId,
      reason: reason.trim(),
      metadata: {
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
        hasFinancialRecords: false,
        outcome: 'PERMANENTLY_DELETED',
      },
      ipAddress,
      userAgent,
    });

    return {
      action: 'PERMANENTLY_DELETED' as const,
      message: 'User account had no historical financial dependencies and has been permanently purged from the database.',
    };
  } else {
    // Soft delete / deactivation
    await prisma.$transaction(
      async (tx) => {
        await Promise.all([
          tx.session.deleteMany({ where: { userId } }),
          tx.user.update({
            where: { id: userId },
            data: { status: UserStatus.INACTIVE },
          }),
          targetUser.customerProfile
            ? tx.customerProfile.update({
                where: { id: targetUser.customerProfile.id },
                data: { isBlocked: true, suspensionReason: reason.trim() },
              })
            : Promise.resolve(),
          targetUser.providerProfile
            ? tx.providerProfile.update({
                where: { id: targetUser.providerProfile.id },
                data: { isActive: false, suspensionReason: reason.trim() },
              })
            : Promise.resolve(),
        ]);
      },
      { maxWait: 15000, timeout: 30000 }
    );

    await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: UserRole.ADMIN,
      action: 'USER_SOFT_DELETE',
      targetType: 'USER',
      targetId: userId,
      reason: reason.trim(),
      metadata: { targetEmail: targetUser.email, outcome: 'DEACTIVATED' },
      ipAddress,
      userAgent,
    });

    return {
      action: 'DEACTIVATED' as const,
      message: 'User account has been deactivated.',
    };
  }
}

export async function invalidateUserSessionsInDb(userId: string) {
  const result = await prisma.session.deleteMany({ where: { userId } });
  return { deletedSessionsCount: result.count };
}

// ─── SETTLEMENT & PAYOUT MANAGEMENT ──────────────────────────

export interface GetAdminSettlementsParams {
  search?: string;
  status?: string;
  providerId?: string;
  page?: number;
  limit?: number;
}

export async function getAdminSettlements(params: GetAdminSettlementsParams = {}) {
  const { search, status, providerId, page = 1, limit = 20 } = params;
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;

  const where: Prisma.SettlementLedgerWhereInput = {
    ...(status && status !== 'ALL' ? { status } : {}),
    ...(providerId ? { providerId } : {}),
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' } },
            { booking: { bookingRef: { contains: search, mode: 'insensitive' } } },
            { provider: { businessName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, records] = await Promise.all([
    prisma.settlementLedger.count({ where }),
    prisma.settlementLedger.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        provider: { select: { id: true, businessName: true, ownerName: true, bankAccountNumber: true, bankIfsc: true } },
        booking: { select: { id: true, bookingRef: true, travelDate: true, totalAmount: true } },
      },
    }),
  ]);

  return {
    items: records.map((s) => ({
      id: s.id,
      bookingId: s.bookingId,
      bookingRef: s.booking.bookingRef,
      providerId: s.providerId,
      providerName: s.provider.businessName,
      ownerName: s.provider.ownerName,
      bankAccountMasked: s.provider.bankAccountNumber ? '••••' + s.provider.bankAccountNumber.slice(-4) : 'Not Provided',
      bankIfsc: s.provider.bankIfsc,
      grossAmount: s.grossAmount,
      taxAmount: s.taxAmount,
      commissionRate: s.commissionRate,
      commissionAmount: s.commissionAmount,
      providerAmount: s.providerAmount,
      status: s.status,
      settledAt: s.settledAt ? s.settledAt.toISOString() : null,
      referenceNote: s.referenceNote,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take),
    },
  };
}

export async function updateSettlementStatusInDb(params: {
  adminUser: { id: string; email: string };
  settlementId: string;
  status: string;
  referenceNote?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, settlementId, status, referenceNote, ipAddress, userAgent } = params;

  const existing = await prisma.settlementLedger.findUnique({
    where: { id: settlementId },
    include: { provider: true, booking: true },
  });

  if (!existing) {
    throw new Error('Settlement entry not found.');
  }

  const updated = await prisma.settlementLedger.update({
    where: { id: settlementId },
    data: {
      status,
      referenceNote: referenceNote ? referenceNote.trim() : existing.referenceNote,
      settledAt: status === 'SETTLED' ? new Date() : existing.settledAt,
    },
  });

  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: UserRole.ADMIN,
    action: 'SETTLEMENT_UPDATE',
    targetType: 'SETTLEMENT',
    targetId: settlementId,
    reason: `Settlement status updated from ${existing.status} to ${status}. Note: ${referenceNote || 'N/A'}`,
    metadata: {
      bookingRef: existing.booking.bookingRef,
      providerName: existing.provider.businessName,
      providerAmount: existing.providerAmount,
      commissionAmount: existing.commissionAmount,
    },
    ipAddress,
    userAgent,
  });

  return updated;
}

