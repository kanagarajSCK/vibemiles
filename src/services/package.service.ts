import type { Package, Destination, SearchFilters, SortOption } from '@/types';

export interface CategoryResult {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  isActive: boolean;
}

/**
 * Universal PackageService
 * Communicates with server API routes (/api/packages, /api/destinations, /api/categories)
 * preserving strict server/client database isolation.
 */
class PackageService {
  async getPackages(
    filters?: SearchFilters & { skip?: number; take?: number; page?: number; limit?: number },
    sort?: SortOption
  ): Promise<Package[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.q) params.set('q', filters.q);
      if (filters?.destination) params.set('destination', filters.destination);
      if (filters?.destinationId) params.set('destinationId', filters.destinationId);
      if (filters?.destinationSlug) params.set('destinationSlug', filters.destinationSlug);
      if (filters?.travelType) params.set('travelType', filters.travelType);
      if (filters?.vibe) params.set('vibe', filters.vibe);
      if (filters?.state) params.set('state', filters.state);
      if (filters?.city) params.set('city', filters.city);
      if (filters?.category) params.set('category', filters.category);
      if (filters?.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
      if (filters?.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
      if (filters?.duration !== undefined) params.set('duration', String(filters.duration));
      if (filters?.minDuration !== undefined) params.set('minDuration', String(filters.minDuration));
      if (filters?.maxDuration !== undefined) params.set('maxDuration', String(filters.maxDuration));
      if (filters?.minDays !== undefined) params.set('minDays', String(filters.minDays));
      if (filters?.maxDays !== undefined) params.set('maxDays', String(filters.maxDays));
      if (filters?.minRating !== undefined) params.set('minRating', String(filters.minRating));
      if (filters?.isFeatured !== undefined) params.set('featured', String(filters.isFeatured));
      if (filters?.skip !== undefined) params.set('skip', String(filters.skip));
      if (filters?.take !== undefined) params.set('take', String(filters.take));
      if (filters?.page !== undefined) params.set('page', String(filters.page));
      if (filters?.limit !== undefined) params.set('limit', String(filters.limit));
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/packages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.packages)) {
          return data.packages;
        }
      }
      console.error('[packageService] API returned unsuccessful status:', res.status);
      return [];
    } catch (err) {
      console.error('[packageService] client fetch failed:', err);
      return [];
    }
  }

  async getPackagesWithCount(
    filters?: SearchFilters & { skip?: number; take?: number; page?: number; limit?: number },
    sort?: SortOption
  ): Promise<{ packages: Package[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.q) params.set('q', filters.q);
      if (filters?.destination) params.set('destination', filters.destination);
      if (filters?.destinationId) params.set('destinationId', filters.destinationId);
      if (filters?.destinationSlug) params.set('destinationSlug', filters.destinationSlug);
      if (filters?.travelType) params.set('travelType', filters.travelType);
      if (filters?.vibe) params.set('vibe', filters.vibe);
      if (filters?.category) params.set('category', filters.category);
      if (filters?.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
      if (filters?.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
      if (filters?.minDuration !== undefined) params.set('minDuration', String(filters.minDuration));
      if (filters?.maxDuration !== undefined) params.set('maxDuration', String(filters.maxDuration));
      if (filters?.skip !== undefined) params.set('skip', String(filters.skip));
      if (filters?.take !== undefined) params.set('take', String(filters.take));
      if (filters?.page !== undefined) params.set('page', String(filters.page));
      if (filters?.limit !== undefined) params.set('limit', String(filters.limit));
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/packages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.packages)) {
          return {
            packages: data.packages,
            total: typeof data.total === 'number' ? data.total : data.packages.length,
          };
        }
      }
      return { packages: [], total: 0 };
    } catch (err) {
      console.error('[packageService] client fetch with count failed:', err);
      return { packages: [], total: 0 };
    }
  }

  async getPackageBySlug(slug: string): Promise<Package | null> {
    try {
      const res = await fetch(`/api/packages/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.package) {
          return data.package;
        }
      }
      return null;
    } catch (err) {
      console.error('[packageService] client fetch failed for package slug:', slug, err);
      return null;
    }
  }

  async getFeaturedPackages(limit = 6): Promise<Package[]> {
    try {
      const res = await fetch(`/api/packages?featured=true&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.packages)) {
          return data.packages;
        }
      }
      return [];
    } catch (err) {
      console.error('[packageService] client fetch failed for featured packages:', err);
      return [];
    }
  }

  async getDestinations(): Promise<Destination[]> {
    try {
      const res = await fetch('/api/destinations');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.destinations)) {
          return data.destinations;
        }
      }
      return [];
    } catch (err) {
      console.error('[packageService] client fetch failed for destinations:', err);
      return [];
    }
  }

  async getDestinationBySlug(slug: string): Promise<Destination | null> {
    try {
      const res = await fetch(`/api/destinations/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.destination) {
          return data.destination;
        }
      }
      return null;
    } catch (err) {
      console.error('[packageService] client fetch failed for destination:', slug, err);
      return null;
    }
  }

  async getCategories(): Promise<CategoryResult[]> {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          return data.categories;
        }
      }
      return [];
    } catch (err) {
      console.error('[packageService] client fetch failed for categories:', err);
      return [];
    }
  }

  // ── Provider Listing Management Methods ──

  async getProviderPackages(): Promise<Package[]> {
    const res = await fetch('/api/provider/packages');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch provider packages');
    }
    const data = await res.json();
    return data.packages || [];
  }

  async getProviderPackageById(id: string): Promise<Package | null> {
    const res = await fetch(`/api/provider/packages/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch package');
    }
    const data = await res.json();
    return data.package || null;
  }

  async createProviderPackage(payload: unknown): Promise<Package> {
    const res = await fetch('/api/provider/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create package');
    }
    return data.package;
  }

  async updateProviderPackage(id: string, payload: unknown): Promise<Package> {
    const res = await fetch(`/api/provider/packages/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update package');
    }
    return data.package;
  }

  async submitProviderPackage(id: string): Promise<Package> {
    const res = await fetch(`/api/provider/packages/${encodeURIComponent(id)}/submit`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit package for review');
    }
    return data.package;
  }

  async archiveProviderPackage(id: string): Promise<Package> {
    const res = await fetch(`/api/provider/packages/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to archive package');
    }
    return data.package;
  }

  // ── Admin Moderation Methods ──

  async getAdminPackages(filters?: {
    status?: string;
    approvalStatus?: string;
    search?: string;
    categoryId?: string;
    destinationId?: string;
    providerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Package[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.approvalStatus) params.set('approvalStatus', filters.approvalStatus);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.categoryId) params.set('categoryId', filters.categoryId);
    if (filters?.destinationId) params.set('destinationId', filters.destinationId);
    if (filters?.providerId) params.set('providerId', filters.providerId);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);

    const res = await fetch(`/api/admin/packages?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch admin packages');
    }
    const data = await res.json();
    return data.packages || [];
  }

  async getAdminPackageById(id: string) {
    const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch package details');
    }
    return res.json();
  }

  async adminApprovePackage(id: string): Promise<Package> {
    const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to approve package');
    }
    return data.package;
  }

  async adminRejectPackage(id: string, reason: string): Promise<Package> {
    const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reject package');
    }
    return data.package;
  }

  async adminSuspendPackage(id: string, reason?: string): Promise<Package> {
    const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to suspend package');
    }
    return data.package;
  }

  async adminReactivatePackage(id: string, reason?: string) {
    const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}/reactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reactivate package');
    }
    return data;
  }

  async adminUpdatePackage(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update package');
    }
    return data;
  }

  async adminDeletePackage(id: string, permanent: boolean, reason: string) {
    const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permanent, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete package');
    }
    return data;
  }
}

export const packageService = new PackageService();

