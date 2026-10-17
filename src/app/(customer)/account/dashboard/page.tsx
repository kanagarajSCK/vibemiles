'use client';

import React from 'react';
import Link from 'next/link';
import {
  CalendarCheck, MapPin, Gift, Heart, ArrowRight,
  Compass, CheckCircle2, Clock, Package, Star,
  Bell, Zap,
} from 'lucide-react';
import { MOCK_PACKAGES } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PackageCard } from '@/components/cards/PackageCard';
import { ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { bookingService } from '@/services/booking.service';
import type { Booking } from '@/types';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [daysUntil, setDaysUntil] = React.useState<number | null>(null);

  React.useEffect(() => {
    bookingService.getCustomerBookings('all').then((res) => {
      setBookings(res);
      const upcoming = res.filter(b => b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending');
      if (upcoming[0]) {
        const diff = Math.ceil((new Date(upcoming[0].travelDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        setDaysUntil(Math.max(1, diff));
      }
    }).catch(() => {});
  }, []);

  const upcomingBookings = bookings.filter(b => b.bookingStatus === 'confirmed' || b.bookingStatus === 'pending').slice(0, 3);
  const wishlistedPackages = MOCK_PACKAGES.slice(0, 2);
  const totalTrips = bookings.length;
  const completedTrips = bookings.filter(b => b.bookingStatus === 'completed').length;
  const customerProfile = user as unknown as { rewardPoints?: number; fullName?: string } | null;
  const rewardPoints = customerProfile?.rewardPoints || 0;
  const rewardProgress = Math.min((rewardPoints / 5000) * 100, 100);
  const nextTrip = upcomingBookings[0];

  const STAT_CARDS = [
    { label: 'Total Trips', value: totalTrips, icon: Package, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Completed', value: completedTrips, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Reward Points', value: rewardPoints.toLocaleString(), icon: Gift, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Saved Packages', value: wishlistedPackages.length, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const QUICK_LINKS = [
    { label: 'Browse Packages', href: ROUTES.PACKAGES, icon: Compass, color: 'bg-teal-600' },
    { label: 'My Bookings', href: ROUTES.ACCOUNT_BOOKINGS, icon: CalendarCheck, color: 'bg-sky-600' },
    { label: 'Upcoming Trips', href: ROUTES.ACCOUNT_UPCOMING, icon: MapPin, color: 'bg-violet-600' },
    { label: 'Rewards & Points', href: ROUTES.ACCOUNT_REWARDS, icon: Gift, color: 'bg-amber-600' },
    { label: 'Wishlist', href: ROUTES.ACCOUNT_WISHLIST, icon: Heart, color: 'bg-rose-500' },
    { label: 'Notifications', href: ROUTES.ACCOUNT_NOTIFICATIONS, icon: Bell, color: 'bg-slate-700' },
  ];

  const displayName = customerProfile?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Traveler';

  return (
    <div className="space-y-6">
      {/* === WELCOME BANNER === */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-teal-900/50 via-slate-900 to-slate-900" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Traveler Portal</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome back, {displayName}! ✈️</h1>
            {daysUntil !== null ? (
              <p className="text-sm text-slate-300">
                Your next trip is in <span className="font-bold text-teal-300">{daysUntil} days</span> · {nextTrip.packageName}
              </p>
            ) : (
              <p className="text-sm text-slate-300">Ready for your next adventure? Discover amazing destinations.</p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {daysUntil !== null && (
              <div className="text-center rounded-2xl border border-teal-500/30 bg-teal-500/10 px-5 py-3">
                <p className="text-3xl font-black text-teal-300">{daysUntil}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">Days to go</p>
              </div>
            )}
            <Link href={ROUTES.PACKAGES}>
              <Button variant="accent" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Find Trips
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* === KPI STATS === */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
              <p className="text-xl font-extrabold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* === QUICK LINKS === */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Quick Links</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {QUICK_LINKS.map(({ label, href, icon: Icon, color }) => (
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

      {/* === REWARDS + UPCOMING TRIPS === */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Rewards Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Rewards & Points</h2>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-black text-amber-700">{rewardPoints.toLocaleString()}</p>
                <p className="text-xs text-amber-600 font-medium">Vibe Miles Points</p>
              </div>
              <Gift className="w-8 h-8 text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Progress to Gold</span>
                <span>{rewardPoints} / 5,000</span>
              </div>
              <div className="h-2 w-full rounded-full bg-amber-200 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${rewardProgress}%` }} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">How to earn more:</p>
            {['Complete a booking (+500 pts)', 'Write a review (+100 pts)', 'Refer a friend (+250 pts)'].map(tip => (
              <div key={tip} className="flex items-center gap-2 text-xs text-slate-500">
                <Zap className="w-3 h-3 text-amber-400 shrink-0" />{tip}
              </div>
            ))}
          </div>
          <Link href={ROUTES.ACCOUNT_REWARDS}>
            <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Rewards
            </Button>
          </Link>
        </div>

        {/* Upcoming Trips */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-teal-600" /> Upcoming Trips
            </h2>
            <Link href={ROUTES.ACCOUNT_UPCOMING} className="text-[10px] font-bold text-teal-700 hover:underline">View all</Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Compass className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">No upcoming trips yet</p>
              <Link href={ROUTES.PACKAGES}><Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>Find a Package</Button></Link>
            </div>
          ) : upcomingBookings.map((bk) => {
            const days = 3;
            return (
              <div key={bk.id} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-teal-200 hover:bg-teal-50/40 transition-colors">
                <div className="text-center rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 shrink-0">
                  <p className="text-lg font-black text-teal-700">{days}</p>
                  <p className="text-[9px] font-bold text-teal-500 uppercase tracking-wider">days</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{bk.packageName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />{bk.packageName}
                    <span className="mx-1">·</span>
                    <Clock className="w-3 h-3" />{formatDate(bk.travelDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-teal-700">{formatCurrency(bk.totalAmount)}</p>
                  <Badge variant="success" size="sm">Confirmed</Badge>
                </div>
              </div>
            );
          })}
          {upcomingBookings.length > 0 && (
            <Link href={ROUTES.ACCOUNT_BOOKINGS}>
              <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                All Bookings
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* === RECOMMENDED PACKAGES === */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recommended for You</h2>
          <Link href={ROUTES.PACKAGES} className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1">Browse all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {wishlistedPackages.map((pkg) => <PackageCard key={pkg.id} packageData={pkg} />)}
        </div>
      </div>
    </div>
  );
}

