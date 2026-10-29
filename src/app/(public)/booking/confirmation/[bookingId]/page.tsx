import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  CheckCircle2,
  QrCode,
  Printer,
  Download,
  Calendar,
  Users,
  Building2,
  FileCheck,
  ArrowRight,
  Clock,
  XCircle,
} from 'lucide-react';
import { getBookingByIdOrRef } from '@/server/db/bookings';
import { getSessionUser } from '@/server/auth/guard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PaymentActionCard } from '@/components/booking/PaymentActionCard';
import { ROUTES } from '@/constants';

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const resolvedParams = await params;
  const booking = await getBookingByIdOrRef(resolvedParams.bookingId);

  if (!booking) {
    notFound();
  }

  // Enforce customer ownership on the server
  const auth = await getSessionUser();
  if (!auth) {
    redirect(`/login?redirect=/booking/confirmation/${encodeURIComponent(resolvedParams.bookingId)}`);
  }

  const isOwner =
    auth.user.role === 'admin' ||
    booking.customerId === auth.user.id ||
    booking.customerId === auth.user.customerProfile?.id ||
    booking.customerEmail === auth.user.email;

  if (!isOwner) {
    // Strictly prevent IDOR by returning 404
    notFound();
  }

  const isPending = booking.bookingStatus === 'pending';
  const isCancelled = booking.bookingStatus === 'cancelled';
  const isConfirmed = booking.bookingStatus === 'confirmed';

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 py-6 pb-16 sm:space-y-8 sm:px-6 sm:py-12 sm:pb-20 lg:px-8">
      {/* Celebration / Status Banner */}
      <div
        className={`space-y-4 rounded-3xl p-5 text-center text-white shadow-xl sm:p-10 ${
          isCancelled
            ? 'bg-rose-950'
            : isPending
            ? 'bg-slate-900 border border-slate-700'
            : 'bg-teal-900'
        }`}
      >
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg ${
            isCancelled ? 'bg-rose-600' : isPending ? 'bg-amber-500' : 'bg-emerald-500 animate-bounce'
          }`}
        >
          {isCancelled ? (
            <XCircle className="w-10 h-10" />
          ) : isPending ? (
            <Clock className="w-10 h-10" />
          ) : (
            <CheckCircle2 className="w-10 h-10" />
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
          {isCancelled
            ? 'Booking Cancelled'
            : isPending
            ? 'Reservation Created'
            : 'Booking Confirmed!'}
        </h1>
        <p className="text-slate-200 text-sm max-w-lg mx-auto">
          {isCancelled
            ? 'This travel reservation has been cancelled. Departure inventory has been released.'
            : isPending
            ? 'Your travel departure seats are currently reserved. Payment is pending gateway processing.'
            : 'Your travel reservation has been successfully completed. A digital voucher and confirmation have been dispatched.'}
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5 text-xs font-mono font-bold text-teal-300 border border-teal-700/50">
          <span>Booking Reference:</span>
          <span className="text-amber-400">{booking.bookingRef}</span>
        </div>
      </div>

      {/* Interactive Razorpay Gateway Action & Status Card */}
      <PaymentActionCard
        bookingId={booking.id}
        bookingRef={booking.bookingRef}
        totalAmount={booking.totalAmount}
        initialPaymentStatus={booking.paymentStatus}
        initialBookingStatus={booking.bookingStatus}
        expiresAt={booking.expiresAt}
      />

      {/* DIGITAL VOUCHER CARD */}
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:space-y-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 gap-4">
          <div className="space-y-1">
            <Badge
              variant={
                isConfirmed ? 'success' : isCancelled ? 'error' : 'warning'
              }
            >
              {isConfirmed
                ? 'CONFIRMED'
                : isCancelled
                ? 'CANCELLED'
                : 'PENDING PAYMENT'}
            </Badge>
            <h2 className="text-2xl font-extrabold text-slate-900">{booking.packageName}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              Operated by {booking.providerName}
            </p>
          </div>

          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 p-2 shadow-inner">
            <QrCode className="w-24 h-24 text-slate-900" />
          </div>
        </div>

        {/* Key Trip Details Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium block">Travel Date</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-700" />
              {formatDate(booking.travelDate)}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium block">Travelers Roster</span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-700" />
              {booking.travelers.adults} Adults, {booking.travelers.children} Children
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium block">Payment Status</span>
            <span className="text-sm font-bold text-slate-900 uppercase">
              {booking.paymentStatus} ({booking.paymentMethod || 'UPI'})
            </span>
          </div>
        </div>

        {/* Traveler Details List */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-700" /> Traveler Roster
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {booking.travelerDetails.map((t, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 text-xs flex justify-between">
                <span className="font-bold text-slate-900">
                  {t.firstName} {t.lastName}
                </span>
                <span className="text-slate-500">
                  {t.gender}, {t.age} yrs
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Snapshot Breakdown */}
        <div className="rounded-2xl bg-teal-50/50 p-4 border border-teal-100 space-y-2 text-xs text-slate-700">
          <div className="flex justify-between">
            <span>Base Package Amount</span>
            <span>{formatCurrency(booking.baseAmount)}</span>
          </div>
          {booking.optionalServicesAmount > 0 && (
            <div className="flex justify-between">
              <span>Optional Services</span>
              <span>+{formatCurrency(booking.optionalServicesAmount)}</span>
            </div>
          )}
          {booking.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Discount ({booking.couponCode})</span>
              <span>-{formatCurrency(booking.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-500">
            <span>Taxes (5% GST)</span>
            <span>+{formatCurrency(booking.taxAmount)}</span>
          </div>
          <div className="border-t border-teal-200 pt-2 flex justify-between font-extrabold text-base text-slate-900">
            <span>Total Amount ({booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'})</span>
            <span className="text-teal-800">{formatCurrency(booking.totalAmount)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2">
            <a
              href={`/api/bookings/${booking.id}/ticket`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />}>
                Print Voucher
              </Button>
            </a>
            <a
              href={`/api/bookings/${booking.id}/ticket`}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                Download PDF
              </Button>
            </a>
          </div>

          <Link href={ROUTES.ACCOUNT_BOOKINGS}>
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Go to My Bookings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
