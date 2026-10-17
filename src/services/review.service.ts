import type { Review } from '@/types';

export interface CreateReviewInput {
  bookingId: string;
  rating: number;
  title?: string;
  comment: string;
}

export interface ReviewResponse {
  success: boolean;
  review: Review;
}

export interface ReviewsListResponse {
  success: boolean;
  reviews: Review[];
}

class ReviewService {
  async createReview(input: CreateReviewInput): Promise<Review> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit verified review');
    }
    return data.review;
  }

  async getPackageReviews(packageId: string): Promise<Review[]> {
    const res = await fetch(`/api/reviews?packageId=${encodeURIComponent(packageId)}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to load package reviews');
    }
    const data = await res.json();
    return data.reviews || [];
  }

  async getBookingReview(bookingId: string): Promise<Review | null> {
    const res = await fetch(`/api/reviews/booking/${encodeURIComponent(bookingId)}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data.review || null;
  }

  async getMyReviews(): Promise<Review[]> {
    const res = await fetch('/api/reviews?mine=true', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to load your reviews');
    }
    const data = await res.json();
    return data.reviews || [];
  }

  async getProviderReviews(): Promise<Review[]> {
    const res = await fetch('/api/provider/reviews', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to load provider reviews');
    }
    const data = await res.json();
    return data.reviews || [];
  }

  async replyToReview(reviewId: string, reply: string): Promise<Review> {
    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reply }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to post reply');
    }
    return data.review;
  }

  async adminModerateReview(reviewId: string, status: 'APPROVED' | 'REJECTED', moderationNote?: string): Promise<Review> {
    const res = await fetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, moderationNote }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to moderate review');
    }
    return data.review;
  }

  async getAllReviewsForAdmin(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: (Review & { moderationNote?: string | null; packageTitle?: string })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.page) sp.set('page', params.page.toString());
    if (params?.limit) sp.set('limit', params.limit.toString());

    const res = await fetch(`/api/admin/reviews?${sp.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch reviews for admin');
    }
    const json = await res.json();
    return json.data;
  }
}

export const reviewService = new ReviewService();
