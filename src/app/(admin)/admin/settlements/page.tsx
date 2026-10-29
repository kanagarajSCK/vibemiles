'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Search, Filter, RefreshCw, CheckCircle2,
  Clock, AlertCircle, ArrowUpRight, IndianRupee, Building2,
  FileText, ExternalLink, X, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SettlementItem {
  id: string;
  bookingId: string;
  bookingRef: string;
  providerId: string;
  providerName: string;
  ownerName: string;
  bankAccountMasked: string;
  bankIfsc: string | null;
  grossAmount: number;
  taxAmount: number;
  commissionRate: number;
  commissionAmount: number;
  providerAmount: number;
  status: string;
  settledAt: string | null;
  referenceNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal Action
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('SETTLED');
  const [referenceNote, setReferenceNote] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getSettlements({
        search: search.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 15,
      });

      setSettlements(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load settlements ledger');
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleUpdateStatus = async () => {
    if (!selectedSettlement) return;
    setActionLoading(true);
    setError(null);
    try {
      await adminService.updateSettlementStatus(
        selectedSettlement.id,
        targetStatus,
        referenceNote.trim() || undefined
      );

      showSuccess(`Settlement for booking ${selectedSettlement.bookingRef} updated to ${targetStatus}.`);
      setSelectedSettlement(null);
      setReferenceNote('');
      await fetchSettlements();
    } catch (err: any) {
      setError(err?.message || 'Failed to update settlement status');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics summary calculation
  const totalGross = settlements.reduce((acc, s) => acc + s.grossAmount, 0);
  const totalCommission = settlements.reduce((acc, s) => acc + s.commissionAmount, 0);
  const totalPayable = settlements.reduce((acc, s) => acc + s.providerAmount, 0);
  const pendingCount = settlements.filter((s) => s.status === 'PENDING').length;
  const settledCount = settlements.filter((s) => s.status === 'SETTLED').length;

  const renderStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SETTLED':
        return <Badge variant="success" size="sm">SETTLED</Badge>;
      case 'APPROVED':
        return <Badge variant="info" size="sm">APPROVED</Badge>;
      case 'PROCESSING':
        return <Badge variant="brand" size="sm">PROCESSING</Badge>;
      case 'PENDING':
        return <Badge variant="warning" size="sm">PENDING</Badge>;
      case 'ON_HOLD':
        return <Badge variant="neutral" size="sm">ON HOLD</Badge>;
      case 'FAILED':
        return <Badge variant="error" size="sm">FAILED</Badge>;
      case 'CANCELLED':
        return <Badge variant="error" size="sm">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-700" /> Operator Payouts & Settlements Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Reconcile tour operator payables, platform commissions, and bank disbursement records from PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchSettlements} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Badge variant="brand">{totalCount} Ledger Entries</Badge>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Booking Value</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalGross)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total across current view</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Commission</div>
          <div className="text-2xl font-black text-teal-800 mt-1">{formatCurrency(totalCommission)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Retained platform earnings</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider Payables</div>
          <div className="text-2xl font-black text-indigo-900 mt-1">{formatCurrency(totalPayable)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Net disburseable to operators</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settlement Health</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold text-amber-700">{pendingCount} Pending</span>
            <span className="text-slate-300">/</span>
            <span className="text-lg font-bold text-teal-700">{settledCount} Settled</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Disbursement ledger split</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-full md:w-96">
          <Input
            placeholder="Search by booking reference or operator name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'PENDING', 'APPROVED', 'PROCESSING', 'SETTLED', 'ON_HOLD', 'FAILED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setStatusFilter(tab);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Settlements Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading settlements records...</div>
        ) : settlements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No settlement records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Operator / Business</th>
                  <th className="py-3 px-4">Bank Account</th>
                  <th className="py-3 px-4 text-right">Gross Booking</th>
                  <th className="py-3 px-4 text-right">Commission</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Settled At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {s.bookingRef}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{s.providerName}</div>
                      <div className="text-[11px] text-slate-400">{s.ownerName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700">{s.bankAccountMasked}</div>
                      {s.bankIfsc && (
                        <div className="text-[10px] text-slate-400 font-mono">IFSC: {s.bankIfsc}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {formatCurrency(s.grossAmount)}
                    </td>
                    <td className="py-3 px-4 text-right text-teal-800 font-semibold">
                      {formatCurrency(s.commissionAmount)}
                      <span className="text-[10px] text-slate-400 ml-1">({s.commissionRate}%)</span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      {formatCurrency(s.providerAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderStatusBadge(s.status)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {s.settledAt ? formatDate(s.settledAt) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSettlement(s);
                          setTargetStatus(s.status === 'SETTLED' ? 'SETTLED' : 'SETTLED');
                          setReferenceNote(s.referenceNote || '');
                        }}
                      >
                        Reconcile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page {page} of {totalPages} ({totalCount} total entries)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Settlement Reconciliation Modal ── */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-700" /> Reconcile Payout Settlement
              </h3>
              <button onClick={() => setSelectedSettlement(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>Booking Reference: <strong className="text-slate-900 font-mono">{selectedSettlement.bookingRef}</strong></div>
              <div>Operator: <strong className="text-slate-900">{selectedSettlement.providerName}</strong></div>
              <div>Bank Account: <strong className="text-slate-800 font-mono">{selectedSettlement.bankAccountMasked}</strong></div>
              <div className="pt-2 flex justify-between font-bold text-slate-900 text-sm border-t border-slate-100">
                <span>Net Payable Amount:</span>
                <span className="text-teal-800">{formatCurrency(selectedSettlement.providerAmount)}</span>
              </div>
            </div>

            {/* Target Status Select */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Update Settlement Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
              >
                <option value="APPROVED">APPROVED (Approved by Admin, awaiting payout batch)</option>
                <option value="PROCESSING">PROCESSING (In transit / banking batch)</option>
                <option value="SETTLED">SETTLED (Disbursed to host bank with UTR)</option>
                <option value="PENDING">PENDING (Awaiting clearance)</option>
                <option value="ON_HOLD">ON_HOLD (Compliance or dispute review hold)</option>
                <option value="FAILED">FAILED (Transfer rejected by bank)</option>
              </select>
            </div>

            {/* Reference Note / Bank UTR */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Bank UTR / Transaction Reference Note
              </label>
              <input
                type="text"
                placeholder="e.g. UTR-98234710293 or NEFT-REF-202610"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">
                Recording bank reference creates an immutable audit trail entry.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="ghost" size="sm" onClick={() => setSelectedSettlement(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={actionLoading}
                onClick={handleUpdateStatus}
              >
                Confirm Settlement Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
