import { MOCK_DEALS } from '@/lib/mock-data';
import type { Deal, DealType } from '@/types';

interface DealFilters {
  dealType?: DealType | '';
  providerId?: string;
}

class DealService {
  /** Get all active (and optionally scheduled) deals visible to the public */
  async getDeals(filters?: DealFilters): Promise<Deal[]> {
    let list = [...MOCK_DEALS].filter(
      (d) => d.status === 'active' || d.status === 'scheduled'
    );

    if (filters?.dealType) {
      list = list.filter((d) => d.dealType === filters.dealType);
    }
    if (filters?.providerId) {
      list = list.filter((d) => d.providerId === filters.providerId);
    }

    // Sort: flash deals first, then by savings descending
    list.sort((a, b) => {
      if (a.dealType === 'flash' && b.dealType !== 'flash') return -1;
      if (b.dealType === 'flash' && a.dealType !== 'flash') return 1;
      return b.savingsAmount - a.savingsAmount;
    });

    return list;
  }

  /** Get deals owned by a specific provider (for provider portal) */
  async getDealsByProvider(providerId: string): Promise<Deal[]> {
    return [...MOCK_DEALS].filter((d) => d.providerId === providerId);
  }

  /** Get a single deal by ID */
  async getDealById(id: string): Promise<Deal | null> {
    return MOCK_DEALS.find((d) => d.id === id) ?? null;
  }

  /** Check if a deal is currently live (not expired, not paused, started) */
  isDealLive(deal: Deal): boolean {
    const now = new Date();
    return (
      deal.status === 'active' &&
      new Date(deal.startDate) <= now &&
      new Date(deal.endDate) > now
    );
  }

  /** Get formatted time remaining for a deal */
  getTimeRemaining(endDate: string): string {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 7) {
      return `Ends ${new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    }
    if (days > 0) return `Ends in ${days}d ${hours}h`;
    return `Ends in ${hours}h`;
  }
}

export const dealService = new DealService();
