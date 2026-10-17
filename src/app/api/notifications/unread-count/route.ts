import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/server/auth/guard';
import { getUnreadNotificationCount } from '@/server/db/notifications';

export async function GET(_req: NextRequest) {
  try {
    const auth = await getSessionUser();
    if (!auth) {
      return NextResponse.json({ success: true, unreadCount: 0 });
    }

    const unreadCount = await getUnreadNotificationCount(auth.user.id);
    return NextResponse.json({ success: true, unreadCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve unread count';
    return NextResponse.json({ error: message, unreadCount: 0 }, { status: 500 });
  }
}
