'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Search, CheckCircle2, XCircle, Eye,
  Lock, Unlock, IndianRupee, ShieldAlert, X, CreditCard,
  FileText, Download, ExternalLink,
} from 'lucide-react';
import { adminService, type AdminProviderItem } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

function formatBytes(bytes: number) {
  if (!bytes || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<AdminProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Detail Modal State
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [providerDetails, setProviderDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getProviders({
        search: search.trim() || undefined,
        verificationStatus: verificationFilter === 'ALL' ? undefined : verificationFilter,
        page,
        limit: 15,
      });
      setProviders(res.items);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, verificationFilter, page]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  async function handleVerify(provider: AdminProviderItem, status: 'VERIFIED' | 'REJECTED') {
    const isReject = status === 'REJECTED';
    const reason = prompt(
      isReject
        ? `Enter required reason for rejecting KYC for ${provider.businessName}:`
        : `Enter approval note for ${provider.businessName}:`,
      isReject ? '' : 'KYC verified and approved by administrator'
    );

    if (isReject && (!reason || reason.trim().length === 0)) {
      alert('A rejection reason is strictly required.');
      return;
    }

    setActionLoading(provider.id);
    try {
      await adminService.reviewProviderVerification(provider.id, status, reason?.trim());
      if (selectedProviderId === provider.id) {
        const res = await adminService.getProviderDetails(provider.id);
        setProviderDetails(res.provider);
      }
      await loadProviders();
      alert(`Provider KYC status updated to ${status}.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleActive(provider: AdminProviderItem) {
    const willSuspend = provider.isActive;
    const reason = prompt(
      willSuspend
        ? `Enter mandatory reason for suspending ${provider.businessName}:`
        : `Enter reason for reactivating ${provider.businessName}:`
    );

    if (!reason || reason.trim().length === 0) {
      alert('A descriptive reason is required to change provider status.');
      return;
    }

    setActionLoading(provider.id);
    try {
      await adminService.updateProviderStatus(provider.id, !willSuspend, reason.trim());
      await loadProviders();
      alert(`Provider successfully ${willSuspend ? 'suspended' : 'reactivated'}.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleViewDetails(providerId: string) {
    setSelectedProviderId(providerId);
    setDetailsLoading(true);
    try {
      const res = await adminService.getProviderDetails(providerId);
      setProviderDetails(res.provider);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load details');
      setSelectedProviderId(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleReviewDocument(docId: string, status: 'VERIFIED' | 'REJECTED') {
    const isReject = status === 'REJECTED';
    const reason = prompt(
      isReject
        ? 'Enter required reason for rejecting this document:'
        : 'Enter approval note for this document (optional):',
      isReject ? '' : 'Verified and approved'
    );

    if (isReject && (!reason || reason.trim().length === 0)) {
      alert('A rejection reason is strictly required.');
      return;
    }

    setActionLoading(docId);
    try {
      await adminService.reviewDocument(docId, status, reason?.trim());
      if (selectedProviderId) {
        const res = await adminService.getProviderDetails(selectedProviderId);
        setProviderDetails(res.provider);
      }
      await loadProviders();
      alert(`Document successfully marked as ${status}.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-700" /> Tour Operators & KYC Verification
          </h1>
          <p className="text-xs text-slate-500">
            Review partner registrations, verify PAN/GST records, and enforce operational suspensions.
          </p>
        </div>
        <Badge variant="brand">{totalCount} Registered Operators</Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by business name, owner, city, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500">KYC:</span>
          {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'UNVERIFIED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setVerificationFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                verificationFilter === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Providers List */}
      {loading ? (
        <LoadingState label="Loading operator directory..." />
      ) : providers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Tour Operators Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or verification filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        p.verificationStatus === 'VERIFIED'
                          ? 'success'
                          : p.verificationStatus === 'REJECTED'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {p.verificationStatus}
                    </Badge>
                    {!p.isActive && <Badge variant="neutral">SUSPENDED</Badge>}
                    <span className="text-xs text-slate-500 font-semibold">{p.businessCategory}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{p.businessName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Owner: {p.ownerName} ({p.email}) · {p.city}, {p.state} · Rating: {p.rating} ★ ({p.reviewCount} reviews) · {p.totalPackages} Packages
                  </p>
                  {p.rejectionReason && (
                    <p className="text-xs text-rose-600 font-medium mt-1">Rejection Note: {p.rejectionReason}</p>
                  )}
                  {p.suspensionReason && (
                    <p className="text-xs text-rose-700 font-medium mt-1">Suspension Reason: {p.suspensionReason}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => handleViewDetails(p.id)}
                  >
                    Inspect KYC & Ledger
                  </Button>

                  {p.verificationStatus === 'PENDING' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        disabled={actionLoading === p.id}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        onClick={() => handleVerify(p, 'REJECTED')}
                      >
                        Reject KYC
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoading === p.id}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleVerify(p, 'VERIFIED')}
                      >
                        Approve KYC
                      </Button>
                    </>
                  )}

                  <Button
                    variant={p.isActive ? 'outline' : 'primary'}
                    size="sm"
                    className={p.isActive ? 'text-rose-600 border-rose-200 hover:bg-rose-50' : ''}
                    disabled={actionLoading === p.id}
                    leftIcon={p.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    onClick={() => handleToggleActive(p)}
                  >
                    {p.isActive ? 'Suspend' : 'Reactivate'}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-slate-200 text-xs shadow-sm">
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

      {/* Provider Details Modal */}
      {selectedProviderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-6">
            <button
              onClick={() => {
                setSelectedProviderId(null);
                setProviderDetails(null);
              }}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {detailsLoading || !providerDetails ? (
              <LoadingState label="Loading operator KYC dossier and settlements..." />
            ) : (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={providerDetails.verificationStatus === 'VERIFIED' ? 'success' : providerDetails.verificationStatus === 'REJECTED' ? 'error' : 'warning'}>
                        {providerDetails.verificationStatus}
                      </Badge>
                      <Badge variant={providerDetails.isActive ? 'neutral' : 'error'}>
                        {providerDetails.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{providerDetails.businessName}</h2>
                    <p className="text-xs text-slate-500">
                      Owner: {providerDetails.ownerName} · {providerDetails.user.email} · Phone: {providerDetails.user.phone || '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`/partner/verification?providerId=${providerDetails.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> Open Portal
                    </a>
                    {providerDetails.verificationStatus !== 'VERIFIED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoading === providerDetails.id}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleVerify(providerDetails, 'VERIFIED')}
                      >
                        Approve All KYC
                      </Button>
                    )}
                    {providerDetails.verificationStatus !== 'REJECTED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        disabled={actionLoading === providerDetails.id}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        onClick={() => handleVerify(providerDetails, 'REJECTED')}
                      >
                        Reject KYC
                      </Button>
                    )}
                  </div>
                </div>

                {/* KYC Dossier */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-teal-700" /> Statutory KYC & Bank Account
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400">PAN Number</p>
                      <p className="font-bold text-slate-800">{providerDetails.kyc.panNumber || 'Not submitted'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">GST Registration</p>
                      <p className="font-bold text-slate-800">{providerDetails.kyc.gstNumber || 'Not submitted'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Bank Account</p>
                      <p className="font-bold text-slate-800">{providerDetails.kyc.bankAccountNumber || 'Not recorded'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Bank IFSC</p>
                      <p className="font-bold text-slate-800">{providerDetails.kyc.bankIfsc || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Submitted Verification Documents */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-700" /> Submitted Verification Documents ({providerDetails.documents?.length || 0})
                    </h3>
                  </div>

                  {(!providerDetails.documents || providerDetails.documents.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs text-slate-500 italic">No verification documents have been uploaded by this operator yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {providerDetails.documents.map((doc: any) => {
                        const typeLabels: Record<string, string> = {
                          BUSINESS_REGISTRATION: 'Business Registration Certificate',
                          GOVERNMENT_ID: 'Government Issued ID',
                          ADDRESS_PROOF: 'Official Address Proof',
                        };
                        const label = typeLabels[doc.type] || doc.type;
                        return (
                          <div key={doc.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{label}</span>
                                <Badge
                                  variant={
                                    doc.status === 'VERIFIED'
                                      ? 'success'
                                      : doc.status === 'REJECTED'
                                      ? 'error'
                                      : 'warning'
                                  }
                                  size="sm"
                                >
                                  {doc.status}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {doc.fileName} · {formatBytes(doc.fileSize)} · Uploaded {formatDate(doc.uploadedAt)}
                              </p>
                              {doc.rejectionReason && (
                                <p className="text-[11px] text-rose-600 font-medium">
                                  Rejection Reason: {doc.rejectionReason}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={`/api/admin/documents/${doc.id}/download`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </a>
                              {doc.status !== 'VERIFIED' && (
                                <button
                                  disabled={actionLoading === doc.id}
                                  onClick={() => handleReviewDocument(doc.id, 'VERIFIED')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              )}
                              {doc.status !== 'REJECTED' && (
                                <button
                                  disabled={actionLoading === doc.id}
                                  onClick={() => handleReviewDocument(doc.id, 'REJECTED')}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Settlement Records */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4 text-emerald-700" /> Recent Settlements ({providerDetails.settlements.length})
                  </h3>
                  {providerDetails.settlements.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No settlement ledger entries recorded.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {providerDetails.settlements.map((s: any) => (
                        <div key={s.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">Gross: {formatCurrency(s.grossAmount)}</p>
                            <p className="text-[10px] text-slate-500">Commission Cut: {formatCurrency(s.commissionAmount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-teal-700">Net Payable: {formatCurrency(s.providerAmount)}</p>
                            <Badge variant={s.status === 'SETTLED' ? 'success' : 'warning'} size="sm">
                              {s.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audit Logs */}
                {providerDetails.auditLogs && providerDetails.auditLogs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-violet-700" /> Operator Audit History
                    </h3>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      {providerDetails.auditLogs.map((log: any) => (
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
