'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, CheckCircle2, Clock, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { paymentService, type ProviderEarningsResponse } from '@/services/payment.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';

export default function ProviderEarningsPage() {
  const [data, setData] = useState<ProviderEarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stats = await paymentService.getProviderEarnings();
        setData(stats);
      } catch (err) {
        console.error('Failed to load provider earnings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleExportCsv() {
    if (!data || data.settlements.length === 0) {
      alert('No settlement records available to export.');
      return;
    }

    const headers = [
      'Booking Reference',
      'Tour Package',
      'Travel Date',
      'Gross Amount (INR)',
      'Commission Deducted (INR)',
      'Host Net Payable (INR)',
      'Payout Status',
      'Bank Reference / UTR',
      'Settled Date',
    ];

    const rows = data.settlements.map((s) => [
      `"${s.bookingRef}"`,
      `"${s.packageName.replace(/"/g, '""')}"`,
      `"${s.travelDate}"`,
      s.grossAmount,
      s.commissionAmount,
      s.providerAmount,
      `"${s.status}"`,
      `"${(s.referenceNote || '').replace(/"/g, '""')}"`,
      `"${s.settledAt ? s.settledAt.split('T')[0] : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VibeMiles_Earnings_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading || !data) {
    return <LoadingState label="Loading host earnings and settlement statements..." />;
  }

  const approvedPayouts = data.approvedAmount ?? 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-teal-700" /> Earnings & Monthly Payouts
        </h1>
        <p className="text-xs text-slate-500">
          Admin-controlled bank disbursement records, platform commissions, and net earnings statements.
        </p>
      </div>

      {/* Main Net Revenue Card */}
      <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Total Net Host Earnings</span>
          <h2 className="text-4xl font-black text-white mt-1">{formatCurrency(data.netPayable)}</h2>
          <p className="text-xs text-slate-400 mt-1">Calculated after standard 15% platform commission deduction</p>
        </div>
        <Button
          variant="accent"
          size="md"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportCsv}
        >
          Export CSV Statement
        </Button>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 block">Gross Bookings</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{formatCurrency(data.grossRevenue)}</span>
          <span className="text-xs text-slate-400 mt-1 block">Total customer transactions</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 block">Platform Fee (15%)</span>
          <span className="text-2xl font-black text-teal-700 mt-1 block">{formatCurrency(data.platformCommission)}</span>
          <span className="text-xs text-slate-400 mt-1 block">VibeMiles marketplace service cut</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-600 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase text-slate-500">
              {approvedPayouts > 0 ? 'Approved / Pending' : 'Pending Settlement'}
            </span>
          </div>
          <span className="text-2xl font-black text-amber-600 block">
            {formatCurrency(data.pendingSettlementAmount + approvedPayouts)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {approvedPayouts > 0
              ? `${formatCurrency(approvedPayouts)} approved, awaiting transfer`
              : 'Awaiting admin payout review'}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase text-slate-500">Settled to Bank</span>
          </div>
          <span className="text-2xl font-black text-emerald-700 block">{formatCurrency(data.settledAmount)}</span>
          <span className="text-xs text-slate-400 mt-1 block">Transferred to registered host bank</span>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-teal-700" /> Host Settlement & Payout Ledger
        </h3>

        {data.settlements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No booking payouts recorded yet. Host earnings will accrue as traveler bookings are placed.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Booking Ref</th>
                  <th className="px-4 py-3">Tour Package</th>
                  <th className="px-4 py-3">Departure</th>
                  <th className="px-4 py-3 text-right">Gross Total</th>
                  <th className="px-4 py-3 text-right">Commission Cut</th>
                  <th className="px-4 py-3 text-right">Host Net Amount</th>
                  <th className="px-4 py-3 text-center">Payout Status</th>
                  <th className="px-4 py-3">Bank UTR / Note</th>
                  <th className="px-4 py-3">Settled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data.settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{s.bookingRef}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{s.packageName}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.travelDate)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(s.grossAmount)}</td>
                    <td className="px-4 py-3 text-right text-rose-600">-{formatCurrency(s.commissionAmount)}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-teal-800">{formatCurrency(s.providerAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          s.status === 'SETTLED'
                            ? 'success'
                            : s.status === 'APPROVED'
                            ? 'info'
                            : s.status === 'CANCELLED'
                            ? 'error'
                            : 'warning'
                        }
                      >
                        {s.status === 'APPROVED' ? 'APPROVED (PENDING TRANSFER)' : s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {s.referenceNote || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.settledAt ? formatDate(s.settledAt) : <span className="text-slate-400">—</span>}
                    </td>
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
