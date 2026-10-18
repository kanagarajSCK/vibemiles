'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  UserCheck,
  PackagePlus,
  Tag,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import { packageService } from '@/services/package.service';
import { bookingService } from '@/services/booking.service';
import { couponService } from '@/services/coupon.service';
import { useAuth } from '@/context/AuthContext';
import { Package, Coupon } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';

function BookingWizardContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const queryDate = searchParams?.get('date');
  const queryAdults = searchParams?.get('adults');

  const { user, isAuthenticated } = useAuth();
  const packageId = params.packageId as string;

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<number>(1);
  const [submitError, setSubmitError] = useState<string>('');

  // Form State
  const [travelDate, setTravelDate] = useState<string>('');
  const initialAdults =
    queryAdults && !isNaN(parseInt(queryAdults, 10)) ? Math.max(1, parseInt(queryAdults, 10)) : 2;
  const [adults, setAdults] = useState<number>(initialAdults);
  const [children, setChildren] = useState<number>(0);
  const [travelers, setTravelers] = useState<
    Array<{ firstName: string; lastName: string; age: number; gender: string; idNumber: string }>
  >(() =>
    Array.from({ length: initialAdults }, (_, i) => ({
      firstName: i === 0 ? 'Rahul' : 'Priya',
      lastName: 'Sharma',
      age: 30 - i * 2,
      gender: i === 0 ? 'male' : 'female',
      idNumber: i === 0 ? '123456789012' : '987654321098',
    }))
  );

  // Optional Add-ons state
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['Insurance']);

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<string>('upi');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      const data = await packageService.getPackageBySlug(packageId);
      if (data) {
        setPkg(data);
        if (queryDate) {
          setTravelDate(queryDate);
        } else {
          setTravelDate(data.availableDates?.[0]?.date || new Date().toISOString().split('T')[0]);
        }
      }
      setLoading(false);
    }
    load();
  }, [packageId, queryDate]);

  useEffect(() => {
    setTravelers((prev) => {
      const targetCount = adults + children;
      if (prev.length === targetCount) return prev;
      if (prev.length < targetCount) {
        const extra = Array.from({ length: targetCount - prev.length }, () => ({
          firstName: '',
          lastName: '',
          age: 25,
          gender: 'other' as const,
          idNumber: '',
        }));
        return [...prev, ...extra];
      }
      return prev.slice(0, targetCount);
    });
  }, [adults, children]);

  if (loading || !pkg) {
    return <LoadingState label="Preparing your booking wizard..." />;
  }

  // Cost calculations
  const basePricePerPerson = pkg.finalPrice;
  const totalBaseAmount = basePricePerPerson * (adults + children * 0.75);

  const addonPrices: Record<string, number> = {
    Insurance: 499 * adults,
    'Airport Pickup': 1499,
    'Candlelight Dinner': 2999,
  };

  const optionalServicesAmount = selectedAddons.reduce(
    (acc, addon) => acc + (addonPrices[addon] || 0),
    0
  );

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'fixed') discountAmount = appliedCoupon.discountValue;
    if (appliedCoupon.discountType === 'percentage')
      discountAmount = Math.round((totalBaseAmount * appliedCoupon.discountValue) / 100);
  }

  const subtotal = Math.max(0, totalBaseAmount + optionalServicesAmount - discountAmount);
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + taxAmount;

  const handleAddonToggle = (name: string) => {
    if (selectedAddons.includes(name)) {
      setSelectedAddons(selectedAddons.filter((a) => a !== name));
    } else {
      setSelectedAddons([...selectedAddons, name]);
    }
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    setIsApplyingCoupon(true);
    try {
      const coupon = await couponService.validateCoupon(couponCode, totalBaseAmount);
      if (coupon) {
        setAppliedCoupon(coupon);
      } else {
        setCouponError('Invalid or expired coupon code. Try WELCOME1000');
      }
    } catch {
      setCouponError('Could not validate coupon. Please try again.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleFinalPayment = async () => {
    setSubmitError('');

    if (!isAuthenticated || !user) {
      const returnPath = `/booking/${encodeURIComponent(packageId)}?date=${encodeURIComponent(travelDate)}&adults=${adults}`;
      router.push(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }

    if (user.role && user.role !== 'customer') {
      setSubmitError('Only registered traveller accounts can create bookings. Please sign in as a traveller.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedAvail = pkg.availableDates?.find((d) => d.date === travelDate);
      const idempotencyKey = `idemp_${user.id}_${pkg.id}_${travelDate}`;
      const customerFullName = (user as unknown as { fullName?: string })?.fullName;

      const booking = await bookingService.createBooking({
        packageId: pkg.id,
        packageName: pkg.name,
        packageImage: pkg.images[0],
        providerId: pkg.providerId,
        providerName: pkg.providerName,
        customerId: user.id,
        customerName: travelers[0]?.firstName
          ? `${travelers[0].firstName} ${travelers[0].lastName}`
          : (customerFullName || user?.email?.split('@')[0] || 'Traveler'),
        customerEmail: user.email || 'traveler@vibemiles.com',
        customerPhone: user.phone || '+919876543210',
        availabilityId: selectedAvail?.id,
        travelDate,
        adults,
        children,
        travelerDetails: travelers.map((t) => ({
          firstName: t.firstName,
          lastName: t.lastName,
          age: t.age,
          gender: (t.gender as 'male' | 'female' | 'other') || 'other',
          idNumber: t.idNumber,
        })),
        optionalServices: selectedAddons.map((a) => ({
          id: a,
          name: a,
          description: a,
          price: addonPrices[a] || 0,
          isSelected: true,
        })),
        baseAmount: totalBaseAmount,
        optionalServicesAmount,
        discountAmount,
        couponCode: appliedCoupon?.code,
        taxAmount,
        totalAmount: grandTotal,
        paymentMethod,
        idempotencyKey,
      });

      // Keep isSubmitting = true during page transition to prevent double clicks
      router.push(`/booking/confirmation/${booking.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking reservation failed. Please try again.';
      setSubmitError(msg);
      setIsSubmitting(false); // Re-enable button on error so user can fix and retry
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3 py-5 pb-16 sm:space-y-8 sm:px-6 sm:py-8 sm:pb-20 lg:px-8">
      {/* Wizard Progress Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Secure Booking Checkout</h1>
            <p className="text-xs text-slate-500">{pkg.name} ({pkg.durationDays}D/{pkg.durationNights}N)</p>
          </div>
          <Badge variant="success" icon={<Lock className="w-3.5 h-3.5" />}>
            256-Bit SSL Encrypted
          </Badge>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, label: 'Travelers', icon: UserCheck },
            { num: 2, label: 'Add-ons', icon: PackagePlus },
            { num: 3, label: 'Discounts', icon: Tag },
            { num: 4, label: 'Payment', icon: CreditCard },
          ].map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div
                key={s.num}
                onClick={() => isDone && setStep(s.num)}
                className={`flex items-center gap-2 rounded-xl p-3 text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-teal-700 text-white shadow-md'
                    : isDone
                    ? 'bg-teal-50 text-teal-800 cursor-pointer'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isCurrent ? 'bg-white text-teal-800' : isDone ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: TRAVELERS DETAILS */}
      {step === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-5 sm:space-y-6 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Step 1: Select Travel Date & Traveler Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Departure Date</label>
              <select
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
              >
                {pkg.availableDates.map((d) => (
                  <option key={d.date} value={d.date}>
                    {formatDate(d.date)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adults (12+ yrs)</label>
                <select
                  value={adults}
                  onChange={(e) => {
                    const count = Number(e.target.value);
                    setAdults(count);
                    const newTr = Array.from({ length: count }).map((_, i) => ({
                      firstName: travelers[i]?.firstName || `Traveler`,
                      lastName: travelers[i]?.lastName || `${i + 1}`,
                      age: 28,
                      gender: 'male',
                      idNumber: '',
                    }));
                    setTravelers(newTr);
                  }}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Children (&lt;12 yrs)</label>
                <select
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
                >
                  <option value={0}>0 Children</option>
                  <option value={1}>1 Child</option>
                  <option value={2}>2 Children</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Lead & Passenger Details</h3>
            {travelers.map((t, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  Passenger #{idx + 1} {idx === 0 && '(Lead Traveler)'}
                </span>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <Input
                    label="First Name"
                    value={t.firstName}
                    onChange={(e) => {
                      const copy = [...travelers];
                      copy[idx].firstName = e.target.value;
                      setTravelers(copy);
                    }}
                  />
                  <Input
                    label="Last Name"
                    value={t.lastName}
                    onChange={(e) => {
                      const copy = [...travelers];
                      copy[idx].lastName = e.target.value;
                      setTravelers(copy);
                    }}
                  />
                  <Input
                    label="Age"
                    type="number"
                    value={t.age}
                    onChange={(e) => {
                      const copy = [...travelers];
                      copy[idx].age = Number(e.target.value);
                      setTravelers(copy);
                    }}
                  />
                  <Select
                    label="Gender"
                    value={t.gender}
                    onChange={(e) => {
                      const copy = [...travelers];
                      copy[idx].gender = e.target.value;
                      setTravelers(copy);
                    }}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="md" onClick={() => setStep(2)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Continue to Optional Add-ons
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: ADD-ON SERVICES */}
      {step === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Step 2: Customize Your Trip with Optional Services
          </h2>

          <div className="space-y-3">
            {[
              { name: 'Insurance', title: 'Comprehensive Travel Insurance', desc: 'Covers medical emergencies, baggage loss, and trip delays.', price: 499 * adults },
              { name: 'Airport Pickup', title: 'Private AC Airport Pickup & Drop', desc: 'Chauffeur driven private car pickup directly from airport terminal.', price: 1499 },
              { name: 'Candlelight Dinner', title: 'Romantic Candlelight Dinner Setup', desc: 'Special 4-course gourmet dinner with floral decor & wine.', price: 2999 },
            ].map((addon) => {
              const isChecked = selectedAddons.includes(addon.name);
              return (
                <div
                  key={addon.name}
                  onClick={() => handleAddonToggle(addon.name)}
                  className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                    isChecked ? 'border-teal-600 bg-teal-50/50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{addon.title}</h4>
                      <p className="text-xs text-slate-500">{addon.desc}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-teal-800">+{formatCurrency(addon.price)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between border-t border-slate-100 pt-4">
            <Button variant="outline" size="md" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Proceed to Promo Code
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: COUPONS & DISCOUNT */}
      {step === 3 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Step 3: Apply Coupon Code & Price Breakdown
          </h2>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700">Have a Promotional Coupon?</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon (e.g. WELCOME1000)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <Button variant="primary" size="md" isLoading={isApplyingCoupon} onClick={handleApplyCoupon}>
                {isApplyingCoupon ? 'Applying...' : 'Apply'}
              </Button>
            </div>
            {couponError && <p className="text-xs text-rose-600 font-medium">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Coupon &quot;{appliedCoupon.code}&quot; applied! You saved {formatCurrency(discountAmount)}
              </p>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="space-y-2 text-sm text-slate-700 border-t border-slate-100 pt-4">
            <div className="flex justify-between">
              <span>Base Tour Package ({adults} Adults)</span>
              <span>{formatCurrency(totalBaseAmount)}</span>
            </div>
            {optionalServicesAmount > 0 && (
              <div className="flex justify-between text-teal-800 font-medium">
                <span>Selected Add-on Services</span>
                <span>+{formatCurrency(optionalServicesAmount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Promotional Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Government GST (5%)</span>
              <span>+{formatCurrency(taxAmount)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between font-extrabold text-lg text-slate-900">
              <span>Final Total Payable</span>
              <span className="text-teal-800 text-xl">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="flex justify-between border-t border-slate-100 pt-4">
            <Button variant="outline" size="md" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Proceed to Payment
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: PAYMENT SIMULATION */}
      {step === 4 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Step 4: Select Instant Payment Method
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { id: 'upi', label: 'UPI / GPay / PhonePe', desc: 'Scan & Pay instantly' },
              { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
              { id: 'netbanking', label: 'Net Banking', desc: 'All major Indian banks' },
            ].map((pm) => (
              <div
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id)}
                className={`rounded-xl border p-4 cursor-pointer transition-all ${
                  paymentMethod === pm.id
                    ? 'border-teal-700 bg-teal-50/60 shadow-md ring-2 ring-teal-700/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <h4 className="font-bold text-sm text-slate-900">{pm.label}</h4>
                <p className="text-xs text-slate-500 mt-1">{pm.desc}</p>
              </div>
            ))}
          </div>

          {paymentMethod === 'upi' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-3 max-w-sm mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Scan & Pay via Any UPI App</span>
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl bg-white p-2 shadow-inner border border-slate-300">
                <QrCode className="h-32 w-32 text-slate-800" />
              </div>
              <p className="text-xs font-mono text-slate-600">UPI ID: vibemiles@icici</p>
            </div>
          )}

          {submitError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
              {submitError}
            </div>
          )}

          <div className="rounded-xl bg-teal-50 p-4 border border-teal-200 flex items-center justify-between text-slate-900">
            <div>
              <span className="text-xs text-slate-500 block">Total Amount to Pay</span>
              <span className="text-2xl font-extrabold text-teal-800">{formatCurrency(grandTotal)}</span>
            </div>
            <Button
              variant="accent"
              size="lg"
              isLoading={isSubmitting}
              onClick={handleFinalPayment}
              className="font-bold shadow-lg"
            >
              Pay & Confirm Booking
            </Button>
          </div>

          <div className="flex justify-start">
            <Button variant="outline" size="sm" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Discounts
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingWizardPage() {
  return (
    <React.Suspense fallback={<LoadingState label="Preparing your booking wizard..." />}>
      <BookingWizardContent />
    </React.Suspense>
  );
}
