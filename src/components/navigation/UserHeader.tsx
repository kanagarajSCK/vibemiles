'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Search, Heart, ChevronDown, LogOut, Menu, X,
  User, LayoutDashboard, CalendarCheck, Gift, Settings,
  MapPin, Package, Compass,
} from 'lucide-react';
import { PUBLIC_NAV, ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from './NotificationBell';

export const UserHeader: React.FC = () => {
  const pathname = usePathname();
  const { user: authUser, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-14.5 max-w-[1700px] items-center justify-between px-3 min-[360px]:px-4 sm:h-16 sm:px-6 lg:px-10">

        {/* Brand */}
        <Link href={ROUTES.HOME} className="flex items-center gap-2.5 group py-1">
          <Image src="/vibe-miles-logo.png" alt="Vibe Miles" width={140} height={140}
            className="h-8 w-auto object-contain transition-opacity group-hover:opacity-85 sm:h-9" priority />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 min-[360px]:text-base">VIBE <span className="text-emerald-700">MILES</span></span>
            <span className="hidden text-[8px] font-semibold tracking-widest text-slate-400 uppercase sm:block">Explore. Connect. Experience.</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {PUBLIC_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} prefetch={true}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-teal-700',
                  isActive ? 'text-teal-700 font-semibold border-b-2 border-teal-700 py-4' : 'text-slate-600'
                )}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Link href={ROUTES.SEARCH} prefetch={true}
            className="hidden md:flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700 transition-colors">
            <Search className="w-4 h-4" />
          </Link>

          {/* Wishlist */}
          <Link href={ROUTES.ACCOUNT_WISHLIST} prefetch={true}
            className="hidden md:flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors relative">
            <Heart className="w-4 h-4" />
          </Link>

          {/* Notifications */}
          <NotificationBell
            href={ROUTES.ACCOUNT_NOTIFICATIONS}
            className="hidden md:flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors relative"
            dotClassName="bg-teal-500 ring-1 ring-white"
          />

          <div className="hidden md:block h-4 w-px bg-slate-200 mx-1" />

          {/* User Profile Dropdown */}
          <div className="relative hidden md:block">
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-teal-300 transition-colors">
              <div className="h-5 w-5 rounded-full overflow-hidden border border-teal-200">
                {avatar ? (
                  <Image src={avatar} alt={fullName} width={20} height={20} unoptimized className="h-full w-full object-cover" />
                ) : (
                  <User className="h-full w-full bg-slate-100 p-1 text-slate-400" aria-hidden="true" />
                )}
              </div>
              <span className="max-w-20 truncate">{fullName.split(' ')[0]}</span>
              <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform', profileOpen && 'rotate-180')} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl z-50">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{fullName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{email}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                    <Gift className="w-3 h-3" /> {rewardPoints} Reward Points
                  </div>
                </div>
                {[
                  { label: 'My Dashboard', href: ROUTES.ACCOUNT_DASHBOARD, icon: LayoutDashboard },
                  { label: 'My Bookings', href: ROUTES.ACCOUNT_BOOKINGS, icon: CalendarCheck },
                  { label: 'Upcoming Trips', href: ROUTES.ACCOUNT_UPCOMING, icon: MapPin },
                  { label: 'Saved Packages', href: ROUTES.ACCOUNT_WISHLIST, icon: Package },
                  { label: 'Rewards & Points', href: ROUTES.ACCOUNT_REWARDS, icon: Gift },
                  { label: 'Profile Settings', href: ROUTES.ACCOUNT_SETTINGS, icon: Settings },
                ].map(item => (
                  <Link key={item.href} href={item.href} prefetch={true} onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-teal-700 transition-colors">
                    <item.icon className="w-3.5 h-3.5 text-slate-400" />{item.label}
                  </Link>
                ))}
                <div className="my-1 border-t border-slate-100" />
                <button onClick={() => { setProfileOpen(false); logout(); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="flex md:hidden items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1 animate-in slide-in-from-top-3">
          <div className="flex items-center gap-3 rounded-xl bg-teal-50 px-3 py-2.5 mb-3">
            <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-teal-300">
              {avatar ? (
                <Image src={avatar} alt={fullName} width={32} height={32} unoptimized className="h-full w-full object-cover" />
              ) : (
                <User className="h-full w-full bg-slate-100 p-1 text-slate-400" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 truncate">{fullName}</p>
              <p className="text-[10px] text-teal-600 font-semibold">{rewardPoints} pts</p>
            </div>
          </div>
          {PUBLIC_NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors">
              <Compass className="w-4 h-4 text-slate-400" />{item.label}
            </Link>
          ))}
          <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
            <Link href={ROUTES.ACCOUNT_DASHBOARD} onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <User className="w-4 h-4 text-slate-400" /> My Account
            </Link>
            <button onClick={() => { setMobileOpen(false); logout(); }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
