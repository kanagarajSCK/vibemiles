'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Star, X, CheckCircle2, MessageSquare } from 'lucide-react';
import { bookingService } from '@/services/booking.service';
import { reviewService } from '@/services/review.service';
import type { Booking, Review } from '@/types';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AccountCompletedPage() {
  const [completed, setCompleted] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [checkingReview, setCheckingReview] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cache of reviewed bookings: bookingId -> Review
  const [reviewedBookings, setReviewedBookings] = useState<Record<string, Review>>({});

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [bookingsData, myReviews] = await Promise.all([
          bookingService.getCustomerBookings('completed'),
          reviewService.getMyReviews().catch(() => []),
        ]);
        if (!ignore) {
          setCompleted(bookingsData);
          const reviewMap: Record<string, Review> = {};
          for (const r of myReviews) {
            if (r.bookingId) reviewMap[r.bookingId] = r;
          }
          setReviewedBookings(reviewMap);
        }
      } catch (err) {
        console.error('Failed to load completed journeys:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleOpenReviewModal(booking: Booking) {
    setSelectedBookingForReview(booking);
    setErrorMsg(null);
    setSuccessMsg(null);
    setCheckingReview(true);

    try {
      // Check if already reviewed
      const rev = reviewedBookings[booking.id] || (await reviewService.getBookingReview(booking.id));
      if (rev) {
        setExistingReview(rev);
        setReviewedBookings((prev) => ({ ...prev, [booking.id]: rev }));
      } else {
        setExistingReview(null);
        setRating(5);
        setTitle('');
        setComment('');
      }
    } catch {
      setExistingReview(null);
    } finally {
      setCheckingReview(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBookingForReview) return;

    if (!comment || comment.trim().length < 10) {
      setErrorMsg('Please write at least 10 characters detailing your experience.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await reviewService.createReview({
        bookingId: selectedBookingForReview.id,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });

      setExistingReview(created);
      setReviewedBookings((prev) => ({
        ...prev,
        [selectedBookingForReview.id]: created,
      }));
      setSuccessMsg('Thank you! Your verified review has been published.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading your completed journeys..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Completed Trips & Memories</h1>
          <p className="text-xs text-slate-500">Past traveled journeys and verified review submissions.</p>
        </div>
        <Badge variant="info">{completed.length} Completed</Badge>
      </div>

      {completed.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 mb-4">
            <CheckCircle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Completed Trips Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            Completed trips and travel milestones will appear here after your journey dates conclude.
          </p>
          <Link href="/packages">
            <Button variant="primary" size="md">
              Book a Tour
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {completed.map((b) => {
            const hasReview = Boolean(reviewedBookings[b.id]);
            const rev = reviewedBookings[b.id];

            return (
              <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-600">{b.bookingRef}</span>
                  <div className="flex items-center gap-2">
                    {hasReview && (
                      <Badge variant="success" size="sm">
                        ★ {rev.rating} Reviewed
                      </Badge>
                    )}
                    <Badge variant="info" size="sm">COMPLETED</Badge>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={b.packageImage || '/images/destination-placeholder.jpg'}
                      alt={b.packageName}
                      className="h-16 w-20 rounded-xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{b.packageName}</h3>
                      <p className="text-xs text-slate-500">Traveled on {formatDate(b.travelDate)}</p>
                    </div>
                  </div>
                  <Button
                    variant={hasReview ? 'outline' : 'primary'}
                    size="sm"
                    leftIcon={<Star className={`w-3.5 h-3.5 ${hasReview ? 'text-amber-500 fill-amber-400' : ''}`} />}
                    onClick={() => handleOpenReviewModal(b)}
                  >
                    {hasReview ? 'View Your Review' : 'Write Review'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission & Inspection Modal */}
      {selectedBookingForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <button
              onClick={() => {
                setSelectedBookingForReview(null);
                setExistingReview(null);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="absolute right-5 top-5 p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-mono font-bold text-teal-800">
                {selectedBookingForReview.bookingRef}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {existingReview ? 'Your Verified Review' : `Rate & Review: ${selectedBookingForReview.packageName}`}
              </h2>
              <p className="text-xs text-slate-500">
                Your feedback helps fellow travelers choose the best tour operators on VibeMiles.
              </p>
            </div>

            {checkingReview ? (
              <LoadingState label="Checking reservation details..." />
            ) : existingReview ? (
              <div className="space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= existingReview.rating
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-sm text-slate-900 ml-2">
                      {existingReview.rating} out of 5
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(existingReview.createdAt)}</span>
                </div>

                {existingReview.title && (
                  <h4 className="font-bold text-slate-900 text-sm">{existingReview.title}</h4>
                )}
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;{existingReview.content}&rdquo;
                </p>

                {existingReview.providerReply && (
                  <div className="mt-3 p-3 rounded-xl bg-teal-50 border-l-4 border-teal-600 text-xs space-y-1">
                    <p className="font-bold text-teal-900 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-700" /> Host Response:
                    </p>
                    <p className="text-teal-800 italic">&ldquo;{existingReview.providerReply}&rdquo;</p>
                  </div>
                )}

                <div className="flex items-center gap-1 text-emerald-700 text-xs font-semibold pt-1">
                  <CheckCircle2 className="w-4 h-4" /> Verified Traveler Review Recorded
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
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

                {/* Star Rating Selector */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Overall Rating (1 to 5 Stars)</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating || rating)
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-bold text-sm text-slate-800 ml-2">
                      {hoverRating || rating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Review Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Review Headline (Optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Unforgettable Himalayan views & fantastic guide"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                    maxLength={100}
                  />
                </div>

                {/* Detailed Comment */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Your Experience & Feedback</label>
                    <span className="text-[10px] text-slate-400">{comment.length} / 2000</span>
                  </div>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share details about the itinerary, operator hospitality, accommodations, and highlights..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                    minLength={10}
                    maxLength={2000}
                    required
                  />
                  <p className="text-[10px] text-slate-400">Minimum 10 characters required.</p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBookingForReview(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submitting || comment.trim().length < 10}
                  >
                    {submitting ? 'Submitting...' : 'Post Verified Review'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
