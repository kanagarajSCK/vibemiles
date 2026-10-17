import { prisma } from '@/lib/prisma';
import { NotificationType, Notification as PrismaNotification, Prisma } from '@prisma/client';
import { handleDbError } from './errors';
import { deliveryService } from '../notifications/delivery';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  dedupKey?: string;
}

export interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface NotificationDomain {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  dedupKey: string | null;
  createdAt: string;
  updatedAt: string;
}

function sanitizeNotificationMetadata(data?: Record<string, unknown>): Prisma.InputJsonValue | undefined {
  if (!data) return undefined;
  const sanitized: Record<string, unknown> = {};
  const sensitivePatterns = ['password', 'token', 'secret', 'key', 'auth', 'cvv', 'pan', 'accountnumber', 'card'];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitivePatterns.some((pattern) => lowerKey.includes(pattern))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as Prisma.InputJsonValue;
}

function mapPrismaNotificationToDomain(n: PrismaNotification): NotificationDomain {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    metadata: n.metadata as Record<string, unknown> | null,
    isRead: n.isRead,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    dedupKey: n.dedupKey,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

/**
 * Creates an in-app notification in Supabase PostgreSQL with built-in deduplication.
 * Safe execution: errors are caught and logged; failures never roll back calling business logic.
 */
export async function createNotificationInDb(params: CreateNotificationParams): Promise<NotificationDomain | null> {
  try {
    const { userId, type, title, message, link, metadata, dedupKey } = params;

    // Verify recipient user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true },
    });
    if (!user) {
      console.warn(`[Notification] Recipient user ${userId} not found, skipping.`);
      return null;
    }

    const safeMetadata = sanitizeNotificationMetadata(metadata);

    let notificationRecord: PrismaNotification;

    if (dedupKey && dedupKey.trim()) {
      // Idempotent upsert
      notificationRecord = await prisma.notification.upsert({
        where: { dedupKey: dedupKey.trim() },
        update: {}, // No-op if already processed
        create: {
          userId,
          type,
          title: title.trim(),
          message: message.trim(),
          link: link?.trim() || null,
          metadata: safeMetadata,
          dedupKey: dedupKey.trim(),
        },
      });
    } else {
      notificationRecord = await prisma.notification.create({
        data: {
          userId,
          type,
          title: title.trim(),
          message: message.trim(),
          link: link?.trim() || null,
          metadata: safeMetadata,
        },
      });
    }

    // Trigger external delivery asynchronously without blocking or throwing
    deliveryService.deliver({
      recipientEmail: user.email,
      recipientPhone: user.phone || undefined,
      type: String(type),
      subject: title.trim(),
      text: message.trim(),
      link: link || undefined,
      metadata: metadata || undefined,
    }).catch((err) => {
      console.error('[Notification] External delivery warning:', err);
    });

    return mapPrismaNotificationToDomain(notificationRecord);
  } catch (error) {
    console.error('[Notification] Failed to create notification in DB:', error);
    return null;
  }
}

/**
 * Retrieves paginated notifications strictly scoped to the requesting recipient user.
 */
export async function getNotificationsForUser(
  userId: string,
  options?: GetNotificationsOptions
): Promise<{ items: NotificationDomain[]; total: number; unreadCount: number; totalPages: number }> {
  try {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(options?.unreadOnly ? { isRead: false } : {}),
    };

    const [records, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: records.map(mapPrismaNotificationToDomain),
      total,
      unreadCount,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    return handleDbError(error, `getNotificationsForUser(${userId})`, () => ({
      items: [],
      total: 0,
      unreadCount: 0,
      totalPages: 1,
    }));
  }
}

/**
 * Marks a single notification as read, enforcing recipient ownership.
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
  try {
    const updated = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return updated.count > 0;
  } catch (error) {
    return handleDbError(error, `markNotificationAsRead(${notificationId})`, () => false);
  }
}

/**
 * Marks all unread notifications for a user as read.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  } catch (error) {
    return handleDbError(error, `markAllNotificationsAsRead(${userId})`, () => 0);
  }
}

/**
 * Deletes a notification, enforcing recipient ownership.
 */
export async function deleteNotificationFromDb(userId: string, notificationId: string): Promise<boolean> {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    return handleDbError(error, `deleteNotificationFromDb(${notificationId})`, () => false);
  }
}

/**
 * Gets real-time unread notification count for badge display.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  } catch (error) {
    return handleDbError(error, `getUnreadNotificationCount(${userId})`, () => 0);
  }
}
