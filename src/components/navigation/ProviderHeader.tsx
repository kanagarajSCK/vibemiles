'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, CalendarCheck, TrendingUp,
  ChevronDown, LogOut, Menu, X, Building2,
  PlusCircle, Star, Settings, CheckCircle2, Clock,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from './NotificationBell';

const PROVIDER_QUICK_NAV = [
  { label: 'Dashboard', href: ROUTES.PROVIDER_DASHBOARD, icon: LayoutDashboard },
  { label: 'My Listings', href: ROUTES.PROVIDER_PACKAGES, icon: Package },
  { label: 'Add Listing', href: ROUTES.PROVIDER_PACKAGE_NEW, icon: PlusCircle },
  { label: 'Bookings', href: ROUTES.PROVIDER_BOOKINGS, icon: CalendarCheck },
  { label: 'Earnings', href: ROUTES.PROVIDER_EARNINGS, icon: TrendingUp },
  { label: 'Reviews', href: ROUTES.PROVIDER_REVIEWS, icon: Star },
];

export const ProviderHeader: React.FC = () => {
  const pathname = usePathname();
  const { user: authUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const provider = authUser as unknown as {
    businessName?: string;
    ownerName?: string;
    verificationStatus?: string;
    providerProfile?: { businessName?: string; ownerName?: string; verificationStatus?: string };
  } | null;

  const businessName = provider?.businessName || provider?.providerProfile?.businessName || 'Partner Dashboard';
  const ownerName = provider?.ownerName || provider?.providerProfile?.ownerName || authUser?.email?.split('@')[0] || 'Partner';
  const rawStatus = provider?.verificationStatus || provider?.providerProfile?.verificationStatus || 'UNVERIFIED';
  const vStatus = String(rawStatus).toUpperCase();

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-emerald-900/60 bg-emerald-950 shadow-lg">
      <div className="mx-auto flex h-16 max-w-[1700px] items-center justify-between px-4 sm:px-6 lg:px-10">

        {/* Brand + Partner Badge */}
        <div className="flex items-center gap-3">
          <Link href={ROUTES.HOME} className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full bg-white p-0.5 overflow-hidden shadow-sm flex items-center justify-center">
              <Image src="/vibe-miles-logo-green.png" alt="Vibe Miles" width={120} height={120}
                className="h-full w-full object-contain opacity-95 group-hover:opacity-100 transition-opacity" priority />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base tracking-tight text-white">VIBE <span className="text-emerald-400">MILES</span></span>
              <span className="text-[8px] font-bold tracking-widest text-emerald-500 uppercase">Partner Portal</span>
            </div>
          </Link>
          {vStatus === 'VERIFIED' ? (
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1">
              <CheckCircle2 className="w-3 h-3 text-teal-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Verified Partner</span>
            </div>
          ) : (
            <Link
              href={ROUTES.PARTNER_VERIFICATION}
              className="hidden sm:flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 transition-colors hover:bg-amber-500/20"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                {vStatus === 'PENDING' ? 'KYC In Review' : vStatus === 'REJECTED' ? 'KYC Action Required' : 'KYC Unverified'}
              </span>
            </Link>
          )}
        </div>

        {/* Desktop Quick Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {PROVIDER_QUICK_NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-teal-600/30 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                )}>
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <NotificationBell
            href={ROUTES.PARTNER_NOTIFICATIONS}
            className="flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors relative"
            dotClassName="bg-teal-400 ring-1 ring-slate-900"
          />

          {/* Business Profile Dropdown */}
          <div className="relative z-[100]">
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors">
              <div className="h-5 w-5 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold">
                {businessName.charAt(0)}
              </div>
              <span className="hidden sm:inline max-w-[100px] truncate">{businessName}</span>
              <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform', profileOpen && 'rotate-180')} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-700 bg-slate-800 p-1.5 shadow-2xl z-[110]">
                <div className="px-3 py-2 border-b border-slate-700 mb-1">
                  <p className="text-xs font-bold text-white truncate">{businessName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{ownerName}</p>
                </div>
                <Link href={ROUTES.PROVIDER_SETTINGS} onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                  <Settings className="w-3.5 h-3.5" /> Business Settings
                </Link>
                <Link href={ROUTES.PARTNER_VERIFICATION} onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                  <Building2 className="w-3.5 h-3.5" /> KYC & Documents
                </Link>
                <div className="my-1 border-t border-slate-700" />
                <button onClick={() => { setProfileOpen(false); logout(); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Exit Partner Portal
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="flex lg:hidden items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-white/5 transition-colors">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-800 px-4 pb-4 pt-2 space-y-1 animate-in slide-in-from-top-3">
          {PROVIDER_QUICK_NAV.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive ? 'bg-teal-600/20 text-teal-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                )}>
                <Icon className="w-4 h-4" />{item.label}
              </Link>
            );
          })}
          <div className="border-t border-slate-800 mt-2 pt-2">
            <button onClick={() => { setMobileOpen(false); logout(); }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors">
              <LogOut className="w-4 h-4" /> Exit Partner Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
