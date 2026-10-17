'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  MapPin,
  CheckCircle,
  XCircle,
  Heart,
  Star,
  Gift,
  Tag,
  Bell,
  CreditCard,
  User,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', href: ROUTES.ACCOUNT_DASHBOARD, icon: LayoutDashboard },
  { label: 'All Bookings', href: ROUTES.ACCOUNT_BOOKINGS, icon: CalendarCheck },
  { label: 'Upcoming Trips', href: ROUTES.ACCOUNT_UPCOMING, icon: MapPin },
  { label: 'Completed Trips', href: ROUTES.ACCOUNT_COMPLETED, icon: CheckCircle },
  { label: 'Cancelled Bookings', href: ROUTES.ACCOUNT_CANCELLED, icon: XCircle },
  { label: 'Wishlist', href: ROUTES.ACCOUNT_WISHLIST, icon: Heart },
  { label: 'Saved Providers', href: ROUTES.ACCOUNT_SAVED_PROVIDERS, icon: Star },
  { label: 'Rewards & Points', href: ROUTES.ACCOUNT_REWARDS, icon: Gift },
  { label: 'Coupons', href: ROUTES.ACCOUNT_COUPONS, icon: Tag },
  { label: 'Notifications', href: ROUTES.ACCOUNT_NOTIFICATIONS, icon: Bell },
  { label: 'Payment History', href: ROUTES.ACCOUNT_PAYMENTS, icon: CreditCard },
  { label: 'Profile Details', href: ROUTES.ACCOUNT_PROFILE, icon: User },
  { label: 'Account Settings', href: ROUTES.ACCOUNT_SETTINGS, icon: Settings },
  { label: 'Security & Password', href: ROUTES.ACCOUNT_SECURITY, icon: Shield },
];

export const AccountSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user: authUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const customer = authUser as unknown as {
    fullName?: string;
    avatar?: string;
    rewardPoints?: number;
    customerProfile?: { fullName?: string; avatar?: string; rewardPoints?: number };
  } | null;

  const fullName = customer?.fullName || customer?.customerProfile?.fullName || authUser?.email?.split('@')[0] || 'Traveler';
  const email = authUser?.email || '';
  const avatar = customer?.avatar || customer?.customerProfile?.avatar;
  const rewardPoints = customer?.rewardPoints ?? customer?.customerProfile?.rewardPoints ?? 0;

  const SidebarContent = (
    <>
      {/* Profile summary card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
        <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full border-2 border-teal-600 shadow-md flex items-center justify-center bg-teal-50">
          {avatar ? (
            <img src={avatar} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <div className="text-xl font-bold text-teal-700">{fullName.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <h3 className="font-bold text-slate-900 text-base truncate">{fullName}</h3>
        <p className="text-xs text-slate-500 truncate">{email}</p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
          <Gift className="w-3.5 h-3.5" />
          <span>{rewardPoints} Reward Points</span>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
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
        })}

        <div className="my-2 border-t border-slate-100" />

        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
          <span>Sign Out</span>
        </button>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-4 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-teal-700" />
          <span className="font-bold text-slate-900">Account Menu</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 transition-colors hover:bg-teal-100"
        >
          <LayoutDashboard className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 shrink-0 space-y-6">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-col space-y-6 overflow-y-auto bg-slate-50 p-4 shadow-2xl animate-in slide-in-from-left-4">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/50 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <LogOut className="h-4 w-4" style={{ transform: 'rotate(180deg)' }} /> 
            </button>
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
