'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  TrendingUp,
  Receipt,
  ShieldAlert,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { paymentService, type AdminFinancialResponse } from '@/services/payment.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AdminPaymentsPage() {
  const [data, setData] = useState<AdminFinancialResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stats = await paymentService.getAdminFinancialStats();
        setData(stats);
      } catch (err) {
        console.error('Failed to load admin financial stats:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return <LoadingState label="Loading platform revenue & financial ledger..." />;
  }

  const pSum = data.paymentsSummary || {
    capturedCount: 0,
    capturedAmount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    failedCount: 0,
    failedAmount: 0,
    refundedCount: 0,
    refundedAmount: 0,
  };

  const paySum = data.payoutsSummary || {
    pendingCount: 0,
    pendingAmount: 0,
    approvedCount: 0,
    approvedAmount: 0,
    processingCount: 0,
    processingAmount: 0,
    settledCount: 0,
    settledAmount: 0,
    onHoldCount: 0,
    onHoldAmount: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-700" /> Platform Revenue & Payment Control
          </h1>
          <p className="text-xs text-slate-500">
            Centrally monitor customer gateway collections, platform commission ({data.commissionRate}%), and admin-controlled provider payout settlements.
          </p>
        </div>
        <Link href="/admin/settlements">
          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Manage Payout Settlements
          </Button>
        </Link>
      </div>

      {/* Main KPI Hero Card */}
      <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
            Total Net Platform Commission Revenue
          </span>
          <h2 className="text-4xl font-black text-white mt-1">
            {formatCurrency(data.totalCommissionEarned)}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {data.commissionRate}% auto-deducted platform take-rate on all marketplace bookings
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
            <span className="text-slate-400 block">Gross Booking Volume</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{formatCurrency(data.grossVolume)}</span>
          </div>
          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-sm">
            <span className="text-slate-400 block">GST Collected (5%)</span>
            <span className="text-lg font-bold text-amber-300 mt-0.5 block">{formatCurrency(data.totalTaxCollected)}</span>
          </div>
        </div>
      </div>

      {/* Section: Customer Payments vs Provider Payouts Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Gateway Payments Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-700" /> Customer Gateway Payments
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Central Razorpay Gateway</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-3">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Captured & Paid
              </div>
              <div className="text-lg font-black text-emerald-900 mt-1">
                {formatCurrency(pSum.capturedAmount)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">{pSum.capturedCount} transactions</div>
            </div>

            <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Checkout
              </div>
              <div className="text-lg font-black text-amber-900 mt-1">
                {formatCurrency(pSum.pendingAmount)}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">{pSum.pendingCount} reservations</div>
            </div>

            <div className="rounded-xl bg-rose-50/70 border border-rose-100 p-3">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Failed Payments
              </div>
              <div className="text-lg font-black text-rose-900 mt-1">
                {formatCurrency(pSum.failedAmount)}
              </div>
              <div className="text-[10px] text-rose-700 mt-0.5">{pSum.failedCount} declined</div>
            </div>

            <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3">
              <div className="flex items-center gap-1.5 text-indigo-800 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" /> Total Refunds
              </div>
              <div className="text-lg font-black text-indigo-900 mt-1">
                {formatCurrency(data.totalRefunds)}
              </div>
              <div className="text-[10px] text-indigo-700 mt-0.5">Processed cancellations</div>
            </div>
          </div>
        </div>

        {/* Provider Payouts & Settlement Pipeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-700" /> Provider Payouts Pipeline
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Admin Authorization</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Pending Review
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {formatCurrency(paySum.pendingAmount)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{paySum.pendingCount} bookings awaiting clearance</div>
            </div>

            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Approved for Payout
              </div>
              <div className="text-lg font-black text-blue-900 mt-1">
                {formatCurrency(paySum.approvedAmount)}
              </div>
              <div className="text-[10px] text-blue-700 mt-0.5">{paySum.approvedCount} ready for bank transfer</div>
            </div>

            <div className="rounded-xl bg-teal-50/70 border border-teal-100 p-3">
              <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Processing in Bank
              </div>
              <div className="text-lg font-black text-teal-900 mt-1">
                {formatCurrency(paySum.processingAmount)}
              </div>
              <div className="text-[10px] text-teal-700 mt-0.5">{paySum.processingCount} in transit</div>
            </div>

            <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-3">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled (Paid Out)
              </div>
              <div className="text-lg font-black text-emerald-900 mt-1">
                {formatCurrency(paySum.settledAmount)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">{paySum.settledCount} transferred to bank</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Settlement Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-700" /> Recent Settlement & Commission Ledger
          </h3>
          <span className="text-xs text-slate-400">Latest 50 transactions</span>
        </div>

        {data.recentLedger.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No settlement ledger entries recorded yet. Transactions will populate upon booking creation.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Booking Ref</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Gross Total</th>
                  <th className="px-4 py-3">Tax (GST)</th>
                  <th className="px-4 py-3">Commission (15%)</th>
                  <th className="px-4 py-3">Provider Net</th>
                  <th className="px-4 py-3">Payout Status</th>
                  <th className="px-4 py-3">Settlement Ref / UTR</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data.recentLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{row.bookingRef}</td>
                    <td className="px-4 py-3">{row.providerName}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(row.grossAmount)}</td>
                    <td className="px-4 py-3 text-slate-500">{formatCurrency(row.taxAmount)}</td>
                    <td className="px-4 py-3 font-bold text-teal-700">{formatCurrency(row.commissionAmount)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(row.providerAmount)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          row.status === 'SETTLED'
                            ? 'success'
                            : row.status === 'APPROVED'
                            ? 'info'
                            : row.status === 'CANCELLED'
                            ? 'error'
                            : 'warning'
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {row.referenceNote ? (
                        <span className="text-slate-800">{row.referenceNote}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
