'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  TrendingUp, Package, CalendarCheck, Star, PlusCircle,
  Building2, CheckCircle2, Users, IndianRupee,
  Eye, ArrowUpRight, Clock, MapPin, Bell, Zap, BarChart2,
  AlertCircle, ShieldAlert,
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { packageService } from '@/services/package.service';
import { bookingService } from '@/services/booking.service';
import type { Booking, Provider } from '@/types';

export default function ProviderDashboardPage() {
  const { user } = useAuth();
  const provider = user?.role === 'provider' ? (user as Provider) : null;
  const businessName = provider?.businessName || 'My Business Dashboard';
  const ownerName = provider?.ownerName || user?.email?.split('@')[0] || 'Tour Operator';
  const businessCategory = provider?.businessCategory || 'Tour Operator';
  const city = provider?.address?.city || 'India';
  const state = provider?.address?.state || '';
  const vStatus = (provider?.verificationStatus as string)?.toUpperCase() || 'UNVERIFIED';

  const [myPackages, setMyPackages] = React.useState<any[]>([]);
  const [bookings, setBookings] = React.useState<Booking[]>([]);

  React.useEffect(() => {
    bookingService.getProviderBookings().then(setBookings).catch(() => {});
    packageService.getProviderPackages().then((pkgs) => {
      if (Array.isArray(pkgs)) {
        setMyPackages(pkgs);
      }
    }).catch(() => {});
  }, []);

  const recentBookings = bookings.slice(0, 4);
  const pendingBookings = bookings.filter(b => b.bookingStatus === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.bookingStatus === 'confirmed').length;
  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);

  const KPI_STATS = [
    { label: 'Total Earnings', value: formatCurrency(totalRevenue), icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50', growth: '+12% this month' },
    { label: 'Active Listings', value: myPackages.length.toString(), icon: Package, color: 'text-teal-600', bg: 'bg-teal-50', growth: 'Live on marketplace' },
    { label: 'Total Bookings', value: bookings.length.toString(), icon: CalendarCheck, color: 'text-sky-600', bg: 'bg-sky-50', growth: `${confirmedBookings} confirmed` },
    { label: 'Avg. Rating', value: provider?.rating ? provider.rating.toFixed(1) : '5.0', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', growth: `${provider?.reviewCount || 0} reviews` },
    { label: 'Total Customers', value: bookings.length.toString(), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', growth: 'Unique travellers' },
    { label: 'Pending Actions', value: pendingBookings.toString(), icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50', growth: 'Needs confirmation' },
  ];

  const QUICK_ACTIONS = [
    { label: 'Add Listing', href: ROUTES.PROVIDER_PACKAGE_NEW, icon: PlusCircle, color: 'bg-teal-600' },
    { label: 'All Listings', href: ROUTES.PROVIDER_PACKAGES, icon: Package, color: 'bg-sky-600' },
    { label: 'Bookings', href: ROUTES.PROVIDER_BOOKINGS, icon: CalendarCheck, color: 'bg-violet-600' },
    { label: 'Earnings', href: ROUTES.PROVIDER_EARNINGS, icon: TrendingUp, color: 'bg-emerald-600' },
    { label: 'Reviews', href: ROUTES.PROVIDER_REVIEWS, icon: Star, color: 'bg-amber-600' },
    { label: 'Analytics', href: ROUTES.PROVIDER_BOOKINGS, icon: BarChart2, color: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-6">
      {/* === PARTNER COMMAND BANNER === */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-4 text-white shadow-xl border border-slate-800 sm:p-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-teal-900/50 via-slate-900 to-slate-900" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider sm:text-[9px]",
              vStatus === 'VERIFIED'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : vStatus === 'PENDING'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : vStatus === 'REJECTED'
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
            )}>
              {vStatus === 'VERIFIED' ? (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Verified Partner
                </>
              ) : vStatus === 'PENDING' ? (
                <>
                  <Clock className="w-2.5 h-2.5 text-amber-400" /> Verification Pending Review
                </>
              ) : vStatus === 'REJECTED' ? (
                <>
                  <AlertCircle className="w-2.5 h-2.5 text-rose-400" /> Verification Rejected
                </>
              ) : (
                <>
                  <ShieldAlert className="w-2.5 h-2.5 text-slate-400" /> Unverified Partner
                </>
              )}
            </div>
            <div>
              <h1 className="text-[1.5rem] leading-tight font-extrabold text-white sm:text-2xl">{businessName}</h1>
              <p className="text-[11px] text-slate-300 mt-1 sm:text-sm">
                {ownerName} · <span className="capitalize">{businessCategory}</span>
                {provider?.reviewCount ? (
                  <>
                    &nbsp;·&nbsp;
                    <span className="font-semibold text-teal-300">★ {provider.rating.toFixed(1)} ({provider.reviewCount} reviews)</span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-white/80 sm:text-[10px]">
                <Building2 className="w-2.5 h-2.5" />{city}{state ? `, ${state}` : ''}
              </span>
              <Link href={ROUTES.PARTNER_VERIFICATION}>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold sm:text-[10px] cursor-pointer hover:opacity-80 transition-opacity",
                  vStatus === 'VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : vStatus === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300'
                    : vStatus === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-slate-500/20 text-slate-300'
                )}>
                  <Zap className="w-2.5 h-2.5" /> KYC: {vStatus}
                </span>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-3 min-w-40 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-300 sm:text-xs">Document Verification</p>
            <div className="flex items-end gap-2">
              <span className={cn(
                "text-[1.25rem] font-black leading-none sm:text-2xl",
                vStatus === 'VERIFIED' ? "text-emerald-300" :
                vStatus === 'PENDING' ? "text-amber-300" :
                vStatus === 'REJECTED' ? "text-rose-300" :
                "text-slate-300"
              )}>{vStatus}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-700 overflow-hidden">
              <div className={cn(
                "h-full rounded-full transition-all",
                vStatus === 'VERIFIED' ? "w-full bg-emerald-400" :
                vStatus === 'PENDING' ? "w-2/3 bg-amber-400" :
                vStatus === 'REJECTED' ? "w-1/3 bg-rose-400" :
                "w-1/4 bg-slate-500"
              )} />
            </div>
            <Link href={ROUTES.PARTNER_VERIFICATION}>
              <p className="text-[9px] text-teal-400 hover:text-teal-300 font-semibold cursor-pointer mt-1 sm:text-[10px]">
                Manage KYC documents →
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* === KPI GRID === */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {KPI_STATS.map(({ label, value, icon: Icon, color, bg, growth }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`w-3 h-3 ${color}`} />
            </div>
            <div className="mt-2 space-y-0.5">
              <p className="text-[8px] text-slate-400 font-medium leading-tight">{label}</p>
              <p className="text-base font-extrabold leading-none text-slate-900">{value}</p>
              <p className={`text-[7.5px] font-semibold ${color} flex items-center gap-0.5`}>
                <ArrowUpRight className="w-2 h-2" />{growth}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* === QUICK ACTIONS === */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Partner Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon, color }) => (
            <Link key={label} href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2 py-4 text-center transition-all hover:border-teal-200 hover:bg-teal-50 hover:-translate-y-0.5 hover:shadow-sm">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* === MY LISTINGS + RECENT BOOKINGS === */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* My Listings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-teal-600" /> My Listings
            </h2>
            <div className="flex items-center gap-2">
              <Link href={ROUTES.PROVIDER_PACKAGE_NEW}>
                <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />} className="h-7 text-xs">Add New</Button>
              </Link>
              <Link href={ROUTES.PROVIDER_PACKAGES} className="text-[10px] font-bold text-teal-700 hover:underline">All</Link>
            </div>
          </div>
          {myPackages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-xs text-slate-500">No listings created yet.</p>
              <Link href={ROUTES.PROVIDER_PACKAGE_NEW} className="mt-2 inline-block">
                <Button variant="outline" size="sm" className="text-xs mt-2">Create First Listing</Button>
              </Link>
            </div>
          ) : (
            myPackages.slice(0, 4).map((pkg) => (
              <div key={pkg.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-teal-200 transition-colors">
                <div className="h-10 w-10 overflow-hidden shrink-0 rounded-xl bg-slate-200 flex items-center justify-center">
                  {pkg.images && pkg.images[0] ? (
                    <Image
                      src={pkg.images[0]}
                      alt={pkg.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{pkg.name}</p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />{pkg.destinationName || pkg.city || 'India'}
                    <span className="mx-1">·</span>{formatCurrency(pkg.finalPrice || pkg.price || 0)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={pkg.approvalStatus === 'approved' || pkg.status === 'PUBLISHED' ? 'success' : 'warning'} size="sm">
                    {pkg.approvalStatus || pkg.status || 'PENDING'}
                  </Badge>
                  <Eye className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-teal-600" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Bookings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-sky-600" /> Recent Bookings
            </h2>
            <Link href={ROUTES.PROVIDER_BOOKINGS} className="text-[10px] font-bold text-teal-700 hover:underline">View all</Link>
          </div>
          {recentBookings.map((bk) => (
            <div key={bk.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-teal-200 transition-colors">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{bk.packageName}</p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Users className="w-2.5 h-2.5" />{bk.customerName}
                  <span className="mx-1">·</span>
                  <Clock className="w-2.5 h-2.5" />{formatDate(bk.travelDate)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-emerald-700">{formatCurrency(bk.totalAmount)}</p>
                <Badge variant={bk.bookingStatus === 'confirmed' ? 'success' : bk.bookingStatus === 'pending' ? 'warning' : 'neutral'} size="sm">
                  {bk.bookingStatus}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

