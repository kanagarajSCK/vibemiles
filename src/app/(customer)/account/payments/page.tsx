'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, Download, Receipt } from 'lucide-react';
import { bookingService } from '@/services/booking.service';
import type { Booking } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AccountPaymentsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await bookingService.getCustomerBookings('all');
        setBookings(data);
      } catch (err) {
        console.error('Failed to load payments:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading payment records..." />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-teal-700" /> Payment History & Invoices
        </h1>
        <p className="text-xs text-slate-500">Transaction records, GST invoices, and payment receipts.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 mb-4">
            <Receipt className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Payment Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Invoices and payment receipts for your reservations will appear here once bookings are confirmed.
          </p>
          <Link href="/packages">
            <Button variant="primary" size="md">
              Explore Tours
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div>
                <h4 className="font-bold text-sm text-slate-900">{b.packageName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ref: <span className="font-mono text-teal-700 font-bold">{b.bookingRef}</span>
                  {b.transactionId && ` | Txn: ${b.transactionId}`} | Date: {formatDate(b.createdAt)}
                </p>
                <p className="text-xs font-semibold text-slate-600 mt-1 capitalize">
                  Payment Status: <span className="text-teal-800 uppercase font-bold">{b.paymentStatus}</span> ({b.paymentMethod || 'UPI'})
                </p>
              </div>
              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <span className="font-extrabold text-teal-800 text-sm">
                  {formatCurrency(b.totalAmount)}
                </span>
                {b.paymentStatus === 'paid' ? (
                  <Link href={`/booking/confirmation/${b.id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                      Voucher / Receipt
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/booking/confirmation/${b.id}`}>
                    <Button variant="primary" size="sm" leftIcon={<CreditCard className="w-3.5 h-3.5" />}>
                      Pay Now
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
