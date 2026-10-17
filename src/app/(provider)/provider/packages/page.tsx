'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Eye, Send, Archive, AlertCircle, RefreshCw } from 'lucide-react';
import { MOCK_PACKAGES } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/constants';
import { packageService } from '@/services/package.service';
import type { Package } from '@/types';

export default function ProviderPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await packageService.getProviderPackages();
      if (Array.isArray(data) && data.length > 0) {
        setPackages(data);
      } else {
        setPackages(MOCK_PACKAGES);
      }
    } catch {
      setPackages(MOCK_PACKAGES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    packageService
      .getProviderPackages()
      .then((data) => {
        if (isMounted) {
          setPackages(Array.isArray(data) && data.length > 0 ? data : MOCK_PACKAGES);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPackages(MOCK_PACKAGES);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmitForReview = async (packageId: string) => {
    setActionLoading(packageId);
    try {
      await packageService.submitProviderPackage(packageId);
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit package');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (packageId: string) => {
    if (!confirm('Are you sure you want to archive this listing? It will no longer appear on the marketplace.')) {
      return;
    }
    setActionLoading(packageId);
    try {
      await packageService.archiveProviderPackage(packageId);
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive package');
    } finally {
      setActionLoading(null);
    }
  };

  const renderStatusBadge = (pkg: Package) => {
    const status = pkg.status || (pkg.approvalStatus === 'approved' ? 'PUBLISHED' : 'PENDING_REVIEW');

    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success" size="sm">PUBLISHED</Badge>;
      case 'APPROVED':
        return <Badge variant="success" size="sm">APPROVED</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="warning" size="sm">PENDING REVIEW</Badge>;
      case 'REJECTED':
        return <Badge variant="error" size="sm">CHANGES REQUESTED</Badge>;
      case 'ARCHIVED':
        return <Badge variant="neutral" size="sm">ARCHIVED</Badge>;
      case 'DRAFT':
      default:
        return <Badge variant="neutral" size="sm">DRAFT</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Tour & Stay Packages</h1>
          <p className="text-xs text-slate-500">Manage published listings, pricing, discounts, and itineraries.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchPackages} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Link href={ROUTES.PROVIDER_PACKAGE_NEW}>
            <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create New Package
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading your listings...</div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-4">
          <p className="text-slate-500 text-sm">You haven&apos;t created any packages yet.</p>
          <Link href={ROUTES.PROVIDER_PACKAGE_NEW}>
            <Button variant="accent" size="sm">Create First Package</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => {
            const status = pkg.status || (pkg.approvalStatus === 'approved' ? 'PUBLISHED' : 'PENDING_REVIEW');
            const canSubmit = status === 'DRAFT' || status === 'REJECTED';
            const canArchive = status !== 'ARCHIVED';

            return (
              <div key={pkg.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={pkg.images[0] || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'}
                      alt={pkg.name}
                      className="h-16 w-20 rounded-xl object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="brand" size="sm">{pkg.category.toUpperCase()}</Badge>
                        {renderStatusBadge(pkg)}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{pkg.name}</h3>
                      <p className="text-xs text-slate-500">
                        {pkg.destinationName}, {pkg.state} • {pkg.durationDays}D/{pkg.durationNights}N
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Price / Person</span>
                      <span className="text-base font-extrabold text-teal-800">{formatCurrency(pkg.finalPrice)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/packages/${pkg.slug}`}>
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                          View
                        </Button>
                      </Link>
                      <Link href={`/provider/packages/new?edit=${pkg.id}`}>
                        <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                          Edit
                        </Button>
                      </Link>
                      {canSubmit && (
                        <Button
                          variant="accent"
                          size="sm"
                          isLoading={actionLoading === pkg.id}
                          onClick={() => handleSubmitForReview(pkg.id)}
                          leftIcon={<Send className="w-3.5 h-3.5" />}
                        >
                          Submit
                        </Button>
                      )}
                      {canArchive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={actionLoading === pkg.id}
                          onClick={() => handleArchive(pkg.id)}
                          className="text-slate-400 hover:text-rose-600"
                          title="Archive Listing"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejection Feedback Banner */}
                {status === 'REJECTED' && pkg.rejectionReason && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Reviewer Feedback / Correction Request:</span>
                      <p className="mt-0.5 text-rose-700">{pkg.rejectionReason}</p>
                      <span className="text-[11px] text-rose-500 mt-1 block">
                        Please update your listing using Edit, and submit again once the issue is addressed.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
