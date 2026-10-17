'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Receipt, ShieldAlert, FileSpreadsheet } from 'lucide-react';
import { paymentService, type AdminFinancialResponse } from '@/services/payment.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
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

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-teal-700" /> Platform Revenue & Commission Ledger
        </h1>
        <p className="text-xs text-slate-500">
          Track marketplace platform commission cuts ({data.commissionRate}% standard rate), GST collections, and provider settlement payables.
        </p>
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

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-teal-700 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-500 uppercase">Provider Payables</span>
          </div>
          <span className="text-2xl font-black text-slate-900">{formatCurrency(data.totalProviderPayables)}</span>
          <p className="text-xs text-slate-400 mt-1">Net disbursement balance due to verified travel hosts</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-500 uppercase">Refunds Processed</span>
          </div>
          <span className="text-2xl font-black text-rose-600">{formatCurrency(data.totalRefunds)}</span>
          <p className="text-xs text-slate-400 mt-1">Total customer refunds processed via gateway</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Receipt className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-500 uppercase">Settlement Entries</span>
          </div>
          <span className="text-2xl font-black text-slate-900">{data.recentLedger.length}</span>
          <p className="text-xs text-slate-400 mt-1">Total active booking transactions tracked in ledger</p>
        </div>
      </div>

      {/* Transaction Settlement Ledger Table */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-teal-700" /> Recent Settlement & Commission Ledger
        </h3>

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
                  <th className="px-4 py-3">Status</th>
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
                            : row.status === 'CANCELLED'
                            ? 'error'
                            : 'warning'
                        }
                      >
                        {row.status}
                      </Badge>
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
