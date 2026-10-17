'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { XCircle, RotateCcw } from 'lucide-react';
import { bookingService } from '@/services/booking.service';
import type { Booking } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AccountCancelledPage() {
  const [cancelled, setCancelled] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await bookingService.getCustomerBookings('cancelled');
        setCancelled(data);
      } catch (err) {
        console.error('Failed to load cancelled bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading cancellation history..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Cancelled Bookings & Refunds</h1>
          <p className="text-xs text-slate-500">Track cancellation reasons and refund status.</p>
        </div>
        <Badge variant="error">{cancelled.length} Cancelled</Badge>
      </div>

      {cancelled.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <XCircle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Cancelled Bookings</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            You don&apos;t have any cancelled travel reservations. All your bookings are in good standing!
          </p>
          <Link href="/account/bookings">
            <Button variant="outline" size="md">
              View All Bookings
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cancelled.map((b) => (
            <div key={b.id} className="rounded-2xl border border-rose-200 bg-rose-50/30 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-600">{b.bookingRef}</span>
                <Badge variant="error">CANCELLED</Badge>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={b.packageImage}
                    alt={b.packageName}
                    className="h-16 w-20 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{b.packageName}</h3>
                    <p className="text-xs text-rose-700 font-semibold">
                      Reason: {b.cancellationReason || 'Traveler plan changed'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Travel Date was: {formatDate(b.travelDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Refund Status</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    {formatCurrency(b.refundAmount || b.totalAmount)}
                  </span>
                  <span className="text-xs text-slate-500 block capitalize">
                    ({b.refundStatus || 'Pending Review'})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
