export interface AdminDashboardResponse {
  success: boolean;
  admin: string;
  metrics: {
    users: {
      totalCustomers: number;
      activeCustomers: number;
      suspendedCustomers: number;
      totalProviders: number;
      pendingProviders: number;
      verifiedProviders: number;
      rejectedProviders: number;
      suspendedProviders: number;
    };
    listings: {
      awaitingModeration: number;
      published: number;
      archived: number;
      rejected: number;
      draft: number;
    };
    bookings: {
      total: number;
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
    payments: {
      total: number;
      paid: number;
      pending: number;
      failed: number;
      refunded: number;
    };
    refunds: {
      total: number;
      processed: number;
      pending: number;
      failed: number;
    };
    financial: {
      grossBookingValue: number;
      collectedRevenue: number;
      platformCommissionEarned: number;
      providerPayablesPending: number;
      providerAmountSettled: number;
      processedRefundAmount: number;
    };
  };
  definitions: Record<string, string>;
}

export interface AdminCustomerItem {
  userId: string;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  profileId: string | null;
  fullName: string;
  avatar: string | null;
  city: string | null;
  state: string | null;
  rewardPoints: number;
  isBlocked: boolean;
  isVerified: boolean;
  suspensionReason: string | null;
  bookingCount: number;
  reviewCount: number;
  totalSpent: number;
}

export interface AdminCustomersResponse {
  success: boolean;
  items: AdminCustomerItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminProviderItem {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  businessCategory: string;
  city: string;
  state: string;
  email: string;
  phone: string | null;
  userStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  isActive: boolean;
  rating: number;
  reviewCount: number;
  totalPackages: number;
  totalBookings: number;
  rejectionReason: string | null;
  suspensionReason: string | null;
  joinedAt: string;
}

export interface AdminProvidersResponse {
  success: boolean;
  items: AdminProviderItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminCategoryItem {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
  packagesCount: number;
  createdAt: string;
}

export interface AdminReportsResponse {
  success: boolean;
  report: {
    bookingsByStatus: Array<{ status: string; count: number; volume: number }>;
    topProviders: Array<{
      providerId: string;
      businessName: string;
      city: string;
      rating: number;
      bookingCount: number;
      grossAmount: number;
      providerEarnings: number;
      commissionGenerated: number;
    }>;
  };
  metrics: AdminDashboardResponse['metrics'];
  definitions: Record<string, string>;
}

class AdminService {
  async getDashboardMetrics(filters?: { startDate?: string; endDate?: string }): Promise<AdminDashboardResponse> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);

    const res = await fetch(`/api/admin/stats?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to load admin metrics: ${res.statusText}`);
    }
    return res.json();
  }

  async getCustomers(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<AdminCustomersResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`/api/admin/customers?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to load customers: ${res.statusText}`);
    }
    return res.json();
  }

  async getCustomerDetails(id: string) {
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to load customer details: ${res.statusText}`);
    }
    return res.json();
  }

  async updateCustomerStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED', reason: string) {
    const res = await fetch(`/api/admin/customers/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update customer status: ${res.statusText}`);
    }
    return res.json();
  }

  async getProviders(params?: { search?: string; verificationStatus?: string; isActive?: boolean; page?: number; limit?: number }): Promise<AdminProvidersResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.verificationStatus) query.set('verificationStatus', params.verificationStatus);
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`/api/admin/providers?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to load providers: ${res.statusText}`);
    }
    return res.json();
  }

  async getProviderDetails(id: string) {
    const res = await fetch(`/api/admin/providers/${id}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to load provider details: ${res.statusText}`);
    }
    return res.json();
  }

  async reviewProviderVerification(providerId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) {
    const res = await fetch(`/api/admin/providers/${providerId}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to review verification: ${res.statusText}`);
    }
    return res.json();
  }

  async getProviderDocuments(providerId: string) {
    const res = await fetch(`/api/admin/providers/${providerId}/documents`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to load provider documents: ${res.statusText}`);
    }
    return res.json();
  }

  async reviewDocument(docId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) {
    const res = await fetch(`/api/admin/documents/${docId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, decision: status, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to review document: ${res.statusText}`);
    }
    return res.json();
  }

  async updateProviderStatus(providerId: string, isActive: boolean, reason: string) {
    const res = await fetch(`/api/admin/providers/${providerId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update provider status: ${res.statusText}`);
    }
    return res.json();
  }

  async getCategories(): Promise<AdminCategoryItem[]> {
    const res = await fetch('/api/admin/categories', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to load categories: ${res.statusText}`);
    }
    const data = await res.json();
    return data.categories || [];
  }

  async createCategory(params: { name: string; slug?: string; icon?: string; description?: string }) {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to create category: ${res.statusText}`);
    }
    return res.json();
  }

  async updateCategory(id: string, params: { name?: string; icon?: string; description?: string; isActive?: boolean }) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update category: ${res.statusText}`);
    }
    return res.json();
  }

  async archiveOrDeleteCategory(id: string) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to archive or delete category: ${res.statusText}`);
    }
    return res.json();
  }

  async getReports(params?: { startDate?: string; endDate?: string }): Promise<AdminReportsResponse> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const res = await fetch(`/api/admin/reports?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to load admin reports: ${res.statusText}`);
    }
    return res.json();
  }

  async getAuditLogs(params?: { targetType?: string; targetId?: string; actorId?: string; action?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.targetType) query.set('targetType', params.targetType);
    if (params?.targetId) query.set('targetId', params.targetId);
    if (params?.actorId) query.set('actorId', params.actorId);
    if (params?.action) query.set('action', params.action);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const res = await fetch(`/api/admin/audit-logs?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to load audit logs: ${res.statusText}`);
    }
    return res.json();
  }

  // ── User Management Methods (All Roles) ──

  async getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`/api/admin/users?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to load users: ${res.statusText}`);
    }
    return res.json();
  }

  async getUserDetails(userId: string) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch user details');
    }
    return res.json();
  }

  async updateUserStatus(userId: string, status: string, reason: string) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update user status');
    }
    return data;
  }

  async deleteUser(userId: string, permanent: boolean, reason: string) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ permanent, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }
    return data;
  }

  async resetUserSessions(userId: string) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/reset-sessions`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to terminate user sessions');
    }
    return data;
  }

  // ── Settlements & Payouts Methods ──

  async getSettlements(params?: {
    search?: string;
    status?: string;
    providerId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.providerId) query.set('providerId', params.providerId);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`/api/admin/settlements?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to load settlements: ${res.statusText}`);
    }
    return res.json();
  }

  async updateSettlementStatus(settlementId: string, status: string, referenceNote?: string) {
    const res = await fetch('/api/admin/settlements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ settlementId, status, referenceNote }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update settlement status');
    }
    return data;
  }
}

export const adminService = new AdminService();
