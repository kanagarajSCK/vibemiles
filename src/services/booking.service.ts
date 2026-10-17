import type { Booking } from '@/types';

export interface CreateBookingInput {
  packageId: string;
  packageName?: string;
  packageImage?: string;
  providerId?: string;
  providerName?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  availabilityId?: string;
  travelDate: string;
  adults: number;
  children: number;
  travelerDetails: Booking['travelerDetails'];
  optionalServices?: Booking['optionalServices'];
  pickup?: string;
  baseAmount?: number;
  optionalServicesAmount?: number;
  discountAmount?: number;
  couponCode?: string;
  taxAmount?: number;
  totalAmount?: number;
  paymentMethod?: string;
  idempotencyKey?: string;
}

class BookingService {
  /**
   * Creates a booking with server-side validation and pricing.
   */
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create booking.');
    }

    return data.booking;
  }

  /**
   * Retrieves bookings for the authenticated customer.
   */
  async getCustomerBookings(filter: 'all' | 'upcoming' | 'completed' | 'cancelled' = 'all'): Promise<Booking[]> {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const response = await fetch(`/api/bookings?filter=${filter}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.bookings || [];
    } catch (error) {
      console.error('[bookingService.getCustomerBookings] failed:', error);
      return [];
    }
  }

  /**
   * Retrieves a booking by its ID or reference number.
   */
  async getBookingById(id: string): Promise<Booking | null> {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.booking || null;
    } catch (error) {
      console.error(`[bookingService.getBookingById] failed for ${id}:`, error);
      return null;
    }
  }

  /**
   * Cancels a booking reservation with a specified reason.
   */
  async cancelBooking(id: string, reason: string): Promise<Booking> {
    if (typeof window === 'undefined') {
      throw new Error('cancelBooking can only be called from client context or via direct server DB function.');
    }

    const response = await fetch(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to cancel reservation.');
    }

    return data.booking;
  }

  /**
   * Retrieves bookings for the authenticated provider.
   */
  async getProviderBookings(): Promise<Booking[]> {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const response = await fetch('/api/provider/bookings', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.bookings || [];
    } catch (error) {
      console.error('[bookingService.getProviderBookings] failed:', error);
      return [];
    }
  }

  /**
   * Retrieves all bookings for the admin ledger.
   */
  async getAdminBookings(): Promise<Booking[]> {
    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.bookings || [];
    } catch (error) {
      console.error('[bookingService.getAdminBookings] failed:', error);
      return [];
    }
  }
}

export const bookingService = new BookingService();
