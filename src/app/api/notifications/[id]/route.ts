import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/server/auth/guard';
import { markNotificationAsRead, deleteNotificationFromDb } from '@/server/db/notifications';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const resolvedParams = await params;

    const success = await markNotificationAsRead(auth.user.id, resolvedParams.id);
    if (!success) {
      return NextResponse.json({ error: 'Notification not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    const resolvedParams = await params;

    const success = await deleteNotificationFromDb(auth.user.id, resolvedParams.id);
    if (!success) {
      return NextResponse.json({ error: 'Notification not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
