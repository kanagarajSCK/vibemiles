'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle2, AlertCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { paymentService, type PaymentOrderResponse } from '@/services/payment.service';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface PaymentActionCardProps {
  bookingId: string;
  bookingRef: string;
  totalAmount: number;
  initialPaymentStatus: string;
  initialBookingStatus: string;
  expiresAt?: string;
}

declare global {
  interface Window {
    Razorpay?: unknown;
  }
}

function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PaymentActionCard({
  bookingId,
  bookingRef,
  totalAmount,
  initialPaymentStatus,
  initialBookingStatus,
  expiresAt,
}: PaymentActionCardProps) {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus.toLowerCase());
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Countdown timer for 15-minute hold window
  useEffect(() => {
    if (!expiresAt || paymentStatus === 'paid' || initialBookingStatus === 'cancelled') {
      return;
    }

    function updateTimer() {
      const expiry = new Date(expiresAt!).getTime();
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Hold window expired');
        setIsExpired(true);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, paymentStatus, initialBookingStatus]);

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. Request server-side order creation (amount derived exclusively on server)
      const orderData: PaymentOrderResponse = await paymentService.createPaymentOrder(bookingId);

      // 2. Load Razorpay script
      const isLoaded = await loadRazorpayCheckoutScript();

      if (!isLoaded || !window.Razorpay) {
        throw new Error(
          'Unable to load Razorpay checkout interface. Please check your network connection or try again.'
        );
      }

      // 3. Launch official Razorpay Checkout Modal
      const RazorpayConstructor = window.Razorpay as new (opts: unknown) => { open: () => void };
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'VibeMiles Marketplace',
        description: `Reservation Reference: ${bookingRef}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone,
        },
        theme: {
          color: '#0f766e', // teal-700
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            setIsProcessing(true);
            setSuccessMessage('Verifying payment signature with gateway...');

            // 4. Server-side signature verification
            await paymentService.verifyPayment({
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setPaymentStatus('paid');
            setSuccessMessage('Payment verified successfully! Your trip is confirmed.');
            router.refresh();
          } catch (verifyErr: unknown) {
            const errText =
              verifyErr instanceof Error ? verifyErr.message : 'Cryptographic verification failed.';
            setErrorMessage(errText);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzpInstance = new RazorpayConstructor(options);
      rzpInstance.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch checkout.';
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'paid') {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-emerald-950">Payment Completed & Verified</h3>
              <Badge variant="success">PAID</Badge>
            </div>
            <p className="text-xs text-emerald-800 mt-0.5">
              Total {formatCurrency(totalAmount)} paid securely via verified Razorpay gateway.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (initialBookingStatus === 'cancelled') {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-rose-950">Booking Cancelled</h3>
            <p className="text-xs text-rose-800 mt-0.5">
              This reservation has been cancelled. Departure inventory has been released.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">Payment Pending</h3>
              <Badge variant="warning">UNPAID</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Secure your departure seats now via UPI, Debit/Credit Card, or NetBanking.
            </p>
          </div>
        </div>

        {timeLeft && !isExpired && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
            <span>Hold expires in: {timeLeft}</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-rose-100 border border-rose-300 p-3 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-bold">Payment Error</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl bg-emerald-100 border border-emerald-300 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-200 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>256-Bit SSL Encrypted &bull; Razorpay Secure Gateway</span>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleInitiatePayment}
          disabled={isProcessing || isExpired}
          leftIcon={
            isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )
          }
          className="w-full sm:w-auto"
        >
          {isProcessing
            ? 'Processing...'
            : isExpired
            ? 'Hold Expired'
            : `Pay Now ${formatCurrency(totalAmount)}`}
        </Button>
      </div>
    </div>
  );
}
