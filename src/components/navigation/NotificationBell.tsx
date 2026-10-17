'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { notificationService } from '@/services/notification.service';

interface NotificationBellProps {
  href: string;
  className?: string;
  dotClassName?: string;
}

export function NotificationBell({
  href,
  className = 'flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors relative',
  dotClassName = 'bg-teal-500 ring-1 ring-white',
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchUnread() {
      try {
        const count = await notificationService.getUnreadCount();
        if (isMounted) {
          setUnreadCount(count);
        }
      } catch {
        // Silent catch for guest / unauthenticated states
      }
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s heartbeat

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link href={href} className={className} aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}>
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span
          className={`absolute top-1 right-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 text-[9px] font-black text-white rounded-full ${dotClassName}`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
