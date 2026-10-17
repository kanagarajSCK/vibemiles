'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star, CheckCircle2, XCircle, AlertCircle, RefreshCw, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { reviewService } from '@/services/review.service';
import { Review } from '@/types';
import { formatDate } from '@/lib/utils';

type AdminReviewItem = Review & { moderationNote?: string | null; packageTitle?: string };

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Moderation action modal / state
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [moderationNote, setModerationNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadReviews = useCallback(async (targetPage = 1, filter = statusFilter) => {
    try {
      const data = await reviewService.getAllReviewsForAdmin({
        page: targetPage,
        status: filter === 'ALL' ? undefined : filter,
        limit: 15,
      });
      setReviews(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(targetPage);
    } catch (err) {
      console.error('Failed to load reviews for moderation:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReviews(1, statusFilter);
  }, [loadReviews, statusFilter]);

  function handleFilterChange(newFilter: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') {
    setStatusFilter(newFilter);
    setLoading(true);
  }

  function openModerationModal(id: string, newStatus: 'APPROVED' | 'REJECTED') {
    setModeratingId(id);
    setTargetStatus(newStatus);
    setModerationNote('');
    setActionError(null);
  }

  async function handleConfirmModeration() {
    if (!moderatingId) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const updated = await reviewService.adminModerateReview(
        moderatingId,
        targetStatus,
        moderationNote.trim() || undefined
      );

      setReviews((prev) =>
        prev.map((r) =>
          r.id === moderatingId
            ? { ...r, status: updated.status, moderationNote: moderationNote.trim() || undefined }
            : r
        )
      );

      setModeratingId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update review status.';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" /> Customer Reviews Moderation
          </h1>
          <p className="text-xs text-slate-500">
            Audit traveler reviews, approve verified feedback, or reject spam/policy violations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand">{total} Total Reviews</Badge>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => loadReviews(page)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === filter
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {filter === 'ALL' ? 'All Reviews' : filter}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Loading traveler reviews for moderation..." />
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm space-y-3">
          <Star className="w-10 h-10 text-slate-200 mx-auto" />
          <p className="font-semibold text-slate-700">No reviews found</p>
          <p className="text-xs text-slate-400">There are no reviews matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{r.customerName}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-teal-800">{r.packageTitle || 'Package Review'}</span>
                    <span className="text-[10px] text-slate-400">• {formatDate(r.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(r.rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-800 ml-1">
                      {r.rating.toFixed(1)} / 5.0
                    </span>
                  </div>
                </div>

                <Badge
                  variant={
                    r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'warning'
                  }
                >
                  {r.status}
                </Badge>
              </div>

              {/* Review Content */}
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {r.content}
              </p>

              {/* Host Response if any */}
              {r.providerReply && (
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1 font-bold text-teal-900">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Host Operator Official Reply</span>
                    {r.providerReplyAt && (
                      <span className="text-[10px] text-teal-700/70 font-normal">
                        ({formatDate(r.providerReplyAt)})
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">{r.providerReply}</p>
                </div>
              )}

              {/* Admin Moderation Note if any */}
              {r.moderationNote && (
                <p className="text-[11px] text-slate-500 italic">
                  Moderation note: {r.moderationNote}
                </p>
              )}

              {/* Moderation Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {r.status !== 'APPROVED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => openModerationModal(r.id, 'APPROVED')}
                  >
                    Approve Review
                  </Button>
                )}
                {r.status !== 'REJECTED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-700 border-rose-300 hover:bg-rose-50"
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => openModerationModal(r.id, 'REJECTED')}
                  >
                    Reject Review
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-slate-500">
                Page {page} of {totalPages} ({total} reviews)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => loadReviews(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => loadReviews(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Moderation Confirmation Modal */}
      {moderatingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {targetStatus === 'APPROVED' ? 'Approve Customer Review' : 'Reject Customer Review'}
            </h3>
            <p className="text-xs text-slate-500">
              {targetStatus === 'APPROVED'
                ? 'Approving will make this review publicly visible on the package page and recalculate marketplace ratings.'
                : 'Rejecting will hide this review from the package page and exclude its rating from averages.'}
            </p>

            {actionError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Moderation Note / Reason (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-teal-600 focus:outline-none"
                placeholder="Reason for approval/rejection or policy reference..."
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={actionLoading}
                onClick={() => setModeratingId(null)}
              >
                Cancel
              </Button>
              <Button
                variant={targetStatus === 'APPROVED' ? 'accent' : 'destructive'}
                size="sm"
                disabled={actionLoading}
                onClick={handleConfirmModeration}
              >
                {actionLoading ? 'Saving...' : `Confirm ${targetStatus}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
