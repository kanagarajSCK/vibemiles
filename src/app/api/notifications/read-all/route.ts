import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guard';
import { markAllNotificationsAsRead } from '@/server/db/notifications';

export async function POST(_req: NextRequest) {
  try {
    const auth = await requireAuth();
    const count = await markAllNotificationsAsRead(auth.user.id);
    return NextResponse.json({ success: true, count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to mark all as read';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
