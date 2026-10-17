import type { Booking } from '@/types';

export interface PaymentOrderResponse {
  orderId: string;
  amount: number; // in paise
  amountRupees: number;
  currency: string;
  keyId: string;
  bookingRef: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface ProviderEarningsResponse {
  grossRevenue: number;
  platformCommission: number;
  netPayable: number;
  settledAmount: number;
  pendingSettlementAmount: number;
  settlements: Array<{
    id: string;
    bookingRef: string;
    packageName: string;
    grossAmount: number;
    commissionAmount: number;
    providerAmount: number;
    status: string;
    travelDate: string;
    createdAt: string;
  }>;
}

export interface AdminFinancialResponse {
  grossVolume: number;
  totalCommissionEarned: number;
  totalTaxCollected: number;
  totalProviderPayables: number;
  totalRefunds: number;
  commissionRate: number;
  recentLedger: Array<{
    id: string;
    bookingRef: string;
    providerName: string;
    grossAmount: number;
    commissionAmount: number;
    taxAmount: number;
    providerAmount: number;
    status: string;
    createdAt: string;
  }>;
}

class PaymentService {
  async createPaymentOrder(bookingId: string): Promise<PaymentOrderResponse> {
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create payment gateway order.');
    }
    return json.data;
  }

  async verifyPayment(payload: {
    bookingId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<Booking> {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Payment signature verification failed.');
    }
    return json.data;
  }

  async processAdminRefund(
    bookingId: string,
    reason?: string
  ): Promise<{ booking: Booking; refundAmount: number; refundStatus: string; gatewayRefundId?: string }> {
    const res = await fetch(`/api/admin/refunds/${encodeURIComponent(bookingId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to process refund.');
    }
    return json.data;
  }

  async getProviderEarnings(): Promise<ProviderEarningsResponse> {
    const res = await fetch('/api/provider/earnings');
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to fetch provider earnings.');
    }
    return json.data;
  }

  async getAdminFinancialStats(): Promise<AdminFinancialResponse> {
    const res = await fetch('/api/admin/payments');
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to fetch admin financial data.');
    }
    return json.data;
  }
}

export const paymentService = new PaymentService();
