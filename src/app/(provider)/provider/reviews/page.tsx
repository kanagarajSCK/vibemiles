'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Reply, X, CheckCircle2 } from 'lucide-react';
import { ReviewCard } from '@/components/cards/ReviewCard';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { reviewService } from '@/services/review.service';
import type { Review } from '@/types';

export default function ProviderReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply Modal State
  const [replyingReview, setReplyingReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const data = await reviewService.getProviderReviews();
        if (!ignore) {
          setReviews(data);
        }
      } catch (err) {
        console.error('Failed to load host reviews:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  function handleOpenReplyModal(rev: Review) {
    setReplyingReview(rev);
    setReplyText(rev.providerReply || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyingReview) return;

    if (!replyText || replyText.trim().length < 2) {
      setErrorMsg('Please enter a response of at least 2 characters.');
      return;
    }

    setSubmittingReply(true);
    setErrorMsg(null);

    try {
      const updated = await reviewService.replyToReview(replyingReview.id, replyText.trim());
      setReviews((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setSuccessMsg('Your official host reply has been published.');
      setTimeout(() => {
        setReplyingReview(null);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish response');
    } finally {
      setSubmittingReply(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading traveler feedback..." />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-400" /> Customer Reviews & Public Responses
        </h1>
        <p className="text-xs text-slate-500">
          Respond to verified customer feedback and cultivate your tour operator reputation.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 shadow-sm space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-2">
            <Star className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">No Customer Reviews Yet</h3>
          <p className="max-w-sm mx-auto">
            Reviews will appear here as adventurers complete trips booked through your travel packages.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="space-y-2">
              <ReviewCard review={rev} />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Reply className="w-3.5 h-3.5 text-teal-700" />}
                  onClick={() => handleOpenReplyModal(rev)}
                >
                  {rev.providerReply ? 'Edit Response' : 'Reply as Host'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Host Reply Modal */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <button
              onClick={() => setReplyingReview(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-teal-800 font-semibold mb-1">
                <MessageSquare className="w-4 h-4" /> Official Host Response
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Responding to {replyingReview.customerName}
              </h2>
              <p className="text-xs text-slate-500">
                Your reply will be displayed publicly below the traveler&apos;s review on the package page.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
              &ldquo;{replyingReview.content}&rdquo;
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> {successMsg}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Your Official Response</label>
                  <span className="text-[10px] text-slate-400">{replyText.length} / 1000</span>
                </div>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank the traveler, address their remarks, or highlight how your team appreciated hosting them..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                  minLength={2}
                  maxLength={1000}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyingReview(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingReply || replyText.trim().length < 2}
                >
                  {submittingReply ? 'Publishing...' : 'Publish Reply'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
