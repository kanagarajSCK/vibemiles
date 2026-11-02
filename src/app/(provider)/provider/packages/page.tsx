'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Edit,
  Eye,
  Send,
  Archive,
  AlertCircle,
  RefreshCw,
  MapPin,
  Clock,
  Utensils,
  Compass,
  Mountain,
  Tag,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await packageService.getProviderPackages();
      // Strictly use genuine provider data; never fall back to mock data
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve your listings');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleSubmitForReview = async (packageId: string) => {
    setActionLoading(packageId);
    setError(null);
    try {
      await packageService.submitProviderPackage(packageId);
      setSuccessMessage('Listing submitted for admin moderation review.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit listing for moderation review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (packageId: string) => {
    if (!confirm('Are you sure you want to archive this listing? It will no longer appear on the public marketplace.')) {
      return;
    }
    setActionLoading(packageId);
    setError(null);
    try {
      await packageService.archiveProviderPackage(packageId);
      setSuccessMessage('Listing has been archived and hidden from the marketplace.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive listing');
    } finally {
      setActionLoading(null);
    }
  };

  const renderStatusBadges = (pkg: Package) => {
    const status = pkg.status || (pkg.approvalStatus === 'approved' ? 'PUBLISHED' : 'PENDING_REVIEW');
    const approval = (pkg.approvalStatus || '').toUpperCase();

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Marketplace Listing Status */}
        {status === 'PUBLISHED' && (
          <Badge variant="success" size="sm">
            LIVE ON MARKETPLACE
          </Badge>
        )}
        {status === 'PENDING_REVIEW' && (
          <Badge variant="warning" size="sm">
            PENDING MODERATION
          </Badge>
        )}
        {status === 'REJECTED' && (
          <Badge variant="error" size="sm">
            CHANGES REQUESTED
          </Badge>
        )}
        {status === 'ARCHIVED' && (
          <Badge variant="neutral" size="sm">
            ARCHIVED
          </Badge>
        )}
        {status === 'DRAFT' && (
          <Badge variant="neutral" size="sm">
            DRAFT
          </Badge>
        )}

        {/* Admin Moderation Status Badge */}
        {approval === 'APPROVED' && status !== 'PUBLISHED' && (
          <Badge variant="success" size="sm">
            MODERATION: APPROVED
          </Badge>
        )}
        {approval === 'PENDING' && status !== 'PENDING_REVIEW' && (
          <Badge variant="warning" size="sm">
            UNDER REVIEW
          </Badge>
        )}
        {approval === 'REJECTED' && status !== 'REJECTED' && (
          <Badge variant="error" size="sm">
            MODERATION: REJECTED
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Listings & Services</h1>
          <p className="text-xs text-slate-500">
            Manage your submitted tours, stays, food experiences, adventure activities, and guide listings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchPackages} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Link href={ROUTES.PROVIDER_PACKAGE_NEW}>
            <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create New Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Flash Messages */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Listings List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading your listings...</div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-4">
          <p className="text-slate-500 text-sm">You haven&apos;t created any listings yet.</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create your first food experience, adventure activity, local guide service, tour package, or stay to start receiving bookings.
          </p>
          <Link href={ROUTES.PROVIDER_PACKAGE_NEW}>
            <Button variant="accent" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create First Listing
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => {
            const status = pkg.status || (pkg.approvalStatus === 'approved' ? 'PUBLISHED' : 'PENDING_REVIEW');
            const canSubmit = status === 'DRAFT' || status === 'REJECTED';
            const canArchive = status !== 'ARCHIVED';
            const cat = (pkg.category || '').toLowerCase();
            const meta = ((pkg as any).metadata || {}) as Record<string, any>;

            // Category-specific details
            const isFood = cat === 'food';
            const isAdventure = cat === 'adventure';
            const isGuide = cat === 'guide';

            // Category naming
            let displayName = pkg.name;
            if (isFood && meta.foodRestaurantName) displayName = meta.foodRestaurantName;
            if (isGuide && meta.guideFullName) displayName = meta.guideFullName;

            // Destination
            const destinationDisplay =
              pkg.destinationName ||
              (meta.foodCity as string) ||
              ((pkg as any).destination ? (typeof (pkg as any).destination === 'string' ? (pkg as any).destination : (pkg as any).destination.name) : 'Destination Pending');

            // Starting Price Unit
            let priceUnit = 'Person';
            if (isFood) priceUnit = 'Guest';
            if (isAdventure) priceUnit = 'Participant';
            if (isGuide) priceUnit = meta.guidePricingModel === 'per_group' ? 'Group' : 'Tour';

            // Cuisine list
            const cuisinesList: string[] = Array.isArray(meta.foodCuisines)
              ? meta.foodCuisines
              : typeof meta.foodCuisines === 'string'
              ? meta.foodCuisines.split(',').map((c) => c.trim()).filter(Boolean)
              : [];

            // Languages list
            const languagesList: string[] = Array.isArray(meta.guideLanguages)
              ? meta.guideLanguages
              : typeof meta.guideLanguages === 'string'
              ? meta.guideLanguages.split(',').map((l) => l.trim()).filter(Boolean)
              : [];

            const coverPhoto =
              pkg.images?.[0] ||
              (Array.isArray(meta.foodPhotos) && meta.foodPhotos[0]) ||
              (Array.isArray(meta.advPhotos) && meta.advPhotos[0]) ||
              (Array.isArray(meta.guidePhotos) && meta.guidePhotos[0]) ||
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';

            return (
              <div key={pkg.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left Column: Image & Details */}
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={coverPhoto}
                      alt={displayName}
                      className="h-20 w-24 rounded-xl object-cover border border-slate-100 shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="brand" size="sm">
                          {pkg.category.toUpperCase()}
                        </Badge>
                        {renderStatusBadges(pkg)}
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug truncate">
                        {displayName}
                        {isFood && meta.foodRestaurantName && meta.foodRestaurantName !== pkg.name && (
                          <span className="text-xs font-normal text-slate-500 block">Listing: {pkg.name}</span>
                        )}
                        {isGuide && meta.guideFullName && meta.guideFullName !== pkg.name && (
                          <span className="text-xs font-normal text-slate-500 block">Listing: {pkg.name}</span>
                        )}
                      </h3>

                      {/* Category Specific Attribute Row */}
                      {isFood && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-teal-600" />
                            {destinationDisplay}
                          </span>
                          {meta.foodFormat && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1">
                                <Utensils className="w-3 h-3 text-amber-600" />
                                {meta.foodFormat}
                              </span>
                            </>
                          )}
                          {cuisinesList.length > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {cuisinesList.slice(0, 3).map((c, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200">
                                    {c}
                                  </span>
                                ))}
                                {cuisinesList.length > 3 && (
                                  <span className="text-[10px] text-slate-400">+{cuisinesList.length - 3} more</span>
                                )}
                              </div>
                            </>
                          )}
                          {meta.foodDietaryOptions && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] text-slate-500">{meta.foodDietaryOptions}</span>
                            </>
                          )}
                        </div>
                      )}

                      {isAdventure && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-teal-600" />
                            {destinationDisplay}
                          </span>
                          {meta.advCategory && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1 text-slate-700">
                                <Mountain className="w-3 h-3 text-indigo-600" />
                                {meta.advCategory}
                              </span>
                            </>
                          )}
                          {meta.advDifficulty && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                                {meta.advDifficulty}
                              </span>
                            </>
                          )}
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {meta.advDurationHours ? `${meta.advDurationHours} Hours` : `${pkg.durationDays}D/${pkg.durationNights}N`}
                          </span>
                        </div>
                      )}

                      {isGuide && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-0.5">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-teal-600" />
                            {destinationDisplay}
                          </span>
                          {meta.guideSpecialization && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="flex items-center gap-1 text-slate-700 font-medium">
                                <Compass className="w-3 h-3 text-emerald-600" />
                                {meta.guideSpecialization}
                              </span>
                            </>
                          )}
                          {meta.guideTourFormat && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] text-slate-600">{meta.guideTourFormat}</span>
                            </>
                          )}
                          {languagesList.length > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {languagesList.slice(0, 3).map((l, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200">
                                    {l}
                                  </span>
                                ))}
                                {languagesList.length > 3 && (
                                  <span className="text-[10px] text-slate-400">+{languagesList.length - 3}</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {!isFood && !isAdventure && !isGuide && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{destinationDisplay}</span>
                          <span className="text-slate-300">•</span>
                          <span>{pkg.durationDays}D/{pkg.durationNights}N</span>
                          {pkg.maxGroupSize && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>Up to {pkg.maxGroupSize} guests</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Pricing & Quick Actions */}
                  <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Starting Price / {priceUnit}
                      </span>
                      <span className="text-base font-extrabold text-teal-800">
                        {formatCurrency(pkg.finalPrice || pkg.basePrice || (pkg as any).price || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {status === 'PUBLISHED' && (
                        <Link href={`/packages/${pkg.slug}`}>
                          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                            View
                          </Button>
                        </Link>
                      )}

                      <Link href={`/provider/packages/new?edit=${pkg.id}`}>
                        <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                          {status === 'REJECTED' ? 'Edit & Fix' : 'Edit'}
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
                          {status === 'REJECTED' ? 'Resubmit' : 'Submit'}
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

                {/* Rejection Feedback / Action Required Banner */}
                {status === 'REJECTED' && pkg.rejectionReason && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-rose-900 block text-sm">Action Required: Moderator Requested Changes</span>
                        <p className="mt-1 text-rose-800 bg-white/70 p-2.5 rounded-lg border border-rose-200 font-medium">
                          &quot;{pkg.rejectionReason}&quot;
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-rose-200/60">
                      <span className="text-[11px] text-rose-600">
                        Please update your listing using Edit, and click Resubmit once the requirements are addressed.
                      </span>
                      <Link href={`/provider/packages/new?edit=${pkg.id}`}>
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 hover:text-rose-900 text-xs underline cursor-pointer">
                          Edit Listing Now <ArrowRight className="w-3 h-3" />
                        </span>
                      </Link>
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
