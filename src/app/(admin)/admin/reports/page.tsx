'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3, Download, TrendingUp, IndianRupee,
  Users, Building2, ShieldCheck, FileSpreadsheet,
} from 'lucide-react';
import { adminService, type AdminReportsResponse } from '@/services/admin.service';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AdminReportsPage() {
  const [data, setData] = useState<AdminReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'30' | '90' | '365' | 'ALL'>('30');
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  async function loadReports() {
    setLoading(true);
    try {
      let startDate: string | undefined;
      if (dateRange !== 'ALL') {
        const days = parseInt(dateRange, 10);
        const d = new Date();
        d.setDate(d.getDate() - days);
        startDate = d.toISOString();
      }

      const res = await adminService.getReports({ startDate });
      setData(res);
    } catch (err) {
      console.error('Failed to load operational reports:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  function handleExportCsv(type: 'bookings' | 'settlements' | 'providers') {
    setExportLoading(type);
    window.location.href = `/api/admin/reports/export?type=${type}`;
    setTimeout(() => setExportLoading(null), 2000);
  }

  if (loading || !data) {
    return <LoadingState label="Computing operational marketplace analytics..." />;
  }

  const { report, metrics, definitions } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-700" /> Operational Reports & Marketplace Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Audit Gross Merchandise Value (GMV), payment captures, platform take-rate, and operator performance.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
          {(['30', '90', '365', 'ALL'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === r
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {r === 'ALL' ? 'All Time' : `Last ${r} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* CSV Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-teal-900 text-white p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-300" /> Authorized Operational Data Exports
          </h3>
          <p className="text-xs text-teal-200">
            Server-side generated CSV files with built-in formula injection protection and audit trail logging.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-teal-700 text-white hover:bg-teal-800"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            disabled={exportLoading === 'bookings'}
            onClick={() => handleExportCsv('bookings')}
          >
            {exportLoading === 'bookings' ? 'Exporting...' : 'Bookings CSV'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-teal-700 text-white hover:bg-teal-800"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            disabled={exportLoading === 'settlements'}
            onClick={() => handleExportCsv('settlements')}
          >
            {exportLoading === 'settlements' ? 'Exporting...' : 'Settlement Ledger CSV'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-teal-700 text-white hover:bg-teal-800"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            disabled={exportLoading === 'providers'}
            onClick={() => handleExportCsv('providers')}
          >
            {exportLoading === 'providers' ? 'Exporting...' : 'Operator Roster CSV'}
          </Button>
        </div>
      </div>

      {/* Financial Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GMV vs Collected */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Booking Value (GMV)</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(metrics.financial.grossBookingValue)}
              </h3>
            </div>
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <IndianRupee className="w-5 h-5" />
            </span>
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Captured Payments (PAID):</span>
              <strong className="text-slate-900">{formatCurrency(metrics.financial.collectedRevenue)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Paid Reservations:</span>
              <strong className="text-slate-900">{metrics.payments.paid}</strong>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic pt-1">{definitions.grossBookingValue}</p>
        </div>

        {/* Commission & Margins */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Take-Rate</p>
              <h3 className="text-2xl font-extrabold text-teal-800 mt-1">
                {formatCurrency(metrics.financial.platformCommissionEarned)}
              </h3>
            </div>
            <span className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Pending Provider Payables:</span>
              <strong className="text-slate-900">{formatCurrency(metrics.financial.providerPayablesPending)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Settled to Operators:</span>
              <strong className="text-slate-900">{formatCurrency(metrics.financial.providerAmountSettled)}</strong>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic pt-1">{definitions.platformCommissionEarned}</p>
        </div>

        {/* Refunds & Returns */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Processed Refunds</p>
              <h3 className="text-2xl font-extrabold text-rose-700 mt-1">
                {formatCurrency(metrics.financial.processedRefundAmount)}
              </h3>
            </div>
            <span className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
              <ShieldCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Refund Transactions Executed:</span>
              <strong className="text-slate-900">{metrics.refunds.processed}</strong>
            </div>
            <div className="flex justify-between">
              <span>Pending Queue:</span>
              <strong className="text-slate-900">{metrics.refunds.pending}</strong>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic pt-1">{definitions.processedRefundAmount}</p>
        </div>
      </div>

      {/* Bookings by Status & Top Operators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Status Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Booking Volume by Status
          </h3>
          <div className="space-y-3">
            {report.bookingsByStatus.map((b) => (
              <div key={b.status} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <Badge
                    variant={
                      b.status === 'CONFIRMED' || b.status === 'COMPLETED'
                        ? 'success'
                        : b.status === 'CANCELLED'
                        ? 'neutral'
                        : 'warning'
                    }
                  >
                    {b.status}
                  </Badge>
                  <span className="ml-2 font-semibold text-slate-700">{b.count} Reservations</span>
                </div>
                <span className="font-extrabold text-slate-900">{formatCurrency(b.volume)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Operators Performance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Top Performing Tour Operators
          </h3>
          {report.topProviders.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center">
              No confirmed bookings recorded in selected date range.
            </p>
          ) : (
            <div className="space-y-3">
              {report.topProviders.map((p, idx) => (
                <div key={p.providerId} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <div>
                      <p className="font-bold text-slate-900">{p.businessName}</p>
                      <p className="text-[10px] text-slate-500">{p.city} · {p.bookingCount} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-teal-800">{formatCurrency(p.grossAmount)}</p>
                    <p className="text-[10px] text-slate-400">Net: {formatCurrency(p.providerEarnings)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
