'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarCheck, Search, Filter, Eye, RefreshCw,
  IndianRupee, X,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspection Modal
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (paymentStatusFilter !== 'ALL') params.set('paymentStatus', paymentStatusFilter);
      params.set('page', page.toString());
      params.set('limit', '15');

      const res = await fetch(`/api/admin/bookings?${params.toString()}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.items || data.bookings || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.total);
        } else {
          setTotalCount(data.count || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentStatusFilter, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-teal-700" /> Platform Bookings Master Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Cross-operator reservation audit trail, financial settlements, and live booking state machines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand">{totalCount} Master Bookings</Badge>
          <Link href="/admin/refunds">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5 text-amber-600" />}>
              Refund Audit Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ref, guest, email, package..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Booking:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-500">Payment:</span>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Payments</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <LoadingState label="Loading platform reservation ledger..." />
      ) : bookings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Reservations Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing or adjusting your search filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Ref Number</th>
                  <th className="py-3.5 px-4">Package & Operator</th>
                  <th className="py-3.5 px-4">Traveler Contact</th>
                  <th className="py-3.5 px-4">Travel Date</th>
                  <th className="py-3.5 px-4">Total GMV</th>
                  <th className="py-3.5 px-4">Booking Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{b.bookingRef}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800 line-clamp-1">{b.packageName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{b.providerName}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{b.customerName}</p>
                      <p className="text-[10px] text-slate-400">{b.customerEmail}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{formatDate(b.travelDate)}</td>
                    <td className="py-3.5 px-4 font-extrabold text-teal-800">{formatCurrency(b.totalAmount)}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'confirmed'
                            ? 'success'
                            : b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'cancelled'
                            ? 'neutral'
                            : 'warning'
                        }
                      >
                        {String(b.bookingStatus).toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          b.paymentStatus === 'PAID'
                            ? 'success'
                            : b.paymentStatus === 'REFUNDED'
                            ? 'neutral'
                            : b.paymentStatus === 'FAILED'
                            ? 'error'
                            : 'warning'
                        }
                      >
                        {b.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedBooking(b)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages} ({totalCount} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Inspection Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <Badge variant="brand">{selectedBooking.bookingRef}</Badge>
                <Badge variant={selectedBooking.bookingStatus === 'confirmed' ? 'success' : 'neutral'}>
                  {String(selectedBooking.bookingStatus).toUpperCase()}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-2">{selectedBooking.packageName}</h2>
              <p className="text-xs text-slate-500">Tour Operator: {selectedBooking.providerName}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Guest Name</span>
                <span className="font-bold text-slate-800">{selectedBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Travel Date</span>
                <span className="font-bold text-slate-800">{formatDate(selectedBooking.travelDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Party Size</span>
                <span className="font-bold text-slate-800">
                  {selectedBooking.adults} Adults{selectedBooking.children > 0 ? `, ${selectedBooking.children} Children` : ''}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Gross Booking Total</span>
                <span className="font-extrabold text-teal-800">{formatCurrency(selectedBooking.totalAmount)}</span>
              </div>
              {selectedBooking.commissionAmount > 0 && (
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Marketplace Take Rate ({selectedBooking.commissionRate}%)</span>
                  <span>{formatCurrency(selectedBooking.commissionAmount)}</span>
                </div>
              )}
              {selectedBooking.providerAmount > 0 && (
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Net Provider Settlement</span>
                  <span>{formatCurrency(selectedBooking.providerAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Payment Status</span>
                <span className="font-bold text-slate-800">{selectedBooking.paymentStatus}</span>
              </div>
              {selectedBooking.transactionId && (
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Transaction ID</span>
                  <span>{selectedBooking.transactionId}</span>
                </div>
              )}
              {selectedBooking.refundStatus && (
                <div className="flex justify-between text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-1">
                  <span>Refund Status</span>
                  <span className="font-bold">{selectedBooking.refundStatus} ({formatCurrency(selectedBooking.refundAmount || 0)})</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
              {selectedBooking.bookingStatus === 'cancelled' && selectedBooking.paymentStatus === 'PAID' && (
                <Link href="/admin/refunds">
                  <Button variant="primary" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                    Open Refund Queue
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
