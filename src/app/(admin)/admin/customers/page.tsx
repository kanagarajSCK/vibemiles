'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Lock, Unlock, Eye, Calendar, IndianRupee, ShieldAlert, X } from 'lucide-react';
import { adminService, type AdminCustomerItem } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Detail Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getCustomers({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 15,
      });
      setCustomers(res.items);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  async function handleToggleStatus(customer: AdminCustomerItem) {
    const isSuspending = customer.status === 'ACTIVE';
    const actionLabel = isSuspending ? 'suspend' : 'reactivate';
    const promptMessage = isSuspending
      ? `Enter mandatory reason for suspending ${customer.fullName}'s account:`
      : `Enter reason for reactivating ${customer.fullName}'s account:`;

    const reason = prompt(promptMessage);
    if (!reason || reason.trim().length === 0) {
      alert('A reason is strictly required to modify account status.');
      return;
    }

    setActionLoading(customer.userId);
    try {
      await adminService.updateCustomerStatus(
        customer.userId,
        isSuspending ? 'SUSPENDED' : 'ACTIVE',
        reason.trim()
      );
      await loadCustomers();
      alert(`Customer account successfully ${isSuspending ? 'suspended' : 'reactivated'}.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleViewDetails(userId: string) {
    setSelectedCustomerId(userId);
    setDetailsLoading(true);
    try {
      const res = await adminService.getCustomerDetails(userId);
      setCustomerDetails(res.customer);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load details');
      setSelectedCustomerId(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-700" /> Customer Account Administration
          </h1>
          <p className="text-xs text-slate-500">
            Database-backed traveler directory, booking history inspection, and fraud suspension controls.
          </p>
        </div>
        <Badge variant="brand">{totalCount} Registered Customers</Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <LoadingState label="Loading registered customer directory..." />
      ) : customers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Customers Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or status filter.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Bookings</th>
                  <th className="py-3.5 px-4">Total Spent</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customers.map((c) => (
                  <tr key={c.userId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>
                        <p>{c.fullName}</p>
                        <p className="text-[10px] font-normal text-amber-600 font-semibold">{c.rewardPoints} Reward Pts</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{c.email}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {c.city ? `${c.city}, ${c.state || ''}` : 'India'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{c.bookingCount}</td>
                    <td className="py-3.5 px-4 font-extrabold text-teal-700">{formatCurrency(c.totalSpent)}</td>
                    <td className="py-3.5 px-4">
                      {c.status === 'ACTIVE' ? (
                        <Badge variant="success">ACTIVE</Badge>
                      ) : (
                        <div title={c.suspensionReason || 'Account suspended'}>
                          <Badge variant="error">SUSPENDED</Badge>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => handleViewDetails(c.userId)}
                      >
                        Inspect
                      </Button>
                      <Button
                        variant={c.status === 'ACTIVE' ? 'outline' : 'primary'}
                        size="sm"
                        className={c.status === 'ACTIVE' ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : ''}
                        disabled={actionLoading === c.userId}
                        leftIcon={c.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        onClick={() => handleToggleStatus(c)}
                      >
                        {c.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
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

      {/* Customer Detail Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-6">
            <button
              onClick={() => {
                setSelectedCustomerId(null);
                setCustomerDetails(null);
              }}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {detailsLoading || !customerDetails ? (
              <LoadingState label="Loading traveler reservation & audit history..." />
            ) : (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={customerDetails.status === 'ACTIVE' ? 'success' : 'error'}>
                      {customerDetails.status}
                    </Badge>
                    <span className="text-xs text-slate-400">User ID: {customerDetails.userId}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{customerDetails.profile.fullName}</h2>
                  <p className="text-xs text-slate-500">
                    {customerDetails.email} · {customerDetails.phone || 'No phone recorded'} · Joined {formatDate(customerDetails.createdAt)}
                  </p>
                  {customerDetails.profile.suspensionReason && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                      <strong>Suspension Reason:</strong> {customerDetails.profile.suspensionReason}
                    </div>
                  )}
                </div>

                {/* Booking History */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-700" /> Booking History ({customerDetails.bookings.length})
                  </h3>
                  {customerDetails.bookings.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No bookings placed yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {customerDetails.bookings.map((b: any) => (
                        <div key={b.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{b.bookingRef} — {b.packageName}</p>
                            <p className="text-slate-500 text-[10px]">Travel Date: {formatDate(b.travelDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-teal-800">{formatCurrency(b.totalAmount)}</p>
                            <Badge variant={b.bookingStatus === 'confirmed' ? 'success' : 'neutral'} size="sm">
                              {b.bookingStatus.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audit Logs */}
                {customerDetails.auditLogs && customerDetails.auditLogs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-violet-700" /> Administrative Audit Log
                    </h3>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      {customerDetails.auditLogs.map((log: any) => (
                        <div key={log.id} className="p-2 rounded-lg bg-slate-100 text-[11px]">
                          <span className="font-bold text-slate-800">{log.action}</span> by {log.actorEmail} on {formatDate(log.createdAt)}:
                          <span className="text-slate-500 italic"> &ldquo;{log.reason}&rdquo;</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
