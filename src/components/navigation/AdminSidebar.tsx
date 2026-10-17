'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Grid3X3,
  CalendarCheck,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  Tag,
  Bell,
  BarChart2,
  Star,
  Settings,
  ShieldAlert,
  LogOut,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';

const ADMIN_NAV_ITEMS = [
  { label: 'Overview', href: ROUTES.ADMIN_OVERVIEW, icon: LayoutDashboard },
  { label: 'All Users', href: ROUTES.ADMIN_USERS, icon: Users },
  { label: 'Providers & KYC', href: ROUTES.ADMIN_PROVIDERS, icon: Building2 },
  { label: 'Packages & Listings', href: ROUTES.ADMIN_PACKAGES, icon: Package },
  { label: 'Categories', href: ROUTES.ADMIN_CATEGORIES, icon: Grid3X3 },
  { label: 'Bookings', href: ROUTES.ADMIN_BOOKINGS, icon: CalendarCheck },
  { label: 'Payments & Revenue', href: ROUTES.ADMIN_PAYMENTS, icon: CreditCard },
  { label: 'Payouts & Settlements', href: ROUTES.ADMIN_SETTLEMENTS, icon: RotateCcw },
  { label: 'Refund Requests', href: ROUTES.ADMIN_REFUNDS, icon: RotateCcw },
  { label: 'Reviews Moderation', href: ROUTES.ADMIN_REVIEWS, icon: Star },
  { label: 'Disputes & Support', href: ROUTES.ADMIN_DISPUTES, icon: AlertTriangle },
  { label: 'Notifications Hub', href: ROUTES.ADMIN_NOTIFICATIONS, icon: Bell },
  { label: 'Audit Logs', href: ROUTES.ADMIN_AUDIT_LOGS, icon: ShieldAlert },
  { label: 'Reports & Analytics', href: ROUTES.ADMIN_REPORTS, icon: BarChart2 },
  { label: 'System Settings', href: ROUTES.ADMIN_SETTINGS, icon: Settings },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block lg:w-64 shrink-0 space-y-6">
      {/* Admin Badge */}
      <div className="rounded-2xl border border-rose-950 bg-slate-950 p-5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-rose-100">Super Admin</h3>
            <p className="text-xs text-rose-300/70">Master Control Hub</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm space-y-0.5 max-h-[calc(100vh-140px)] overflow-y-auto">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/admin' && (pathname === '/admin' || pathname === '/admin/dashboard'));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-slate-900 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-amber-400' : 'text-slate-400')} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <div className="my-2 border-t border-slate-100" />

        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
          <span>Exit Admin Portal</span>
        </Link>
      </nav>
    </aside>
  );
};
