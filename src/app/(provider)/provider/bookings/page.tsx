'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck, Eye, Compass, Users } from 'lucide-react';
import { bookingService } from '@/services/booking.service';
import type { Booking } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';

export default function ProviderBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await bookingService.getProviderBookings();
        setBookings(data);
      } catch (err) {
        console.error('Failed to load provider bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading departure dispatch roster..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Bookings & Dispatch Roster</h1>
          <p className="text-xs text-slate-500">Manage incoming traveler reservations for your hosted packages.</p>
        </div>
        <Badge variant="brand">{bookings.length} Total Bookings</Badge>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 mb-4">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Reservations Received Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            As travellers discover and book your published travel packages, traveler manifests and departure dispatch rosters will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800 text-sm">{b.bookingRef}</span>
                    <Badge
                      variant={
                        b.bookingStatus === 'confirmed'
                          ? 'success'
                          : b.bookingStatus === 'completed'
                          ? 'info'
                          : b.bookingStatus === 'cancelled'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {b.bookingStatus.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{b.packageName}</h3>
                  <p className="text-xs text-slate-500">
                    Lead Passenger: {b.customerName} ({b.customerPhone}) | Travel Date: {formatDate(b.travelDate)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Party: {b.travelers.adults} Adults
                    {b.travelers.children > 0 && `, ${b.travelers.children} Children`}
                    {b.pickup && ` | Pickup: ${b.pickup}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Booking Value</span>
                  <span className="text-lg font-extrabold text-teal-800">{formatCurrency(b.totalAmount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
