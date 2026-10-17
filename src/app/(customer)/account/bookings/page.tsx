'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, XCircle, Compass } from 'lucide-react';
import { bookingService } from '@/services/booking.service';
import type { Booking } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AccountBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadBookings() {
      try {
        const data = await bookingService.getCustomerBookings('all');
        if (isMounted) {
          setBookings(data);
        }
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadBookings();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCancel(bookingId: string) {
    if (!confirm('Are you sure you want to cancel this travel reservation?')) {
      return;
    }
    setCancellingId(bookingId);
    try {
      await bookingService.cancelBooking(bookingId, 'Customer requested cancellation via portal');
      const refreshed = await bookingService.getCustomerBookings('all');
      setBookings(refreshed);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return <LoadingState label="Loading your travel reservations..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">All Trip Bookings</h1>
          <p className="text-xs text-slate-500">Manage and track your active, completed, and cancelled travel reservations.</p>
        </div>
        <Badge variant="brand">{bookings.length} Total Reservations</Badge>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 mb-4">
            <Compass className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Reservations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            You haven&apos;t reserved any travel experiences yet. Explore curated packages and plan your next journey!
          </p>
          <Link href="/packages">
            <Button variant="primary" size="md">
              Explore Packages
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 transition-all hover:border-teal-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                    {booking.bookingRef}
                  </span>
                  <span className="text-xs text-slate-400">Booked on {formatDate(booking.createdAt)}</span>
                </div>
                <Badge
                  variant={
                    booking.bookingStatus === 'confirmed'
                      ? 'success'
                      : booking.bookingStatus === 'completed'
                      ? 'info'
                      : booking.bookingStatus === 'cancelled'
                      ? 'error'
                      : 'warning'
                  }
                >
                  {booking.bookingStatus.toUpperCase()}
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
                    <p className="text-xs text-slate-700 font-semibold mt-1">
                      Travel Date: {formatDate(booking.travelDate)} ({booking.travelers.adults} Adults
                      {booking.travelers.children > 0 && `, ${booking.travelers.children} Children`})
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Amount</span>
                    <span className="text-base font-extrabold text-teal-800">
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>

                  {(booking.bookingStatus === 'pending' || booking.bookingStatus === 'confirmed') && (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={cancellingId === booking.id}
                      onClick={() => handleCancel(booking.id)}
                      leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
                      className="text-rose-700 hover:bg-rose-50 border-rose-200"
                    >
                      Cancel
                    </Button>
                  )}

                  <Link href={`/booking/confirmation/${booking.id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                      View Voucher
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
