'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell, CheckCheck, Trash2, ArrowRight,
  CalendarCheck, CreditCard, Star, Package, ShieldCheck,
  Megaphone, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { notificationService, AppNotification } from '@/services/notification.service';
import { formatDate } from '@/lib/utils';

export default function PartnerNotificationsPage() {
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
      console.error('Failed to load partner notifications:', err);
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
      console.error('Failed to mark notification read:', err);
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
      console.error('Failed to mark all notifications read:', err);
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

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return { icon: CalendarCheck, color: 'text-teal-600 bg-teal-50' };
      case 'PAYMENT_SUCCESS':
        return { icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' };
      case 'NEW_REVIEW':
        return { icon: Star, color: 'text-amber-600 bg-amber-50' };
      case 'LISTING_APPROVED':
        return { icon: Package, color: 'text-sky-600 bg-sky-50' };
      case 'LISTING_REJECTED':
        return { icon: Package, color: 'text-rose-600 bg-rose-50' };
      case 'PROVIDER_VERIFIED':
        return { icon: ShieldCheck, color: 'text-teal-700 bg-teal-50' };
      case 'SYSTEM_BROADCAST':
        return { icon: Megaphone, color: 'text-violet-600 bg-violet-50' };
      case 'ACCOUNT_SUSPENDED':
      case 'PROVIDER_REJECTED':
        return { icon: AlertCircle, color: 'text-rose-600 bg-rose-50' };
      default:
        return { icon: Bell, color: 'text-slate-600 bg-slate-50' };
    }
  }

  if (loading) {
    return <LoadingState label="Loading partner alerts & updates..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Partner Notifications</h1>
          {unreadCount > 0 ? (
            <p className="text-sm text-slate-500 mt-1">
              You have <span className="font-bold text-teal-700">{unreadCount} unread</span> notifications.
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Operational updates, booking confirmations, new traveler reviews, and verification statuses.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <Badge variant="brand">{unreadCount} Unread</Badge>}
          {notifications.length > 0 && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading}
              leftIcon={<CheckCheck className="w-4 h-4" />}
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => loadNotifications(page)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm space-y-3">
          <Bell className="w-10 h-10 text-slate-200 mx-auto" />
          <p className="font-semibold text-slate-700">No notifications yet</p>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Booking alerts, traveler reviews, listing moderation notes, and verification updates will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
          {notifications.map((notif) => {
            const { icon: Icon, color } = getNotificationIcon(notif.type);
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-5 transition-colors ${
                  !notif.isRead ? 'bg-teal-50/30 hover:bg-teal-50/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-slate-900">{notif.title}</p>
                    {!notif.isRead && (
                      <Badge variant="brand" className="text-[10px] py-0 shrink-0">
                        NEW
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-4 pt-1">
                    <p className="text-[10px] text-slate-400">{formatDate(notif.createdAt)}</p>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-800"
                      >
                        View Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.id)}
                    title="Delete notification"
                    className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-slate-500">
            Page {page} of {totalPages} ({total} total alerts)
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
  );
}
