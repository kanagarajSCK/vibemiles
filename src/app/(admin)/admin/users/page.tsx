'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Filter, ShieldAlert, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw, Eye, Trash2,
  KeyRound, UserCheck, UserX, Clock, Building2,
  ArrowRight, X, Shield, Lock,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ROUTES } from '@/constants';

interface AdminUserItem {
  id: string;
  email: string;
  phone: string | null;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  name: string;
  createdAt: string;
  updatedAt: string;
  activeSessionsCount: number;
  customerProfile: {
    id: string;
    fullName: string;
    city: string | null;
    state: string | null;
    isBlocked: boolean;
    suspensionReason: string | null;
    bookingCount: number;
    reviewCount: number;
  } | null;
  providerProfile: {
    id: string;
    businessName: string;
    ownerName: string;
    category: string;
    city: string;
    state: string;
    verificationStatus: string;
    isActive: boolean;
    rating: number;
    packagesCount: number;
    bookingsCount: number;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'PROVIDER' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Status Change Modal
  const [statusModalUser, setStatusModalUser] = useState<AdminUserItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');

  // Delete Modal
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUserItem | null>(null);
  const [deleteUserDetails, setDeleteUserDetails] = useState<any | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(true);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // Debounce search to prevent excessive database hits on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await adminService.getUsers({
        search: debouncedSearch.trim() || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 15,
      });

      setUsers(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open User Details
  async function openUserDetails(userId: string) {
    setDetailsLoading(true);
    try {
      const res = await adminService.getUserDetails(userId);
      setSelectedUser(res.data);
    } catch (err: any) {
      alert(err?.message || 'Failed to load user details');
    } finally {
      setDetailsLoading(false);
    }
  }

  // Handle Status Update
  async function handleConfirmStatusChange() {
    if (!statusModalUser) return;
    if (!statusReason.trim() || statusReason.trim().length < 5) {
      alert('Please provide a specific reason (at least 5 characters).');
      return;
    }

    setActionLoading(statusModalUser.id);
    try {
      await adminService.updateUserStatus(statusModalUser.id, targetStatus, statusReason.trim());
      setStatusModalUser(null);
      setStatusReason('');
      await fetchUsers(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to update account status');
    } finally {
      setActionLoading(null);
    }
  }

  // Prepare Delete Modal with Financial Impact Analysis (Instant UX)
  async function openDeleteModal(user: AdminUserItem) {
    const hasFinancial =
      ((user.customerProfile?.bookingCount || 0) + (user.providerProfile?.bookingsCount || 0)) > 0;

    setDeleteModalUser(user);
    setDeleteReason('');
    setDeleteConfirmationInput('');
    setIsPermanentDelete(true);
    setDeleteUserDetails({
      financialSummary: {
        hasFinancialRecords: hasFinancial,
        customerBookingsCount: user.customerProfile?.bookingCount || 0,
        providerBookingsCount: user.providerProfile?.bookingsCount || 0,
      },
    });

    try {
      const res = await adminService.getUserDetails(user.id);
      if (res?.data) {
        setDeleteUserDetails(res.data);
      }
    } catch {
      // Keep optimistic details
    }
  }

  // Handle Account Deletion
  async function handleConfirmDelete() {
    if (!deleteModalUser) return;

    if (!deleteReason.trim() || deleteReason.trim().length < 5) {
      alert('A specific reason (minimum 5 characters) is required for deletion.');
      return;
    }

    const expectedConfirmation = deleteModalUser.email;
    if (deleteConfirmationInput.trim() !== expectedConfirmation && deleteConfirmationInput.trim() !== 'DELETE') {
      alert(`To confirm deletion, please type the user's email (${deleteModalUser.email}) or "DELETE" exactly.`);
      return;
    }

    setActionLoading(deleteModalUser.id);
    try {
      const res = await adminService.deleteUser(deleteModalUser.id, isPermanentDelete, deleteReason.trim());
      alert(res.message || 'Operation completed successfully.');
      setDeleteModalUser(null);
      setDeleteUserDetails(null);
      await fetchUsers(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  }

  // Handle Terminate Sessions
  async function handleResetSessions(userId: string) {
    if (!confirm('Force-logout this user by terminating all their active web sessions immediately?')) return;
    setActionLoading(userId);
    try {
      const res = await adminService.resetUserSessions(userId);
      alert(`Success: Terminated ${res.deletedSessionsCount} active sessions.`);
      await fetchUsers(true);
    } catch (err: any) {
      alert(err?.message || 'Failed to invalidate sessions');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-700" /> User & Identity Management
          </h1>
          <p className="text-xs text-slate-500">
            Audit, govern, inspect, and manage real user accounts across customers, tour operators, and platform administrators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchUsers(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Badge variant="brand">{totalCount} Total Accounts</Badge>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, phone, user ID..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['ALL', 'CUSTOMER', 'PROVIDER', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRoleFilter(r);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  roleFilter === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r}
              </button>
            ))}
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['ALL', 'ACTIVE', 'SUSPENDED', 'INACTIVE'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'All Status' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading user database records...</div>
      ) : users.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-slate-200 bg-white text-slate-500 text-sm">
          No user accounts found matching your query criteria.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">User / Contact</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Profile Details</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSuspended = u.status === 'SUSPENDED';
                  const isProvider = u.role === 'PROVIDER';
                  const isCustomer = u.role === 'CUSTOMER';
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                        <div className="text-slate-500 text-xs font-mono">{u.email}</div>
                        {u.phone && <div className="text-[11px] text-slate-400">{u.phone}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            isAdmin ? 'error' : isProvider ? 'brand' : 'neutral'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            u.status === 'ACTIVE'
                              ? 'success'
                              : u.status === 'SUSPENDED'
                              ? 'error'
                              : 'warning'
                          }
                        >
                          {u.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {isProvider && u.providerProfile && (
                          <div className="space-y-0.5">
                            <span className="font-medium text-slate-900">{u.providerProfile.businessName}</span>
                            <div className="text-[11px] text-slate-400">
                              {u.providerProfile.city}, {u.providerProfile.state} • KYC: <span className="font-bold">{u.providerProfile.verificationStatus}</span>
                            </div>
                            <div className="text-[11px] text-teal-700">
                              {u.providerProfile.packagesCount} Packages • {u.providerProfile.bookingsCount} Bookings
                            </div>
                          </div>
                        )}
                        {isCustomer && u.customerProfile && (
                          <div className="space-y-0.5">
                            <span className="font-medium text-slate-900">{u.customerProfile.fullName}</span>
                            <div className="text-[11px] text-slate-400">
                              {u.customerProfile.city || 'India'} • {u.customerProfile.bookingCount} Bookings
                            </div>
                          </div>
                        )}
                        {isAdmin && (
                          <span className="text-slate-500 italic">Platform Administrator</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUserDetails(u.id)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Details
                          </Button>

                          {!isAdmin && (
                            <>
                              {isSuspended ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                                  onClick={() => {
                                    setStatusModalUser(u);
                                    setTargetStatus('ACTIVE');
                                    setStatusReason('Account reactivated upon administrative compliance review.');
                                  }}
                                  leftIcon={<UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                                >
                                  Activate
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-amber-700 hover:bg-amber-50 border-amber-300"
                                  onClick={() => {
                                    setStatusModalUser(u);
                                    setTargetStatus('SUSPENDED');
                                    setStatusReason('');
                                  }}
                                  leftIcon={<UserX className="w-3.5 h-3.5 text-amber-600" />}
                                >
                                  Suspend
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                                onClick={() => openDeleteModal(u)}
                                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalCount} items)
            </span>
            <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* User Details Drawer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">User Identity & Activity Record</h3>
                <p className="text-xs text-slate-500 font-mono">User ID: {selectedUser.user.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block">Email Address</span>
                <span className="font-bold text-slate-900 font-mono">{selectedUser.user.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block">Phone</span>
                <span className="font-bold text-slate-900">{selectedUser.user.phone || 'Not provided'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="text-slate-400 block">Account Status</span>
                <span className="font-bold text-slate-900">{selectedUser.user.status}</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Financial Retention Assessment</h4>
              <p className="text-slate-600">
                {selectedUser.financialSummary.hasFinancialRecords ? (
                  <span className="text-amber-800 font-medium">
                    ⚠️ User is linked to {selectedUser.financialSummary.customerBookingsCount + selectedUser.financialSummary.providerBookingsCount} historical booking/settlement records. Permanent hard-delete is prohibited by legal/financial retention requirements; anonymization or deactivation will be applied.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">
                    ✓ User has zero historical bookings or transactions. Account is fully eligible for permanent purge.
                  </span>
                )}
              </p>
            </div>

            {/* Actions Inside Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResetSessions(selectedUser.user.id)}
                leftIcon={<Lock className="w-4 h-4" />}
              >
                Terminate Active Sessions
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal (Suspend / Reactivate) */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900">
              {targetStatus === 'SUSPENDED' ? 'Suspend Account Access' : 'Reactivate Account Access'}
            </h3>
            <p className="text-xs text-slate-600">
              Target: <span className="font-bold text-slate-900">{statusModalUser.name}</span> ({statusModalUser.email})
            </p>
            {targetStatus === 'SUSPENDED' && (
              <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                Suspending will immediately revoke login privileges and terminate all active user sessions.
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Reason (Required)</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Specify the reason for this account status change..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-24"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStatusModalUser(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={actionLoading === statusModalUser.id}
                onClick={handleConfirmStatusChange}
              >
                Confirm {targetStatus}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Delete User Account</h3>
            </div>

            <p className="text-xs text-slate-600">
              Target: <span className="font-bold text-slate-900">{deleteModalUser.name}</span> ({deleteModalUser.email})
            </p>

            {deleteUserDetails?.financialSummary?.hasFinancialRecords ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1.5">
                <span className="font-bold block">Notice: Legal & Financial Retention Required</span>
                <p>
                  This user has historical bookings or financial transactions. To maintain tax and ledger integrity, historical bookings will remain preserved, while personal identifying information (PII), credentials, phone number, and KYC documents will be irreversibly anonymized.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <span className="font-bold block">Permanent Deletion Warning:</span>
                This user has zero transactions. Confirming permanent delete will completely and irreversibly eradicate this record from PostgreSQL.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Deletion (Required)</label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Account owner request under GDPR / Compliance mandate"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Type <span className="font-mono text-rose-600 font-bold">{deleteModalUser.email}</span> or <span className="font-mono text-rose-600 font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="Type confirmation here..."
                className="w-full p-2.5 text-xs rounded-xl border border-rose-200 bg-rose-50/30 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDeleteModalUser(null);
                  setDeleteUserDetails(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                isLoading={actionLoading === deleteModalUser.id}
                onClick={handleConfirmDelete}
              >
                Execute Safe Deletion
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
