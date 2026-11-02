'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DestinationWeather } from '@/components/weather';
import type { Package } from '@/types';

interface PackageBookingSidebarProps {
  pkg: Package;
}

export function PackageBookingSidebar({ pkg }: PackageBookingSidebarProps) {
  const cat = pkg.category.toLowerCase();
  const meta = (pkg.metadata || {}) as Record<string, any>;

  let unitLabel = '/ traveler';
  let dateLabel = 'Select Travel Date';
  let guestLabel = 'Number of Adults';
  let guestUnitSingular = 'Adult';
  let guestUnitPlural = 'Adults';
  let buttonLabel = 'Proceed to Booking';

  if (cat === 'food') {
    unitLabel = '/ guest';
    dateLabel = 'Select Dining Date';
    guestLabel = 'Number of Guests';
    guestUnitSingular = 'Guest';
    guestUnitPlural = 'Guests';
    buttonLabel = 'Reserve Table / Experience';
  } else if (cat === 'adventure') {
    unitLabel = '/ participant';
    dateLabel = 'Select Activity Date';
    guestLabel = 'Number of Participants';
    guestUnitSingular = 'Participant';
    guestUnitPlural = 'Participants';
    buttonLabel = 'Book Adventure Slot';
  } else if (cat === 'guide') {
    unitLabel = meta.guidePricingType === 'hourly' ? '/ hr' : meta.guidePricingType === 'half_day' ? '/ 4 hrs' : meta.guidePricingType === 'full_day' ? '/ day' : '/ booking';
    dateLabel = 'Select Tour Date';
    guestLabel = 'Number of Travelers';
    guestUnitSingular = 'Traveler';
    guestUnitPlural = 'Travelers';
    buttonLabel = 'Book Local Guide';
  } else if (cat === 'villa' || cat === 'homestay' || cat === 'hostel') {
    unitLabel = '/ night';
    dateLabel = 'Select Check-in Date';
    guestLabel = 'Number of Guests';
    guestUnitSingular = 'Guest';
    guestUnitPlural = 'Guests';
    buttonLabel = 'Reserve Stay';
  }

  const initialDate = pkg.availableDates?.[0]?.date || new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [adults, setAdults] = useState<number>(Math.min(2, Math.max(1, pkg.maxGroupSize || 2)));

  const basePriceForAdults = pkg.finalPrice * adults;
  const gstAmount = Math.round(basePriceForAdults * 0.05);
  const totalAmount = basePriceForAdults + gstAmount;

  const bookingHref = `/booking/${pkg.id}?date=${encodeURIComponent(selectedDate)}&adults=${adults}`;

  return (
    <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-100 pb-4 space-y-1">
        {pkg.discountPercent > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 line-through">
              {formatCurrency(pkg.basePrice)}
            </span>
            <Badge variant="warning" size="sm">
              {pkg.discountPercent}% OFF
            </Badge>
          </div>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-teal-800">
            {formatCurrency(pkg.finalPrice)}
          </span>
          <span className="text-sm font-medium text-slate-500">{unitLabel}</span>
        </div>
      </div>

      {/* Dates & Traveler Selector */}
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">{dateLabel}</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
          >
            {pkg.availableDates && pkg.availableDates.length > 0 ? (
              pkg.availableDates.map((dateObj) => (
                <option key={dateObj.date} value={dateObj.date}>
                  {formatDate(dateObj.date)}
                </option>
              ))
            ) : (
              <option value={initialDate}>Flexible Dates / Immediate Booking</option>
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">{guestLabel}</label>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 p-3 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
          >
            {Array.from({ length: Math.min(10, Math.max(1, pkg.maxGroupSize || 4)) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? guestUnitSingular : guestUnitPlural}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Destination Weather Widget */}
      <DestinationWeather city={pkg.destinationName} state={pkg.state} compact />

      {/* Dynamic Price breakdown summary */}
      <div className="rounded-xl bg-slate-50 p-4 text-xs space-y-2 text-slate-600">
        <div className="flex justify-between">
          <span>
            Base Price ({adults} {adults === 1 ? guestUnitSingular : guestUnitPlural})
          </span>
          <span>{formatCurrency(basePriceForAdults)}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxes & Service Fees (5% GST)</span>
          <span>{formatCurrency(gstAmount)}</span>
        </div>
        <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
          <span>Total Estimated Amount</span>
          <span className="text-teal-800">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <Link href={bookingHref}>
        <Button
          variant="accent"
          size="lg"
          className="w-full font-bold shadow-lg"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {buttonLabel}
        </Button>
      </Link>

      <p className="text-center text-xs text-slate-400">
        ⚡ Instant Confirmation & Lock-in Price Guarantee
      </p>
    </div>
  );
}
