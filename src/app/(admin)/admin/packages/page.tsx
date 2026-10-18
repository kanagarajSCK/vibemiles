'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Package, CheckCircle2, XCircle, Eye, AlertCircle, RefreshCw,
  Search, Filter, Edit3, Trash2, ShieldAlert, Sparkles, MapPin,
  Tag, ArrowRight, X, AlertTriangle, FileText, Calendar, IndianRupee,
  RotateCcw, Check, ExternalLink, Info,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { packageService, type CategoryResult } from '@/services/package.service';
import type { Package as DomainPackage, Destination } from '@/types';

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<DomainPackage[]>([]);
  const [categories, setCategories] = useState<CategoryResult[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' | 'DRAFT'>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Inline action states
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  // Modals
  const [inspectPackage, setInspectPackage] = useState<any | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Edit Modal
  const [editingPackage, setEditingPackage] = useState<DomainPackage | null>(null);
  const [editBasePrice, setEditBasePrice] = useState<number>(0);
  const [editDiscountPercent, setEditDiscountPercent] = useState<number>(0);
  const [editIsFeatured, setEditIsFeatured] = useState<boolean>(false);
  const [editCancellationPolicy, setEditCancellationPolicy] = useState<string>('');
  const [editHighlights, setEditHighlights] = useState<string>('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Modal
  const [deletingPackage, setDeletingPackage] = useState<DomainPackage | null>(null);
  const [deletePackageDetails, setDeletePackageDetails] = useState<any | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch filter options (categories & destinations)
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, dests] = await Promise.all([
          packageService.getCategories(),
          packageService.getDestinations(),
        ]);
        setCategories(cats || []);
        setDestinations(dests || []);
      } catch (err) {
        console.error('Failed to load categories/destinations filter options', err);
      }
    }
    loadMeta();
  }, []);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await packageService.getAdminPackages({
        status: filter === 'ALL' ? undefined : filter,
        search: debouncedSearch.trim() || undefined,
        categoryId: selectedCategory || undefined,
        destinationId: selectedDestination || undefined,
      });
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch, selectedCategory, selectedDestination]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Flash message helper
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      await packageService.adminApprovePackage(id);
      showSuccess('Package approved and published to marketplace successfully.');
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve package');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      setError('Please provide a specific rejection feedback message (minimum 5 characters)');
      return;
    }
    setActionLoading(id);
    setError(null);
    try {
      await packageService.adminRejectPackage(id, rejectionReason.trim());
      setRejectingId(null);
      setRejectionReason('');
      showSuccess('Package rejected and feedback notified to provider.');
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject package');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      await packageService.adminSuspendPackage(id, suspensionReason.trim() || undefined);
      setSuspendingId(null);
      setSuspensionReason('');
      showSuccess('Package suspended and hidden from marketplace.');
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend package');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      await packageService.adminReactivatePackage(id);
      showSuccess('Package restored and published to marketplace.');
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate package. Ensure provider KYC is approved.');
    } finally {
      setActionLoading(null);
    }
  };

  // Inspect Drawer
  const openInspectDrawer = async (pkg: DomainPackage) => {
    setInspectPackage(pkg);
    setInspectLoading(true);
    try {
      const res = await packageService.getAdminPackageById(pkg.id);
      if (res && res.success && res.data) {
        setInspectPackage(res.data);
      }
    } catch (err) {
      console.error('Failed to load full package details:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  // Edit Modal Handlers
  const openEditModal = (pkg: DomainPackage) => {
    setEditingPackage(pkg);
    setEditBasePrice(pkg.basePrice);
    const policyString =
      typeof pkg.cancellationPolicy === 'string'
        ? pkg.cancellationPolicy
        : pkg.cancellationPolicy?.notes ||
          (pkg.cancellationPolicy?.freeCancellationDays
            ? `Free cancellation up to ${pkg.cancellationPolicy.freeCancellationDays} days prior to departure`
            : '');
    setEditCancellationPolicy(policyString);
    setEditHighlights(pkg.highlights?.join('\n') || '');
  };

  const handleSaveEdit = async () => {
    if (!editingPackage) return;
    setEditSubmitting(true);
    setError(null);
    try {
      const highlightsArray = editHighlights
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean);

      await packageService.adminUpdatePackage(editingPackage.id, {
        basePrice: editBasePrice,
        discountPercent: editDiscountPercent,
        isFeatured: editIsFeatured,
        cancellationPolicy: editCancellationPolicy.trim() || null,
        highlights: highlightsArray,
      });

      showSuccess(`Package "${editingPackage.name}" updated successfully.`);
      setEditingPackage(null);
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update package');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Modal Handlers
  const openDeleteModal = async (pkg: DomainPackage) => {
    setDeletingPackage(pkg);
    setDeletePackageDetails(null);
    setDeleteReason('');
    setDeleteConfirmationInput('');
    setIsPermanentDelete(false);
    setDeleteLoading(true);

    try {
      const res = await packageService.getAdminPackageById(pkg.id);
      if (res && res.success && res.data) {
        setDeletePackageDetails(res.data);
        // Default to permanent if 0 bookings, archive if bookings exist
        setIsPermanentDelete(res.data.canPermanentlyDelete);
      }
    } catch (err) {
      console.error('Failed to fetch package details for deletion check', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPackage) return;
    if (!deleteReason || deleteReason.trim().length < 5) {
      setError('Please provide a detailed reason (minimum 5 characters).');
      return;
    }
    if (deleteConfirmationInput.trim().toUpperCase() !== 'DELETE') {
      setError('Please type DELETE to confirm this operation.');
      return;
    }

    setDeleteLoading(true);
    setError(null);
    try {
      const result = await packageService.adminDeletePackage(
        deletingPackage.id,
        isPermanentDelete,
        deleteReason.trim()
      );

      showSuccess(
        result.message || (isPermanentDelete ? 'Package permanently purged from database.' : 'Package archived.')
      );
      setDeletingPackage(null);
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete package');
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderStatusBadge = (pkg: DomainPackage) => {
    const status = pkg.status || (pkg.approvalStatus === 'approved' ? 'PUBLISHED' : 'PENDING_REVIEW');
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success" size="sm">PUBLISHED</Badge>;
      case 'APPROVED':
        return <Badge variant="success" size="sm">APPROVED</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="warning" size="sm">PENDING REVIEW</Badge>;
      case 'REJECTED':
        return <Badge variant="error" size="sm">REJECTED</Badge>;
      case 'ARCHIVED':
        return <Badge variant="neutral" size="sm">ARCHIVED</Badge>;
      case 'DRAFT':
      default:
        return <Badge variant="neutral" size="sm">DRAFT</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-700" /> Package Moderation & Catalog Management
          </h1>
          <p className="text-xs text-slate-500">
            Review submissions, inspect itineraries, manage listing status, update pricing, and safely archive or purge packages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchPackages} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Badge variant="brand">{packages.length} Listings</Badge>
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

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="md:col-span-5">
          <Input
            placeholder="Search by package name, destination, or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            <option value="">All Destinations</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}, {d.state}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-1 flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedCategory('');
              setSelectedDestination('');
              setFilter('ALL');
            }}
            className="text-slate-500 hover:text-slate-800 text-xs px-2"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'DRAFT'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Package List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading catalog moderation queue...</div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-500 text-sm">
          No packages found matching your criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => {
            const status = pkg.status || (pkg.approvalStatus === 'approved' ? 'PUBLISHED' : 'PENDING_REVIEW');
            const isApproved = status === 'PUBLISHED' || status === 'APPROVED';

            return (
              <div key={pkg.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={pkg.images[0] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'}
                      alt={pkg.name}
                      className="h-20 w-24 rounded-xl object-cover shrink-0 shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {renderStatusBadge(pkg)}
                        {pkg.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Sparkles className="w-3 h-3 text-amber-600" /> Featured
                          </span>
                        )}
                        <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" /> {(pkg as any).categoryName || pkg.category || 'Tour'}
                        </span>
                        <span className="text-xs text-slate-500">
                          by <strong className="text-slate-700">{pkg.providerName}</strong>
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1 line-clamp-1">{pkg.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {pkg.destinationName}, {pkg.state}
                        </span>
                        <span>•</span>
                        <span>{pkg.durationDays}D / {pkg.durationNights}N</span>
                        <span>•</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(pkg.finalPrice)}
                          {pkg.discountPercent > 0 && (
                            <span className="text-xs text-slate-400 line-through ml-1 font-normal">
                              {formatCurrency(pkg.basePrice)}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                    {/* Public Preview */}
                    <Link href={`/packages/${pkg.slug}`} target="_blank">
                      <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                        Preview
                      </Button>
                    </Link>

                    {/* Inspect Details Drawer */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInspectDrawer(pkg)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Details
                    </Button>

                    {/* Edit Pricing & Attributes */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(pkg)}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>

                    {/* Approve Action */}
                    {!isApproved && status !== 'ARCHIVED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={actionLoading === pkg.id}
                        onClick={() => handleApprove(pkg.id)}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                    )}

                    {/* Suspend Action */}
                    {isApproved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSuspendingId(suspendingId === pkg.id ? null : pkg.id);
                          setSuspensionReason('');
                        }}
                        className="text-amber-700 hover:bg-amber-50 border-amber-300"
                        leftIcon={<AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                      >
                        Suspend
                      </Button>
                    )}

                    {/* Reactivate Action */}
                    {status === 'ARCHIVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={actionLoading === pkg.id}
                        onClick={() => handleReactivate(pkg.id)}
                        className="text-teal-700 hover:bg-teal-50 border-teal-300"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5 text-teal-600" />}
                      >
                        Reactivate
                      </Button>
                    )}

                    {/* Reject Action */}
                    {status !== 'REJECTED' && status !== 'ARCHIVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRejectingId(rejectingId === pkg.id ? null : pkg.id);
                          setRejectionReason('');
                        }}
                        className="text-rose-600 hover:bg-rose-50 border-rose-200"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    )}

                    {/* Delete Action */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteModal(pkg)}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 p-2"
                      title="Delete / Archive Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Inline Suspension Box */}
                {suspendingId === pkg.id && (
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 space-y-3 animate-in fade-in">
                    <label className="block text-xs font-bold text-amber-900">
                      Reason for Suspending Listing (will immediately remove from public marketplace):
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                      placeholder="e.g. Compliance review required or temporary seasonal pause."
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSuspendingId(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        isLoading={actionLoading === pkg.id}
                        onClick={() => handleSuspend(pkg.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Confirm Suspension
                      </Button>
                    </div>
                  </div>
                )}

                {/* Inline Rejection Box */}
                {rejectingId === pkg.id && (
                  <div className="rounded-xl bg-rose-50/70 border border-rose-200 p-4 space-y-3 animate-in fade-in">
                    <label className="block text-xs font-bold text-rose-900">
                      Reason for Rejection / Modification Request:
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-lg border border-rose-300 bg-white p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
                      placeholder="e.g. Please clarify inclusion details regarding airport pickup, or upload higher resolution images."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setRejectingId(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        isLoading={actionLoading === pkg.id}
                        onClick={() => handleReject(pkg.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                )}

                {/* Display existing rejection/suspension reason if present */}
                {(status === 'REJECTED' || status === 'ARCHIVED') && pkg.rejectionReason && (
                  <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 flex items-start gap-2">
                    <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">
                        {status === 'ARCHIVED' ? 'Suspension Reason: ' : 'Rejection Feedback sent to provider: '}
                      </span>
                      {pkg.rejectionReason}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Inspection / Details Drawer ── */}
      {inspectPackage && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Package Listing Details</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{inspectPackage.name}</h2>
              </div>
              <button
                onClick={() => setInspectPackage(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {inspectLoading ? (
                <div className="py-20 text-center text-slate-400">Loading full listing details...</div>
              ) : (
                <>
                  {/* Photo Gallery Banner */}
                  <div className="grid grid-cols-3 gap-2">
                    {(inspectPackage.images || []).slice(0, 3).map((imgUrl: string, idx: number) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        className="h-28 w-full object-cover rounded-xl border border-slate-200"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    ))}
                  </div>

                  {/* High Level Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Status</div>
                      <div className="mt-1">{renderStatusBadge(inspectPackage)}</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Final Price</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-1">{formatCurrency(inspectPackage.finalPrice)}</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Total Bookings</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-1">{inspectPackage.bookingsCount ?? '—'}</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Total Reviews</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-1">{inspectPackage.reviewsCount ?? '—'}</div>
                    </div>
                  </div>

                  {/* Provider & KYC Information */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Operator Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Business Name:</span>{' '}
                        <strong className="text-slate-800">{inspectPackage.provider?.businessName || inspectPackage.providerName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Owner Name:</span>{' '}
                        <strong className="text-slate-800">{inspectPackage.provider?.ownerName || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">KYC Status:</span>{' '}
                        <span className="font-semibold text-teal-700">{inspectPackage.provider?.verificationStatus || 'VERIFIED'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Account Active:</span>{' '}
                        <span className="font-semibold text-slate-800">{inspectPackage.provider?.isActive !== false ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Overview Description</h3>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {inspectPackage.description}
                    </p>
                  </div>

                  {/* Highlights */}
                  {inspectPackage.highlights && inspectPackage.highlights.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Highlights</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {inspectPackage.highlights.map((h: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
                            ✓ {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Day-by-Day Itinerary */}
                  {inspectPackage.itinerary && inspectPackage.itinerary.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Itinerary Schedule</h3>
                      <div className="space-y-2">
                        {inspectPackage.itinerary.map((dayItem: any) => (
                          <div key={dayItem.id || dayItem.day} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                            <span className="font-bold text-teal-800">Day {dayItem.day}: {dayItem.title}</span>
                            <p className="text-slate-600 mt-1">{dayItem.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inclusions & Exclusions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-2">
                      <h4 className="font-bold text-emerald-900">Inclusions</h4>
                      <ul className="space-y-1 text-emerald-800">
                        {(inspectPackage.inclusions || []).map((inc: any, i: number) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{inc.item || inc}</span>
                          </li>
                        ))}
                        {(!inspectPackage.inclusions || inspectPackage.inclusions.length === 0) && (
                          <li className="text-slate-400">None specified</li>
                        )}
                      </ul>
                    </div>
                    <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 text-xs space-y-2">
                      <h4 className="font-bold text-rose-900">Exclusions</h4>
                      <ul className="space-y-1 text-rose-800">
                        {(inspectPackage.exclusions || []).map((exc: any, i: number) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{exc.item || exc}</span>
                          </li>
                        ))}
                        {(!inspectPackage.exclusions || inspectPackage.exclusions.length === 0) && (
                          <li className="text-slate-400">None specified</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Cancellation Policy */}
                  {inspectPackage.cancellationPolicy && (
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                      <h4 className="font-bold text-slate-800">Cancellation Policy</h4>
                      <p className="text-slate-600">
                        {typeof inspectPackage.cancellationPolicy === 'string'
                          ? inspectPackage.cancellationPolicy
                          : inspectPackage.cancellationPolicy?.notes ||
                            (inspectPackage.cancellationPolicy?.freeCancellationDays
                              ? `Free cancellation up to ${inspectPackage.cancellationPolicy.freeCancellationDays} days prior to departure.`
                              : 'Standard platform cancellation policy.')}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setInspectPackage(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const p = inspectPackage;
                    setInspectPackage(null);
                    openEditModal(p);
                  }}
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Edit Listing
                </Button>
                <Link href={`/packages/${inspectPackage.slug}`} target="_blank">
                  <Button variant="primary" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    View on Marketplace
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Edit Modal ── */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-700" /> Edit Listing Parameters
              </h3>
              <button onClick={() => setEditingPackage(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Editing: <strong className="text-slate-800">{editingPackage.name}</strong>
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Base Price (INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editBasePrice}
                    onChange={(e) => setEditBasePrice(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editDiscountPercent}
                    onChange={(e) => setEditDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Calculated Final Price:</span>
                <span className="font-extrabold text-teal-800">
                  {formatCurrency(Math.round(editBasePrice - (editBasePrice * editDiscountPercent) / 100))}
                </span>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsFeatured}
                    onChange={(e) => setEditIsFeatured(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Feature on Marketplace & Homepage</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Highlights (one per line)
                </label>
                <textarea
                  rows={3}
                  value={editHighlights}
                  onChange={(e) => setEditHighlights(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                  placeholder="e.g. 5-Star Luxury Resort Stay&#10;Complimentary Airport Transfer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Cancellation Policy
                </label>
                <textarea
                  rows={2}
                  value={editCancellationPolicy}
                  onChange={(e) => setEditCancellationPolicy(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                  placeholder="e.g. Free cancellation up to 48 hours prior to departure."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="ghost" size="sm" onClick={() => setEditingPackage(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={editSubmitting}
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Safe Deletion / Retention Modal ── */}
      {deletingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" /> Delete or Archive Package
              </h3>
              <button onClick={() => setDeletingPackage(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteLoading && !deletePackageDetails ? (
              <div className="py-8 text-center text-slate-400">Verifying booking retention constraints...</div>
            ) : (
              <>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    Target Package: <strong className="text-slate-900">{deletingPackage.name}</strong>
                  </p>
                  <p>
                    Provider: <strong className="text-slate-800">{deletingPackage.providerName}</strong>
                  </p>
                </div>

                {/* Financial and Booking Integrity Notice */}
                {deletePackageDetails?.bookingsCount && deletePackageDetails.bookingsCount > 0 ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      Financial Retention Enforced: {deletePackageDetails.bookingsCount} Booking(s) Found
                    </div>
                    <p className="text-[11px] text-amber-800">
                      To preserve financial compliance, consumer receipts, and operator earnings history, this listing cannot be permanently purged from PostgreSQL. It will be safely <strong>ARCHIVED</strong> and immediately hidden from marketplace search and booking.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                      Zero Bookings Found
                    </div>
                    <p className="text-[11px] text-teal-800">
                      This package has zero associated customer bookings. It can either be archived or permanently purged from the database.
                    </p>
                  </div>
                )}

                {/* Operation Selection (only if 0 bookings) */}
                {deletePackageDetails?.canPermanentlyDelete && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="deleteType"
                        checked={!isPermanentDelete}
                        onChange={() => setIsPermanentDelete(false)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span>Safe Archive (Hide from marketplace, preserve records)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-700">
                      <input
                        type="radio"
                        name="deleteType"
                        checked={isPermanentDelete}
                        onChange={() => setIsPermanentDelete(true)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>Permanent Database Purge (Irreversible deletion)</span>
                    </label>
                  </div>
                )}

                {/* Mandatory Audit Reason */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Audit Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="e.g. Duplicated listing, provider closed business, or content policy violation."
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-rose-600 focus:outline-none"
                  />
                </div>

                {/* Confirmation input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Type <span className="text-rose-600 font-mono">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationInput}
                    onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                    placeholder="DELETE"
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono uppercase text-slate-900 focus:border-rose-600 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <Button variant="ghost" size="sm" onClick={() => setDeletingPackage(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    isLoading={deleteLoading}
                    disabled={
                      deleteConfirmationInput.trim().toUpperCase() !== 'DELETE' ||
                      deleteReason.trim().length < 5
                    }
                    onClick={handleConfirmDelete}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {isPermanentDelete ? 'Confirm Permanent Purge' : 'Confirm Safe Archive'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
