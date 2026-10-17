'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, PlusCircle, CalendarCheck, Users,
  TrendingUp, Star, Settings, Building2, CheckCircle2, LogOut,
  Bell, ShieldCheck, FileText, MessageSquare, Tag, ChevronDown,
  Clock, AlertCircle,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { Provider } from '@/types';

const NAV_SECTIONS = [
  {
    title: 'My Business',
    items: [
      { label: 'Business Profile', href: ROUTES.PROVIDER_SETTINGS, icon: Building2 },
      { label: 'Verification', href: ROUTES.PARTNER_VERIFICATION, icon: ShieldCheck },
      { label: 'Documents', href: ROUTES.PARTNER_VERIFICATION, icon: FileText },
    ],
  },
  {
    title: 'Listings',
    items: [
      { label: 'All Listings', href: ROUTES.PROVIDER_PACKAGES, icon: Package },
      { label: 'Add New Listing', href: ROUTES.PROVIDER_PACKAGE_NEW, icon: PlusCircle },
      { label: 'My Deals', href: ROUTES.PROVIDER_DEALS, icon: Tag },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Bookings & Requests', href: ROUTES.PROVIDER_BOOKINGS, icon: CalendarCheck },
      { label: 'Customer Roster', href: ROUTES.PROVIDER_CUSTOMERS, icon: Users },
      { label: 'Customer Reviews', href: ROUTES.PROVIDER_REVIEWS, icon: Star },
      { label: 'Messages', href: ROUTES.PROVIDER_CUSTOMERS, icon: MessageSquare },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Earnings & Payouts', href: ROUTES.PROVIDER_EARNINGS, icon: TrendingUp },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', href: ROUTES.PARTNER_NOTIFICATIONS, icon: Bell },
      { label: 'Settings', href: ROUTES.PROVIDER_SETTINGS, icon: Settings },
    ],
  },
];

export const ProviderSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const provider = user?.role === 'provider' ? (user as Provider) : null;
  const businessName = provider?.businessName || 'Partner Portal';
  const ownerName = provider?.ownerName || user?.email?.split('@')[0] || 'Tour Operator';
  const vStatus = (provider?.verificationStatus as string)?.toUpperCase() || 'UNVERIFIED';
  const [dashboardOpen, setDashboardOpen] = React.useState(true);

  const renderItem = (item: { label: string; href: string; icon: typeof LayoutDashboard }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        key={item.label + item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
          isActive
            ? 'bg-teal-700 text-white shadow-sm font-semibold'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        )}
      >
        <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden lg:block lg:w-64 shrink-0 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-sm truncate">{businessName}</h3>
            <p className="text-xs text-slate-400 truncate">{ownerName}</p>
          </div>
        </div>

        <div className="space-y-1 border-t border-slate-800 pt-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">KYC Status</span>
            <span
              className={`font-bold ${
                vStatus === 'VERIFIED'
                  ? 'text-emerald-400'
                  : vStatus === 'PENDING'
                  ? 'text-amber-400'
                  : vStatus === 'REJECTED'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {vStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-3 text-xs">
          <span className="text-slate-400">Verification:</span>
          {vStatus === 'VERIFIED' ? (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          ) : vStatus === 'PENDING' ? (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
              <Clock className="w-3.5 h-3.5" /> In Review
            </span>
          ) : vStatus === 'REJECTED' ? (
            <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" /> Action Required
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Unverified
            </span>
          )}
        </div>
      </div>

      <nav className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm space-y-2.5">
        <button
          type="button"
          onClick={() => setDashboardOpen((value) => !value)}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-all',
            pathname === ROUTES.PROVIDER_DASHBOARD
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          )}
        >
          <span className="flex items-center gap-3">
            <LayoutDashboard className={cn('w-4 h-4 shrink-0', pathname === ROUTES.PROVIDER_DASHBOARD ? 'text-white' : 'text-slate-500')} />
            Dashboard
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', dashboardOpen ? 'rotate-180' : 'rotate-0')} />
        </button>

        {dashboardOpen && (
          <div className="space-y-3 border-t border-slate-100 pt-2">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{section.title}</p>
                <div className="space-y-0.5">
                  {section.items.map((item) => renderItem(item))}
                </div>
              </div>
            ))}

            <div className="border-t border-slate-100 pt-2">
              <Link
                href={ROUTES.HOME}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Exit Partner Portal</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};
