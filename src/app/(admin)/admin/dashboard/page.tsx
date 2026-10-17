'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Users, Building2, Package as PackageIcon,
  ShieldAlert, AlertTriangle, CheckCircle2,
  IndianRupee, ArrowUpRight, ArrowRight, BarChart2,
  RefreshCw, CalendarCheck, Clock, UserCheck, UserX,
  CreditCard, RotateCcw, Eye, FileText,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ROUTES } from '@/constants';
import { adminService, type AdminDashboardResponse, type AdminProviderItem } from '@/services/admin.service';
import { packageService } from '@/services/package.service';
import { bookingService } from '@/services/booking.service';
import type { Booking, Package as DomainPackage } from '@/types';

const QUICK_ACTIONS = [
  { label: 'Manage All Users', href: ROUTES.ADMIN_USERS, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 hover:bg-indigo-100' },
  { label: 'KYC & Providers', href: ROUTES.ADMIN_PROVIDERS, icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100' },
  { label: 'Moderate Listings', href: ROUTES.ADMIN_PACKAGES, icon: PackageIcon, color: 'text-teal-600', bg: 'bg-teal-50 hover:bg-teal-100' },
  { label: 'Bookings Ledger', href: ROUTES.ADMIN_BOOKINGS, icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
  { label: 'Payouts & Settlements', href: ROUTES.ADMIN_SETTLEMENTS, icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100' },
  { label: 'Audit Trail', href: ROUTES.ADMIN_AUDIT_LOGS, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50 hover:bg-rose-100' },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [timeRange, setTimeRange] = useState<'ALL' | '7D' | '30D' | '90D'>('ALL');
  const [pendingProviders, setPendingProviders] = useState<AdminProviderItem[]>([]);
  const [pendingPackages, setPendingPackages] = useState<DomainPackage[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let startDate: string | undefined;
      const now = Date.now();
      if (timeRange === '7D') startDate = new Date(now - 7 * 86400000).toISOString();
      else if (timeRange === '30D') startDate = new Date(now - 30 * 86400000).toISOString();
      else if (timeRange === '90D') startDate = new Date(now - 90 * 86400000).toISOString();

      const [metricsRes, providersRes, packagesRes, bookingsRes] = await Promise.all([
        adminService.getDashboardMetrics(startDate ? { startDate } : undefined),
        adminService.getProviders({ verificationStatus: 'PENDING', limit: 3 }).catch(() => ({ items: [] })),
        packageService.getAdminPackages({ status: 'PENDING_REVIEW' }).catch(() => []),
        bookingService.getAdminBookings().catch(() => []),
      ]);

      setData(metricsRes);
      setPendingProviders(providersRes.items || []);
      setPendingPackages(packagesRes.slice(0, 3));
      setRecentBookings(bookingsRes.slice(0, 5));
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleVerifyProvider(providerId: string, status: 'VERIFIED' | 'REJECTED') {
    const reason = status === 'REJECTED'
      ? prompt('Enter rejection reason:')
      : 'KYC verified by administrator';

    if (status === 'REJECTED' && !reason) return;

    setActionLoading(providerId);
    try {
      await adminService.reviewProviderVerification(providerId, status, reason || undefined);
      await loadDashboard(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprovePackage(packageId: string) {
    if (!confirm('Approve this package for marketplace publication?')) return;
    setActionLoading(packageId);
    try {
      await packageService.adminApprovePackage(packageId);
      await loadDashboard(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading || !data) {
    return <LoadingState label="Loading admin command center..." />;
  }

  const m = data.metrics as any;

  return (
    <div className="space-y-8">
      {/* Top Banner & Time Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Command Center</h1>
            <Badge variant="brand">Live PostgreSQL</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-tenant marketplace operations, KYC compliance, revenue reconciliation, and catalog moderation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range selector */}
          <div className="inline-flex rounded-xl bg-slate-200/70 p-1">
            {(['ALL', '7D', '30D', '90D'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'ALL' ? 'All Time' : r}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboard(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Primary Financial Ledger Hero Card */}
      <div className="rounded-3xl bg-slate-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Net Platform Commission Revenue
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-1">
              {formatCurrency(m.financial.platformCommissionEarned)}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Platform take-rate retained from verified settlements (excludes provider payouts & taxes)
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs text-slate-400 block font-medium">Gross Booking Value</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{formatCurrency(m.financial.grossBookingValue)}</span>
              <span className="text-[10px] text-emerald-400">{m.bookings.confirmed + m.bookings.completed} Confirmed GMV</span>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <span className="text-xs text-slate-400 block font-medium">Collected Funds</span>
              <span className="text-lg font-bold text-teal-300 mt-0.5 block">{formatCurrency(m.financial.collectedRevenue)}</span>
              <span className="text-[10px] text-teal-400">{m.payments.paid} Settled Payments</span>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 block font-medium">Refunds Processed</span>
              <span className="text-lg font-bold text-rose-300 mt-0.5 block">{formatCurrency(m.financial.processedRefundAmount)}</span>
              <span className="text-[10px] text-rose-400">{m.refunds.processed} Processed</span>
            </div>
          </div>
        </div>

        {/* Secondary Financial Metrics Sub-Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <span className="text-slate-400">Pending Provider Payouts:</span>
            <span className="font-bold text-amber-300 text-sm">{formatCurrency(m.financial.providerPayablesPending)}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <span className="text-slate-400">Remitted Operator Settlements:</span>
            <span className="font-bold text-emerald-300 text-sm">{formatCurrency(m.financial.providerAmountSettled)}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 sm:col-span-2 lg:col-span-1">
            <span className="text-slate-400">Pending Gateway Refunds:</span>
            <span className="font-bold text-rose-300 text-sm">{m.refunds.pending} In Review</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Management Hubs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 transition-all ${action.bg} text-center group`}
              >
                <div className={`p-2.5 rounded-xl bg-white shadow-sm mb-2 group-hover:scale-105 transition-transform ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Grid of 3 Operational Modules: Users, Listings, Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module 1: User & Identity Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-indigo-600" /> Platform Accounts & Identity
            </h3>
            <Link href={ROUTES.ADMIN_USERS} className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 block">Total Registered</span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">{m.users.totalUsers ?? (m.users.totalCustomers + m.users.totalProviders + (m.users.totalAdmins ?? 1))}</span>
              <span className="text-[10px] text-slate-400">All registered users</span>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-xs text-indigo-700 block font-semibold">Active Accounts</span>
              <span className="text-2xl font-black text-indigo-900 mt-0.5 block">{m.users.activeUsers ?? (m.users.activeCustomers + m.users.totalProviders)}</span>
              <span className="text-[10px] text-indigo-600">Unrestricted logins</span>
            </div>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> Customer Profiles:</span>
              <span className="font-bold text-slate-900">{m.users.totalCustomers}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" /> Tour Operator Profiles:</span>
              <span className="font-bold text-slate-900">{m.users.totalProviders}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> System Administrators:</span>
              <span className="font-bold text-rose-700">{m.users.totalAdmins ?? 1}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600 flex items-center gap-1.5"><UserX className="w-3.5 h-3.5 text-amber-500" /> Suspended Accounts:</span>
              <span className="font-bold text-amber-700">{m.users.suspendedUsers ?? (m.users.suspendedCustomers + m.users.suspendedProviders)}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-teal-500" /> New Signups (Last 7d):</span>
              <span className="font-bold text-teal-700">{m.users.newRegistrations7d ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Module 2: Listing Moderation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <PackageIcon className="w-4 h-4 text-teal-600" /> Service Listings Status
            </h3>
            <Link href={ROUTES.ADMIN_PACKAGES} className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1">
              Moderate <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-xs text-amber-800 block font-semibold">In Review Queue</span>
              <span className="text-2xl font-black text-amber-900 mt-0.5 block">{m.listings.awaitingModeration}</span>
              <span className="text-[10px] text-amber-700">Requires review</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-xs text-emerald-800 block font-semibold">Published Live</span>
              <span className="text-2xl font-black text-emerald-900 mt-0.5 block">{m.listings.published}</span>
              <span className="text-[10px] text-emerald-700">Marketplace visible</span>
            </div>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">Total Packages in DB:</span>
              <span className="font-bold text-slate-900">{m.listings.totalPackages ?? (m.listings.published + m.listings.awaitingModeration + m.listings.archived + m.listings.rejected + m.listings.draft)}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">Approved by Admin:</span>
              <span className="font-bold text-emerald-700">{m.listings.approved ?? m.listings.published}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">Rejected Submissions:</span>
              <span className="font-bold text-rose-700">{m.listings.rejected}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">Suspended / Archived:</span>
              <span className="font-bold text-slate-700">{m.listings.archived}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">Provider Drafts:</span>
              <span className="font-bold text-slate-500">{m.listings.draft}</span>
            </div>
          </div>
        </div>

        {/* Module 3: Bookings & Operations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <CalendarCheck className="w-4 h-4 text-blue-600" /> Bookings & Journeys
            </h3>
            <Link href={ROUTES.ADMIN_BOOKINGS} className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <span className="text-xs text-blue-800 block font-semibold">Total Bookings</span>
              <span className="text-2xl font-black text-blue-900 mt-0.5 block">{m.bookings.total}</span>
              <span className="text-[10px] text-blue-700">Platform reservations</span>
            </div>
            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200">
              <span className="text-xs text-teal-800 block font-semibold">Confirmed & Active</span>
              <span className="text-2xl font-black text-teal-900 mt-0.5 block">{m.bookings.confirmed}</span>
              <span className="text-[10px] text-teal-700">Ready to travel</span>
            </div>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">Completed Journeys:</span>
              <span className="font-bold text-emerald-700">{m.bookings.completed}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">Pending Checkout:</span>
              <span className="font-bold text-amber-700">{m.bookings.pending}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">Cancelled Bookings:</span>
              <span className="font-bold text-slate-700">{m.bookings.cancelled}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">Rejected by Provider:</span>
              <span className="font-bold text-rose-700">{m.bookings.rejected ?? 0}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-600">Settled Payouts:</span>
              <Link href={ROUTES.ADMIN_SETTLEMENTS} className="font-bold text-indigo-600 hover:underline">
                View Ledger
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Pending Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Queue 1: Pending Provider KYC Documents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-600" /> Pending Provider KYC Approvals
            </h2>
            <Link href={ROUTES.ADMIN_PROVIDERS} className="text-xs font-semibold text-violet-600 hover:underline">
              View All ({pendingProviders.length})
            </Link>
          </div>

          {pendingProviders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              All partner KYC document submissions have been reviewed.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingProviders.map((provider) => (
                <div key={provider.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{provider.businessName}</span>
                      <Badge variant="warning">KYC PENDING</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {provider.ownerName} • {provider.city}, {provider.state} • {provider.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={actionLoading === provider.id}
                      onClick={() => handleVerifyProvider(provider.id, 'VERIFIED')}
                    >
                      Verify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyProvider(provider.id, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue 2: Pending Listing Submissions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PackageIcon className="w-5 h-5 text-teal-600" /> Listings Awaiting Moderation
            </h2>
            <Link href={ROUTES.ADMIN_PACKAGES} className="text-xs font-semibold text-teal-600 hover:underline">
              Review Queue ({pendingPackages.length})
            </Link>
          </div>

          {pendingPackages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              No travel listings currently awaiting moderation.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPackages.map((pkg) => (
                <div key={pkg.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={pkg.images[0] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'}
                      alt={pkg.name}
                      className="w-12 h-12 rounded-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{pkg.name}</span>
                      <p className="text-xs text-slate-500">
                        {pkg.providerName} • {formatCurrency(pkg.finalPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/packages/${pkg.slug}`}>
                      <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        Preview
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={actionLoading === pkg.id}
                      onClick={() => handleApprovePackage(pkg.id)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings Live Ledger */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" /> Recent Marketplace Bookings
          </h2>
          <Link href={ROUTES.ADMIN_BOOKINGS} className="text-xs font-semibold text-indigo-600 hover:underline">
            View All Bookings
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No bookings recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Travel Date</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Booking Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-slate-900">{b.bookingRef}</td>
                    <td className="py-3 text-slate-700">{b.contactName || 'Guest Traveler'}</td>
                    <td className="py-3 text-slate-500">{formatDate(b.travelDate)}</td>
                    <td className="py-3 font-bold text-slate-900">{formatCurrency(b.totalAmount)}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          (b.bookingStatus as string).toUpperCase() === 'CONFIRMED' || (b.bookingStatus as string).toUpperCase() === 'COMPLETED'
                            ? 'success'
                            : (b.bookingStatus as string).toUpperCase() === 'PENDING'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {b.bookingStatus}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Link href={ROUTES.ADMIN_BOOKINGS}>
                        <Button variant="ghost" size="sm">Inspect</Button>
                      </Link>
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
