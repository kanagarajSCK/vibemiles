import { NextRequest, NextResponse } from 'next/server';
import { requireRole, AuthError } from '@/server/auth/guard';
import { prisma } from '@/lib/prisma';
import { createNotificationInDb } from '@/server/db/notifications';
import { NotificationType, UserRole } from '@prisma/client';
import { recordAuditLog } from '@/server/db/admin';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(['admin']);

    const body = await req.json();
    const { title, message, link, targetRole } = body;

    if (!title || title.trim().length < 3) {
      return NextResponse.json({ error: 'Broadcast title must be at least 3 characters long' }, { status: 400 });
    }
    if (!message || message.trim().length < 5) {
      return NextResponse.json({ error: 'Broadcast message body must be at least 5 characters long' }, { status: 400 });
    }

    const whereRole: { role?: UserRole } = {};
    if (targetRole === 'CUSTOMER') whereRole.role = UserRole.CUSTOMER;
    if (targetRole === 'PROVIDER') whereRole.role = UserRole.PROVIDER;

    const targetUsers = await prisma.user.findMany({
      where: {
        ...whereRole,
        status: 'ACTIVE',
      },
      select: { id: true, email: true },
      take: 1000,
    });

    const broadcastBatchId = `broadcast-${Date.now()}`;
    let sentCount = 0;

    for (const u of targetUsers) {
      const res = await createNotificationInDb({
        userId: u.id,
        type: NotificationType.SYSTEM_BROADCAST,
        title: title.trim(),
        message: message.trim(),
        link: link?.trim() || undefined,
        dedupKey: `notif:${broadcastBatchId}:${u.id}`,
      });
      if (res) sentCount++;
    }

    // Log admin audit entry
    await recordAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: 'ADMIN',
      action: 'SYSTEM_BROADCAST_SENT',
      targetType: 'SYSTEM',
      targetId: broadcastBatchId,
      reason: title.trim(),
      metadata: {
        targetRole: targetRole || 'ALL',
        sentCount,
        totalEligible: targetUsers.length,
      },
    });

    return NextResponse.json({
      success: true,
      sentCount,
      totalEligible: targetUsers.length,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return err.toResponse();
    }
    const errorMsg = err instanceof Error ? err.message : 'Failed to send broadcast';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
