'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Calendar, Compass } from 'lucide-react';
import { bookingService } from '@/services/booking.service';
import type { Booking } from '@/types';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function AccountUpcomingPage() {
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await bookingService.getCustomerBookings('upcoming');
        setUpcomingBookings(data);
      } catch (err) {
        console.error('Failed to load upcoming bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading upcoming departures..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Upcoming Trips</h1>
          <p className="text-xs text-slate-500">Scheduled departures and digital travel vouchers.</p>
        </div>
        <Badge variant="success">{upcomingBookings.length} Upcoming</Badge>
      </div>

      {upcomingBookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 mb-4">
            <Calendar className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Upcoming Trips</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            You don&apos;t have any scheduled trips right now. Start exploring destinations!
          </p>
          <Link href="/destinations">
            <Button variant="primary" size="md">
              Discover Destinations
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingBookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                  {booking.bookingRef}
                </span>
                <Badge variant={booking.bookingStatus === 'confirmed' ? 'success' : 'warning'}>
                  {booking.bookingStatus === 'confirmed'
                    ? `DEPARTURE IN ${getDaysUntil(booking.travelDate)} DAYS`
                    : 'PAYMENT PENDING'}
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={booking.packageImage}
                    alt={booking.packageName}
                    className="h-16 w-20 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{booking.packageName}</h3>
                    <p className="text-xs text-slate-500">Provider: {booking.providerName}</p>
                    <p className="text-xs text-teal-700 font-semibold mt-1">
                      Travel Date: {formatDate(booking.travelDate)}
                    </p>
                  </div>
                </div>

                <Link href={`/booking/confirmation/${booking.id}`}>
                  <Button variant="primary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                    View Voucher
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
