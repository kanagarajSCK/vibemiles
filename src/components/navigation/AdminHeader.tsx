'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert, LayoutDashboard, Users, Building2,
  Package, BarChart2, ChevronDown, LogOut,
  Menu, X, AlertTriangle, Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';

const ADMIN_QUICK_NAV = [
  { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
  { label: 'Providers', href: ROUTES.ADMIN_PROVIDERS, icon: Building2 },
  { label: 'Packages', href: ROUTES.ADMIN_PACKAGES, icon: Package },
  { label: 'Customers', href: ROUTES.ADMIN_CUSTOMERS, icon: Users },
  { label: 'Reports', href: ROUTES.ADMIN_REPORTS, icon: BarChart2 },
  { label: 'Disputes', href: ROUTES.ADMIN_DISPUTES, icon: AlertTriangle },
];

export const AdminHeader: React.FC = () => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-900/60 bg-emerald-950 shadow-lg">
      <div className="mx-auto flex h-16 max-w-[1700px] items-center justify-between px-4 sm:px-6 lg:px-10">

        {/* Brand + Role Badge */}
        <div className="flex items-center gap-3">
          <Link href={ROUTES.ADMIN_DASHBOARD} className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-full bg-white p-0.5 overflow-hidden shadow-sm flex items-center justify-center">
              <Image src="/vibe-miles-logo-green.png" alt="Vibe Miles" width={120} height={120}
                className="h-full w-full object-contain opacity-95 group-hover:opacity-100 transition-opacity" priority />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base tracking-tight text-white">VIBE <span className="text-emerald-400">MILES</span></span>
              <span className="text-[8px] font-bold tracking-widest text-emerald-500 uppercase">Admin Console</span>
            </div>
          </Link>
          <div className="hidden sm:flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Super Admin</span>
          </div>
        </div>

        {/* Desktop Quick Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {ADMIN_QUICK_NAV.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-white/10 text-white'
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
            href={ROUTES.ADMIN_NOTIFICATIONS}
            className="flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors relative"
            dotClassName="bg-rose-500 ring-1 ring-slate-950"
          />

          {/* Admin Profile Dropdown */}
          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors">
              <div className="h-5 w-5 rounded-full bg-rose-600 flex items-center justify-center text-white text-[10px] font-bold">A</div>
              <span className="hidden sm:inline">Admin</span>
              <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform', profileOpen && 'rotate-180')} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl z-50">
                <Link href={ROUTES.ADMIN_SETTINGS} onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                  <Settings className="w-3.5 h-3.5" /> System Settings
                </Link>
                <div className="my-1 border-t border-slate-800" />
                <button onClick={() => { setProfileOpen(false); logout(); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="flex lg:hidden items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-white/5 transition-colors">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-800 px-4 pb-4 pt-2 space-y-1 animate-in slide-in-from-top-3">
          {ADMIN_QUICK_NAV.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                )}>
                <Icon className="w-4 h-4" />{item.label}
              </Link>
            );
          })}
          <div className="border-t border-slate-800 mt-2 pt-2">
            <button onClick={() => { setMobileOpen(false); logout(); }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
