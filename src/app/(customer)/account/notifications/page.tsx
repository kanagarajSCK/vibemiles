'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { notificationService, AppNotification } from '@/services/notification.service';
import { formatDate } from '@/lib/utils';

export default function AccountNotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadNotifications = useCallback(async (targetPage = 1) => {
    try {
      const data = await notificationService.getNotifications({ page: targetPage, limit: 15 });
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(targetPage);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  async function handleMarkRead(id: string) {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  }

  async function handleMarkAllAsRead() {
    setActionLoading(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await notificationService.deleteNotification(id);
      const wasUnread = notifications.find((n) => n.id === id)?.isRead === false;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }

  if (loading) {
    return <LoadingState label="Loading alerts & trip updates..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-teal-700" /> Notifications & Alerts
          </h1>
          <p className="text-xs text-slate-500">
            Real-time updates regarding reservations, confirmations, payments, and trip alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <Badge variant="brand">{unreadCount} Unread</Badge>}
          {notifications.length > 0 && unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 mb-4">
            <Bell className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            You don&apos;t have any notifications right now. Trip confirmations and alerts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 shadow-sm transition-all flex items-start justify-between gap-4 ${
                !n.isRead ? 'border-teal-300 bg-teal-50/40' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                  {!n.isRead && (
                    <span className="inline-block h-2 w-2 rounded-full bg-teal-600" />
                  )}
                  <span className="text-[10px] text-slate-400 ml-auto">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                {n.link && (
                  <div className="pt-1">
                    <Link
                      href={n.link}
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800"
                    >
                      View Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  title="Delete notification"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => loadNotifications(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => loadNotifications(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
