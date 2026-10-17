export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsListResponse {
  success: boolean;
  items: AppNotification[];
  total: number;
  unreadCount: number;
  totalPages: number;
}

class NotificationService {
  async getNotifications(options?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsListResponse> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.unreadOnly) params.set('unreadOnly', 'true');

    const res = await fetch(`/api/notifications?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to retrieve notifications');
    }

    return res.json();
  }

  async getUnreadCount(): Promise<number> {
    const res = await fetch('/api/notifications/unread-count', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      return 0;
    }

    const data = await res.json();
    return data.unreadCount || 0;
  }

  async markAsRead(id: string): Promise<boolean> {
    const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'include',
    });

    return res.ok;
  }

  async markAllAsRead(): Promise<number> {
    const res = await fetch('/api/notifications/read-all', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    const data = await res.json();
    return data.count || 0;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    return res.ok;
  }

  async broadcastAnnouncement(params: {
    title: string;
    message: string;
    targetRole?: 'ALL' | 'CUSTOMER' | 'PROVIDER';
    link?: string;
  }): Promise<{ sentCount: number; totalEligible: number }> {
    const res = await fetch('/api/admin/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to broadcast announcement');
    }

    return data;
  }
}

export const notificationService = new NotificationService();
