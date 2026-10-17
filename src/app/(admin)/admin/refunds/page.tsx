'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { bookingService } from '@/services/booking.service';
import { paymentService } from '@/services/payment.service';
import type { Booking } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AdminRefundsPage() {
  const [cancelled, setCancelled] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const all = await bookingService.getAdminBookings();
        setCancelled(all.filter((b) => b.bookingStatus === 'cancelled'));
      } catch (err) {
        console.error('Failed to load cancelled bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function reloadCancelled() {
    try {
      const all = await bookingService.getAdminBookings();
      setCancelled(all.filter((b) => b.bookingStatus === 'cancelled'));
    } catch (err) {
      console.error('Failed to reload cancelled bookings:', err);
    }
  }

  async function handleProcessRefund(booking: Booking) {
    const refundAmt = booking.refundAmount ?? booking.totalAmount;
    if (
      !confirm(
        `Authorize gateway refund of ${formatCurrency(refundAmt)} for reservation ${booking.bookingRef}?`
      )
    ) {
      return;
    }

    setProcessingId(booking.id);
    try {
      await paymentService.processAdminRefund(booking.id, 'Admin audit queue approved refund');
      await reloadCancelled();
      alert(`Refund of ${formatCurrency(refundAmt)} successfully processed via gateway!`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to process gateway refund.');
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return <LoadingState label="Loading cancellation & refund queue..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-rose-600" /> Refund & Cancellation Audit Queue
          </h1>
          <p className="text-xs text-slate-500">Authorize refunds back to customer accounts via verified gateway operations.</p>
        </div>
        <Badge variant="error">{cancelled.length} Refund Requests</Badge>
      </div>

      {cancelled.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Refund Queue Clear</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            There are currently no cancelled bookings requiring refund review or financial settlement.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cancelled.map((b) => {
            const isProcessed = b.refundStatus === 'processed';
            const refundAmt = b.refundAmount ?? b.totalAmount;
            const isWorking = processingId === b.id;

            return (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-600 text-xs">{b.bookingRef}</span>
                    {isProcessed ? (
                      <Badge variant="success">REFUNDED</Badge>
                    ) : (
                      <Badge variant="warning">PENDING AUDIT</Badge>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{b.packageName}</h4>
                  <p className="text-xs text-rose-700 font-semibold mt-0.5">
                    Reason: {b.cancellationReason || 'Traveler requested cancellation'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customer: {b.customerName} | Booked: {formatDate(b.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Eligible Refund</span>
                    <span className="font-extrabold text-slate-900 text-base">
                      {formatCurrency(refundAmt)}
                    </span>
                  </div>
                  {isProcessed ? (
                    <Button variant="outline" size="sm" disabled leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}>
                      Refund Processed
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleProcessRefund(b)}
                      disabled={isWorking}
                      leftIcon={
                        isWorking ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {isWorking ? 'Processing...' : 'Authorize Refund'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
