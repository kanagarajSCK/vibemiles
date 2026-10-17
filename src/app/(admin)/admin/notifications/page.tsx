'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Send, Megaphone, Users, Building2, CheckCircle2,
  AlertCircle, RefreshCw, CheckCheck, Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { notificationService, AppNotification } from '@/services/notification.service';
import { formatDate } from '@/lib/utils';

export default function AdminNotificationsPage() {
  // Broadcast form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [targetRole, setTargetRole] = useState<'ALL' | 'CUSTOMER' | 'PROVIDER'>('ALL');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ count: number; message: string } | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Admin personal notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async (targetPage = 1) => {
    try {
      const data = await notificationService.getNotifications({ page: targetPage, limit: 10 });
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(targetPage);
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setBroadcastError('Please provide both an announcement title and message content.');
      return;
    }

    setIsBroadcasting(true);
    setBroadcastResult(null);
    setBroadcastError(null);

    try {
      const res = await notificationService.broadcastAnnouncement({
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || undefined,
        targetRole,
      });

      setBroadcastResult({
        count: res.sentCount,
        message: `Successfully broadcasted to ${res.sentCount} active account(s) out of ${res.totalEligible} eligible.`,
      });

      // Reset form
      setTitle('');
      setMessage('');
      setLink('');

      // Refresh admin's own feed as well
      loadNotifications(1);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to dispatch platform broadcast.';
      setBroadcastError(errorMsg);
    } finally {
      setIsBroadcasting(false);
    }
  }

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
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
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

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-teal-700" /> Platform Broadcast & Notifications Hub
        </h1>
        <p className="text-xs text-slate-500">
          Publish system-wide alerts, seasonal promotions, or operational advisories to marketplace users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Broadcast Form */}
        <div className="lg:col-span-6 space-y-4">
          <form
            onSubmit={handleBroadcast}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Megaphone className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">Create Broadcast Announcement</h2>
            </div>

            {broadcastResult && (
              <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-teal-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">{broadcastResult.message}</p>
                  <p className="text-teal-700">
                    Successfully broadcasted to {broadcastResult.count} recipient(s).
                  </p>
                </div>
              </div>
            )}

            {broadcastError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold">{broadcastError}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Recipient Target
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetRole('ALL')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    targetRole === 'ALL'
                      ? 'border-teal-700 bg-teal-50 text-teal-900 ring-1 ring-teal-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> All Users
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole('CUSTOMER')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    targetRole === 'CUSTOMER'
                      ? 'border-teal-700 bg-teal-50 text-teal-900 ring-1 ring-teal-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Travelers
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole('PROVIDER')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    targetRole === 'PROVIDER'
                      ? 'border-teal-700 bg-teal-50 text-teal-900 ring-1 ring-teal-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Operators
                </button>
              </div>
            </div>

            <Input
              label="Broadcast Title"
              placeholder="e.g. Festival Season Marketplace Discount!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Announcement Message
              </label>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-colors"
                placeholder="Enter the broadcast message that will appear in user notification centers..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <Input
              label="Action Link (Optional)"
              placeholder="e.g. /packages or https://vibemiles.com/offer"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />

            <div className="pt-2">
              <Button
                variant="accent"
                size="md"
                className="w-full"
                type="submit"
                disabled={isBroadcasting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                {isBroadcasting ? 'Broadcasting Alert...' : 'Dispatch Broadcast'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Admin Notifications & Audit Feed */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-700" />
                <h2 className="text-base font-bold text-slate-900">Admin Notification Feed</h2>
                {unreadCount > 0 && <Badge variant="brand">{unreadCount} New</Badge>}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
                    onClick={handleMarkAllAsRead}
                  >
                    Mark read
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

            {loading ? (
              <LoadingState label="Loading admin alerts..." />
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-xs">No admin notifications recorded.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`py-3 flex items-start justify-between gap-3 ${
                      !notif.isRead ? 'bg-teal-50/40 px-2 rounded-lg' : ''
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
                        {!notif.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-600 shrink-0" />
                        )}
                        <span className="text-[10px] text-slate-400 ml-auto shrink-0">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{notif.message}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          title="Mark read"
                          className="p-1 rounded text-slate-400 hover:text-teal-700 hover:bg-slate-100"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif.id)}
                        title="Delete"
                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Page {page} of {totalPages} ({total} total)
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => loadNotifications(page - 1)}
                  >
                    Prev
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
        </div>
      </div>
    </div>
  );
}
