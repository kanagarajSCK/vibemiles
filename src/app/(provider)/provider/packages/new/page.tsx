'use client';

import React, {
  useState, useRef, useEffect, useCallback, useMemo, Suspense,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus, Trash2, ArrowRight, ArrowLeft,
  MapPin, Search, Check, AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES, INDIAN_STATES } from '@/constants';
import { packageService } from '@/services/package.service';
import { CoverImageUploader } from '@/components/travel/CoverImageUploader';

// ─── Listing Types ─────────────────────────────────────────────
const LISTING_TYPES = [
  { value: 'tour',       label: 'Tour Package',       emoji: '🗺️' },
  { value: 'cab',        label: 'Cab / Taxi',         emoji: '🚗' },
  { value: 'villa',      label: 'Villa',              emoji: '🏕️' },
  { value: 'homestay',   label: 'Homestay',           emoji: '🏡' },
  { value: 'hostel',     label: 'Hostel / Room Stay', emoji: '🛋️' },
  { value: 'devotional', label: 'Devotional Trip',    emoji: '🛕' },
  { value: 'foreign',    label: 'Foreign Trip',       emoji: '✈️' },
] as const;

type ListingType = typeof LISTING_TYPES[number]['value'];

// ─── Cab Service Constants ─────────────────────────────────────
const CAB_SERVICE_TYPES = [
  'Local',
  'Outstation',
  'Airport Transfer',
  'One Way',
  'Round Trip',
  'Hourly Rental',
] as const;

const CAB_VEHICLE_TYPES = [
  'Sedan',
  'SUV',
  'MUV',
  'Tempo Traveller',
  'Luxury',
] as const;

const CAB_PRICING_TYPES = [
  'Per Day',
  'Per KM',
  'Flat / Fixed Fare',
  'Hourly',
] as const;

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

interface LocationResult {
  id: string;
  name: string;
  type: string;
  state: string;
  country: string;
}

// ─── STABLE INITIAL FORM STATE ────────────────────────────────
interface FormData {
  listingType: ListingType;
  // Basic Info / Tour info
  title: string;
  category: string;
  destinationInput: string;
  destinationCity: string;
  destinationState: string;
  durationDays: string;
  durationNights: string;
  maxGroupSize: string;
  description: string;
  // Cab Service Details (Step 1)
  cabServiceType: string;
  vehicleType: string;
  vehicleModel: string;
  vehicleRegNumber: string;
  seatingCapacity: string;
  pickupLocation: string;
  dropLocation: string;
  driverIncluded: string;
  acType: string;
  // Cab Pricing (Step 2)
  cabPricingType: string;
  baseFare: string;
  pricePerKm: string;
  driverAllowance: string;
  tollCharges: string;
  parkingCharges: string;
  nightCharges: string;
  minimumKm: string;
  estimatedDistanceKm: string;
  // Cab Policies (Step 3)
  advancePaymentPercent: string;
  waitingChargesPerHour: string;
  extraKmCharges: string;
  cabTermsAndConditions: string;
  // Accommodation-specific
  accommodationType: string;
  totalRooms: string;
  amenities: string;
  // Pricing (Tour)
  basePrice: string;
  discountPercent: string;
  // Media
  imageUrl: string;
  // Itinerary
  itinerary: ItineraryDay[];
  // Inclusions / Exclusions
  inclusions: string;
  exclusions: string;
  cancellationPolicy: string;
}

const INITIAL_FORM: FormData = {
  listingType: 'tour',
  title: '',
  category: 'tour',
  destinationInput: '',
  destinationCity: '',
  destinationState: '',
  durationDays: '3',
  durationNights: '2',
  maxGroupSize: '12',
  description: '',
  // Cab-specific fields
  cabServiceType: 'Outstation',
  vehicleType: 'Sedan',
  vehicleModel: '',
  vehicleRegNumber: '',
  seatingCapacity: '4',
  pickupLocation: '',
  dropLocation: '',
  driverIncluded: 'Yes',
  acType: 'AC',
  // Cab pricing
  cabPricingType: 'Per Day',
  baseFare: '1000',
  pricePerKm: '18',
  driverAllowance: '0',
  tollCharges: '0',
  parkingCharges: '0',
  nightCharges: '0',
  minimumKm: '0',
  estimatedDistanceKm: '150',
  // Cab policies
  advancePaymentPercent: '20',
  waitingChargesPerHour: '150',
  extraKmCharges: '20',
  cabTermsAndConditions: '',
  // Accommodation
  accommodationType: '',
  totalRooms: '',
  amenities: '',
  basePrice: '10000',
  discountPercent: '0',
  imageUrl: '',
  itinerary: [
    { day: 1, title: 'Arrival & Check-in', description: '' },
    { day: 2, title: 'Sightseeing', description: '' },
  ],
  inclusions: '',
  exclusions: '',
  cancellationPolicy: '',
};

// ─── Radio Button Card Component ───────────────────────────────
function RadioPill({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all text-left w-full ${
        selected
          ? 'border-teal-600 bg-teal-50/70 text-teal-950 font-semibold shadow-xs'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected ? 'border-teal-700 bg-teal-50' : 'border-slate-300 bg-white'
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-teal-700" />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

// ─── Location Autocomplete ────────────────────────────────────
interface LocationSearchProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (city: string, state: string) => void;
}

function LocationSearch({ value, onChange, onSelect }: LocationSearchProps) {
  const [results, setResults] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await fetch(
        `/api/locations/search?q=${encodeURIComponent(q)}&limit=8`,
        { signal: abortRef.current.signal }
      );
      if (!res.ok) throw new Error('search failed');
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
      setOpen(true);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(value), 300);
    return () => clearTimeout(t);
  }, [value, search]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-1.5">
        Destination <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          aria-label="Destination search"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-[15px] text-slate-900 placeholder-slate-400 transition-all focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          placeholder="Search city or destination..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl py-1.5 max-h-56 overflow-y-auto">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors text-left"
                onClick={() => {
                  onSelect(r.name, r.state);
                  onChange(`${r.name}, ${r.state}`);
                  setOpen(false);
                }}
              >
                <MapPin className="text-slate-400 w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800">{r.name}</span>
                  <span className="text-xs text-slate-500">{r.type} · {r.state}, {r.country}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Step labels ───────────────────────────────────────────────
const TOUR_STEPS = ['1. Basic Info', '2. Pricing', '3. Itinerary', '4. Review & Submit'] as const;
const CAB_STEPS = ['1. Cab Service Details', '2. Pricing', '3. Service Policies', '4. Review & Submit'] as const;

// ─── Inner Form Component ──────────────────────────────────────
function NewPackageForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit') || null;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(true);

  // Single flat form state
  const [form, setForm] = useState<FormData>(INITIAL_FORM);

  const isCab = form.listingType === 'cab';
  const isStay = ['villa', 'homestay', 'hostel'].includes(form.listingType);
  const steps = isCab ? CAB_STEPS : TOUR_STEPS;

  // Check provider KYC verification status
  useEffect(() => {
    let isMounted = true;
    fetch('/api/provider/verification')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.provider) {
          setVerificationStatus(data.provider.verificationStatus);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setCheckingVerification(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Load existing package for editing if editId is provided
  useEffect(() => {
    if (!editId) return;
    let isMounted = true;
    packageService.getProviderPackageById(editId).then((pkg) => {
      if (!isMounted || !pkg) return;
      setForm({
        listingType: (['tour', 'devotional', 'foreign', 'cab', 'villa', 'homestay', 'hostel'].includes(pkg.category) ? pkg.category : 'tour') as ListingType,
        title: pkg.name,
        category: pkg.category,
        destinationInput: pkg.destinationName ? `${pkg.destinationName}, ${pkg.state}` : '',
        destinationCity: pkg.city || pkg.destinationName || '',
        destinationState: pkg.state || '',
        durationDays: String(pkg.durationDays || 3),
        durationNights: String(pkg.durationNights || 2),
        maxGroupSize: String(pkg.maxGroupSize || 12),
        description: pkg.description || '',
        cabServiceType: 'Outstation',
        vehicleType: 'Sedan',
        vehicleModel: '',
        vehicleRegNumber: '',
        seatingCapacity: String(pkg.maxGroupSize || 4),
        pickupLocation: pkg.city || '',
        dropLocation: '',
        driverIncluded: 'Yes',
        acType: 'AC',
        cabPricingType: 'Per Day',
        baseFare: String(pkg.basePrice || 1000),
        pricePerKm: '18',
        driverAllowance: '0',
        tollCharges: '0',
        parkingCharges: '0',
        nightCharges: '0',
        minimumKm: '0',
        estimatedDistanceKm: '150',
        advancePaymentPercent: '20',
        waitingChargesPerHour: '150',
        extraKmCharges: '20',
        cabTermsAndConditions: '',
        accommodationType: '',
        totalRooms: '',
        amenities: '',
        basePrice: String(pkg.basePrice || 10000),
        discountPercent: String(pkg.discountPercent || 0),
        imageUrl: pkg.images?.[0] || '',
        itinerary: pkg.itinerary && pkg.itinerary.length > 0
          ? pkg.itinerary.map((i) => ({ day: i.day, title: i.title, description: i.description }))
          : INITIAL_FORM.itinerary,
        inclusions: pkg.inclusions?.join('\n') || '',
        exclusions: pkg.exclusions?.join('\n') || '',
        cancellationPolicy: pkg.cancellationPolicy?.notes || '',
      });
    }).catch((err) => {
      if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load listing for editing');
    });
    return () => { isMounted = false; };
  }, [editId]);

  // Helpers to update individual fields
  const set = useCallback(<K extends keyof FormData>(k: K, v: FormData[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  }, []);

  const handleListingTypeChange = useCallback((t: ListingType) => {
    setForm((prev) => ({
      ...prev,
      listingType: t,
      category: t === 'hostel' ? 'hotel' : t,
    }));
    setStep(1);
    setError(null);
  }, []);

  // Itinerary helpers (for Tour Packages)
  const addDay = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      itinerary: [
        ...prev.itinerary,
        { day: prev.itinerary.length + 1, title: `Day ${prev.itinerary.length + 1}`, description: '' },
      ],
    }));
  }, []);

  const removeDay = useCallback((idx: number) => {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary
        .filter((_, i) => i !== idx)
        .map((d, i) => ({ ...d, day: i + 1 })),
    }));
  }, []);

  const updateDay = useCallback(
    (idx: number, field: keyof ItineraryDay, val: string) => {
      setForm((prev) => {
        const next = [...prev.itinerary];
        next[idx] = { ...next[idx], [field]: val };
        return { ...prev, itinerary: next };
      });
    },
    []
  );

  // Derived pricing calculations
  const finalPrice = useMemo(() => {
    const base = parseFloat(form.basePrice) || 0;
    const disc = parseFloat(form.discountPercent) || 0;
    return Math.round(base - (base * disc) / 100);
  }, [form.basePrice, form.discountPercent]);

  // Cab Estimated Fare calculation
  const cabEstimatedTotal = useMemo(() => {
    const base = parseFloat(form.baseFare) || 0;
    const perKm = parseFloat(form.pricePerKm) || 0;
    const estKm = parseFloat(form.estimatedDistanceKm) || 0;
    const minKm = parseFloat(form.minimumKm) || 0;
    const effectiveKm = Math.max(estKm, minKm);
    const kmCost = effectiveKm * perKm;
    const driver = parseFloat(form.driverAllowance) || 0;
    const toll = parseFloat(form.tollCharges) || 0;
    const parking = parseFloat(form.parkingCharges) || 0;
    const night = parseFloat(form.nightCharges) || 0;
    return Math.round(base + kmCost + driver + toll + parking + night);
  }, [
    form.baseFare,
    form.pricePerKm,
    form.estimatedDistanceKm,
    form.minimumKm,
    form.driverAllowance,
    form.tollCharges,
    form.parkingCharges,
    form.nightCharges,
  ]);

  const handleSubmit = useCallback(async () => {
    if (verificationStatus !== 'VERIFIED') {
      setError('KYC Verification Required: Your business profile must be verified by admin before submitting listings.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let payload: Record<string, unknown>;

      if (isCab) {
        const defaultCabImage = form.imageUrl.trim() || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';
        payload = {
          name: form.title.trim(),
          description: form.description.trim() || `${form.cabServiceType} Cab Service with verified ${form.vehicleType} (${form.vehicleModel || 'AC Cab'}). ${form.driverIncluded === 'Yes' ? 'Professional Driver included.' : ''} ${form.acType} vehicle from ${form.pickupLocation || 'Pickup location'} to ${form.dropLocation || 'Drop location'}.`,
          category: 'cab',
          destinationCity: form.pickupLocation || form.destinationCity || form.destinationInput || 'Chennai',
          destinationState: form.destinationState || 'Tamil Nadu',
          durationDays: 1,
          durationNights: 0,
          maxGroupSize: Number(form.seatingCapacity) || 4,
          basePrice: Number(form.baseFare) || 1000,
          discountPercent: 0,
          images: [defaultCabImage],
          highlights: [
            `Service Type: ${form.cabServiceType}`,
            `Vehicle: ${form.vehicleType}${form.vehicleModel ? ` (${form.vehicleModel})` : ''}`,
            `Seating Capacity: ${form.seatingCapacity} Passengers`,
            `Pickup: ${form.pickupLocation || 'Specified by customer'}`,
            `Drop: ${form.dropLocation || 'Specified by customer'}`,
            `Driver: ${form.driverIncluded === 'Yes' ? 'Included' : 'Self-Drive / Not Included'}`,
            `Air Conditioning: ${form.acType}`,
            `Pricing: ₹${form.baseFare} Base Fare (₹${form.pricePerKm}/KM)`,
          ],
          inclusions: [
            `${form.acType} Vehicle (${form.vehicleType})`,
            form.driverIncluded === 'Yes' ? 'Commercial Driver Allowance' : '',
            Number(form.tollCharges) > 0 ? `Toll Charges (₹${form.tollCharges})` : 'Tolls included or as per actuals',
            Number(form.parkingCharges) > 0 ? `Parking charges (₹${form.parkingCharges})` : '',
          ].filter(Boolean),
          exclusions: [
            'Interstate permits / Border tax (if applicable outside state)',
            `Waiting charges: ₹${form.waitingChargesPerHour || '150'}/hour after free pickup window`,
            `Extra KM charges: ₹${form.extraKmCharges || '20'}/KM beyond estimated trip distance`,
          ],
          cancellationPolicy: form.cancellationPolicy.trim() || 'Free cancellation up to 6 hours before scheduled pickup time.',
          tags: [
            'cab',
            'taxi',
            form.cabServiceType.toLowerCase(),
            form.vehicleType.toLowerCase(),
            form.pickupLocation.toLowerCase(),
            form.dropLocation.toLowerCase(),
          ].filter(Boolean),
          submitForReview: true,
        };
      } else {
        if (!form.imageUrl || !form.imageUrl.trim()) {
          setImageError('A cover image is required. Please upload an image in Step 1 before submitting.');
          setError('Cover image is required. Please upload an image in Step 1 before submitting.');
          setStep(1);
          setSubmitting(false);
          return;
        }

        payload = {
          name: form.title.trim(),
          description: form.description.trim() || 'Exciting travel experience with comprehensive itinerary and verified service.',
          category: form.category,
          destinationCity: form.destinationCity || form.destinationInput,
          destinationState: form.destinationState || 'India',
          durationDays: Number(form.durationDays) || 1,
          durationNights: Number(form.durationNights) ?? Math.max(0, (Number(form.durationDays) || 1) - 1),
          maxGroupSize: Number(form.maxGroupSize) || 10,
          basePrice: Number(form.basePrice) || 0,
          discountPercent: Number(form.discountPercent) || 0,
          images: form.imageUrl.trim() ? [form.imageUrl.trim()] : undefined,
          itinerary: form.itinerary,
          inclusions: form.inclusions.split('\n').map((s) => s.trim()).filter(Boolean),
          exclusions: form.exclusions.split('\n').map((s) => s.trim()).filter(Boolean),
          cancellationPolicy: form.cancellationPolicy,
          submitForReview: true,
        };
      }

      if (editId) {
        await packageService.updateProviderPackage(editId, payload as any);
      } else {
        await packageService.createProviderPackage(payload as any);
      }

      router.push(ROUTES.PROVIDER_PACKAGES);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save listing');
      setSubmitting(false);
    }
  }, [form, editId, isCab, verificationStatus, router]);

  // ═════════════════════════════════════════════════════════════
  // CAB / TAXI SPECIFIC STEP RENDERERS (MATCHING IMAGES 1, 2, 3, 4)
  // ═════════════════════════════════════════════════════════════

  // Cab Step 1: Cab Service Details (Images 1 & 2)
  const renderCabStep1 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Cab Service Details
      </h2>

      {/* 1. SERVICE NAME */}
      <Input
        label="SERVICE NAME *"
        required
        placeholder="e.g. Chennai → Pondicherry Cab"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
      />

      {/* 2. SERVICE TYPE */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          SERVICE TYPE <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CAB_SERVICE_TYPES.map((type) => (
            <RadioPill
              key={type}
              label={type}
              selected={form.cabServiceType === type}
              onClick={() => set('cabServiceType', type)}
            />
          ))}
        </div>
      </div>

      {/* 3. VEHICLE TYPE */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          VEHICLE TYPE <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CAB_VEHICLE_TYPES.map((type) => (
            <RadioPill
              key={type}
              label={type}
              selected={form.vehicleType === type}
              onClick={() => set('vehicleType', type)}
            />
          ))}
        </div>
      </div>

      {/* 4. VEHICLE MODEL & REGISTRATION NUMBER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="VEHICLE MODEL"
          placeholder="e.g. Toyota Innova Crysta"
          value={form.vehicleModel}
          onChange={(e) => set('vehicleModel', e.target.value)}
        />
        <Input
          label="VEHICLE REGISTRATION NUMBER"
          placeholder="e.g. TN 01 AB 1234"
          value={form.vehicleRegNumber}
          onChange={(e) => set('vehicleRegNumber', e.target.value)}
        />
      </div>

      {/* 5. SEATING CAPACITY & PICKUP LOCATION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="SEATING CAPACITY *"
          type="number"
          min="1"
          placeholder="4"
          value={form.seatingCapacity}
          onChange={(e) => set('seatingCapacity', e.target.value)}
        />
        <Input
          label="PICKUP LOCATION *"
          placeholder="e.g. Chennai Airport / Central"
          value={form.pickupLocation}
          onChange={(e) => set('pickupLocation', e.target.value)}
        />
      </div>

      {/* 6. DROP LOCATION */}
      <Input
        label="DROP LOCATION *"
        placeholder="e.g. Pondicherry White Town"
        value={form.dropLocation}
        onChange={(e) => set('dropLocation', e.target.value)}
      />

      {/* 7. DRIVER INCLUDED? */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          DRIVER INCLUDED?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <RadioPill
            label="Yes"
            selected={form.driverIncluded === 'Yes'}
            onClick={() => set('driverIncluded', 'Yes')}
          />
          <RadioPill
            label="No"
            selected={form.driverIncluded === 'No'}
            onClick={() => set('driverIncluded', 'No')}
          />
        </div>
      </div>

      {/* 8. AC / NON-AC */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          AC / NON-AC
        </label>
        <div className="grid grid-cols-2 gap-3">
          <RadioPill
            label="AC"
            selected={form.acType === 'AC'}
            onClick={() => set('acType', 'AC')}
          />
          <RadioPill
            label="Non-AC"
            selected={form.acType === 'Non-AC'}
            onClick={() => set('acType', 'Non-AC')}
          />
        </div>
      </div>

      {/* Vehicle / Cab Photo (Optional upload or standard photo) */}
      <div className="pt-2 border-t border-slate-100">
        <CoverImageUploader
          value={form.imageUrl}
          onChange={(url) => {
            set('imageUrl', url);
            if (url) setImageError(null);
          }}
          required={false}
          error={imageError}
          onError={setImageError}
        />
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-3">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
          onClick={() => {
            if (!form.title.trim()) {
              setError('Please enter a service name.');
              return;
            }
            if (!form.pickupLocation.trim() || !form.dropLocation.trim()) {
              setError('Please specify both pickup and drop locations.');
              return;
            }
            setError(null);
            setStep(2);
          }}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  // Cab Step 2: Pricing (Image 3)
  const renderCabStep2 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Pricing
      </h2>

      {/* 1. PRICING TYPE */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          PRICING TYPE <span className="text-rose-500">*</span>
        </label>
        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all font-medium"
          value={form.cabPricingType}
          onChange={(e) => set('cabPricingType', e.target.value)}
        >
          {CAB_PRICING_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* 2. BASE FARE & PRICE / KM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="BASE FARE (₹)"
          type="number"
          min="0"
          value={form.baseFare}
          onChange={(e) => set('baseFare', e.target.value)}
        />
        <Input
          label="PRICE / KM (₹)"
          type="number"
          min="0"
          value={form.pricePerKm}
          onChange={(e) => set('pricePerKm', e.target.value)}
        />
      </div>

      {/* 3. DRIVER ALLOWANCE & TOLL CHARGES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="DRIVER ALLOWANCE (₹)"
          type="number"
          min="0"
          value={form.driverAllowance}
          onChange={(e) => set('driverAllowance', e.target.value)}
        />
        <Input
          label="TOLL CHARGES (₹)"
          type="number"
          min="0"
          value={form.tollCharges}
          onChange={(e) => set('tollCharges', e.target.value)}
        />
      </div>

      {/* 4. PARKING CHARGES & NIGHT CHARGES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="PARKING CHARGES (₹)"
          type="number"
          min="0"
          value={form.parkingCharges}
          onChange={(e) => set('parkingCharges', e.target.value)}
        />
        <Input
          label="NIGHT CHARGES (₹)"
          type="number"
          min="0"
          value={form.nightCharges}
          onChange={(e) => set('nightCharges', e.target.value)}
        />
      </div>

      {/* 5. MINIMUM KM & ESTIMATED DISTANCE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="MINIMUM KM"
          type="number"
          min="0"
          value={form.minimumKm}
          onChange={(e) => set('minimumKm', e.target.value)}
        />
        <Input
          label="ESTIMATED DISTANCE (KM)"
          type="number"
          min="0"
          value={form.estimatedDistanceKm}
          onChange={(e) => set('estimatedDistanceKm', e.target.value)}
        />
      </div>

      {/* 6. ESTIMATED FARE CARD (Matching Image 3) */}
      <div className="rounded-2xl bg-teal-50/80 border border-teal-200 p-4 sm:p-5 space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
          ESTIMATED FARE
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-teal-950">
          ₹{(parseFloat(form.baseFare) || 1000).toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-slate-500">
          Base fare + {form.estimatedDistanceKm || '150'} KM × ₹{form.pricePerKm || '18'}/KM + allowances and charges
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => setStep(1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
          onClick={() => setStep(3)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  // Cab Step 3: Service Policies (Image 4)
  const renderCabStep3 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Service Policies
      </h2>

      {/* 1. ADVANCE PAYMENT (%) & WAITING CHARGES (₹ / HOUR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="ADVANCE PAYMENT (%)"
          type="number"
          min="0"
          max="100"
          placeholder="e.g. 20"
          value={form.advancePaymentPercent}
          onChange={(e) => set('advancePaymentPercent', e.target.value)}
        />
        <Input
          label="WAITING CHARGES (₹ / HOUR)"
          type="number"
          min="0"
          placeholder="e.g. 150"
          value={form.waitingChargesPerHour}
          onChange={(e) => set('waitingChargesPerHour', e.target.value)}
        />
      </div>

      {/* 2. EXTRA KM CHARGES (₹ / KM) */}
      <div className="sm:max-w-[calc(50%-0.5rem)]">
        <Input
          label="EXTRA KM CHARGES (₹ / KM)"
          type="number"
          min="0"
          placeholder="e.g. 20"
          value={form.extraKmCharges}
          onChange={(e) => set('extraKmCharges', e.target.value)}
        />
      </div>

      {/* 3. CANCELLATION POLICY */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          CANCELLATION POLICY
        </label>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
          placeholder="e.g. Free cancellation up to 6 hours before scheduled pickup time. 50% cancellation fee within 2 hours."
          value={form.cancellationPolicy}
          onChange={(e) => set('cancellationPolicy', e.target.value)}
        />
      </div>

      {/* 4. TERMS & CONDITIONS */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          TERMS & CONDITIONS
        </label>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
          placeholder="e.g. Night driving charges apply between 10:00 PM and 6:00 AM. AC might be turned off during steep ghat climbs."
          value={form.cabTermsAndConditions}
          onChange={(e) => set('cabTermsAndConditions', e.target.value)}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => setStep(2)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
          onClick={() => setStep(4)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Review & Submit
        </Button>
      </div>
    </div>
  );

  // Cab Step 4: Review & Submit
  const renderCabStep4 = () => {
    const serviceRows = [
      { label: 'Listing Type', value: 'Cab / Taxi' },
      { label: 'Service Name', value: form.title || '—' },
      { label: 'Service Type', value: form.cabServiceType },
      { label: 'Vehicle Type', value: form.vehicleType },
      { label: 'Vehicle Model', value: form.vehicleModel || 'Standard' },
      { label: 'Registration No.', value: form.vehicleRegNumber || '—' },
      { label: 'Seating Capacity', value: `${form.seatingCapacity} Passengers` },
      { label: 'Pickup Location', value: form.pickupLocation || '—' },
      { label: 'Drop Location', value: form.dropLocation || '—' },
      { label: 'Driver Included', value: form.driverIncluded },
      { label: 'Air Conditioning', value: form.acType },
      { label: 'Pricing Type', value: form.cabPricingType },
      { label: 'Base Fare', value: `₹${(parseFloat(form.baseFare) || 1000).toLocaleString('en-IN')}` },
      { label: 'Price / KM', value: `₹${form.pricePerKm || '18'} / KM` },
      { label: 'Estimated Trip Fare', value: `₹${cabEstimatedTotal.toLocaleString('en-IN')}` },
      { label: 'Advance Payment', value: `${form.advancePaymentPercent || '20'}%` },
      { label: 'Waiting Charges', value: `₹${form.waitingChargesPerHour || '150'} / hour` },
      { label: 'Extra KM Charges', value: `₹${form.extraKmCharges || '20'} / KM` },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Review & Submit Cab Listing
        </h2>

        {form.imageUrl && (
          <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.imageUrl} alt="Vehicle Preview" className="h-full w-full object-cover" />
            <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow">
              Cab Vehicle Photo
            </div>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-0 divide-y divide-slate-100">
          {serviceRows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
              <span className="font-semibold text-slate-800 text-sm text-right">{value}</span>
            </div>
          ))}
        </div>

        {form.cancellationPolicy && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block">Cancellation Policy</span>
            <p className="text-xs text-slate-700 leading-relaxed">{form.cancellationPolicy}</p>
          </div>
        )}

        {form.cabTermsAndConditions && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 block">Terms & Conditions</span>
            <p className="text-xs text-slate-700 leading-relaxed">{form.cabTermsAndConditions}</p>
          </div>
        )}

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-700">
          💡 Your cab listing will be reviewed by the VibeMiles operations team before going live.
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setStep(3)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <Button
            type="button"
            variant="accent"
            size="lg"
            isLoading={submitting}
            disabled={!checkingVerification && verificationStatus !== 'VERIFIED'}
            onClick={handleSubmit}
          >
            Submit for Approval
          </Button>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════
  // STANDARD STEP RENDERERS (FOR TOURS, VILLAS, HOMESTAYS, HOSTELS)
  // ═════════════════════════════════════════════════════════════

  const renderStandardStep1 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Basic Information</h2>

      <Input
        label="Package Title"
        required
        placeholder={
          isStay ? 'e.g. Hilltop Villa with Valley View, Coorg' :
          form.listingType === 'devotional' ? 'e.g. 3D/2N Kashi Vishwanath & Ganga Aarti Spiritual Yatra' :
          form.listingType === 'foreign' ? 'e.g. 5D/4N Dubai Highlights & Desert Safari' :
          'e.g. 5D/4N Manali Snow Adventure'
        }
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
      />

      {form.listingType === 'devotional' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
          <span className="font-bold flex items-center gap-1.5">🛕 Devotional Listing Guidance</span>
          <p>Please list temple orientation, Aarti viewing, and holy transport clearly in your inclusions. Note that VIP sanctum darshan passes must be obtained by devotees directly from official temple trusts.</p>
        </div>
      )}

      {form.listingType === 'foreign' && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-3.5 text-xs text-teal-900 space-y-1">
          <span className="font-bold flex items-center gap-1.5">✈️ International Listing Guidance</span>
          <p>Please clearly declare that international airfare, visa fees, and overseas insurance are excluded unless specifically arranged. Remind travellers of passport validity rules (min 6 months).</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LocationSearch
          value={form.destinationInput}
          onChange={(v) => set('destinationInput', v)}
          onSelect={(city, state) => {
            setForm((prev) => ({
              ...prev,
              destinationInput: `${city}, ${state}`,
              destinationCity: city,
              destinationState: state,
            }));
          }}
        />
        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-1.5">
            State
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[15px] text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all"
            value={form.destinationState}
            onChange={(e) => set('destinationState', e.target.value)}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Duration (Days)"
          type="number"
          min="1"
          value={form.durationDays}
          onChange={(e) => set('durationDays', e.target.value)}
        />
        <Input
          label="Duration (Nights)"
          type="number"
          min="0"
          value={form.durationNights}
          onChange={(e) => set('durationNights', e.target.value)}
        />
        <Input
          label="Max Group Size"
          type="number"
          min="1"
          value={form.maxGroupSize}
          onChange={(e) => set('maxGroupSize', e.target.value)}
        />
      </div>

      {isStay && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Accommodation Type"
            placeholder="e.g. Private Villa, Shared Dorm"
            value={form.accommodationType}
            onChange={(e) => set('accommodationType', e.target.value)}
          />
          <Input
            label="Total Rooms / Beds"
            type="number"
            min="1"
            value={form.totalRooms}
            onChange={(e) => set('totalRooms', e.target.value)}
          />
        </div>
      )}

      <CoverImageUploader
        value={form.imageUrl}
        onChange={(url) => {
          set('imageUrl', url);
          if (url) setImageError(null);
        }}
        required={true}
        error={imageError}
        onError={setImageError}
      />

      <div>
        <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-1.5">
          Description
        </label>
        <textarea
          rows={4}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[15px] text-slate-900 placeholder-slate-400 transition-all focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none"
          placeholder="Describe highlights, experiences, accommodation and what makes this listing special..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => {
            if (!form.imageUrl || !form.imageUrl.trim()) {
              setImageError('A cover image is required. Please upload an image before proceeding.');
              return;
            }
            setImageError(null);
            setStep(2);
          }}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Pricing
        </Button>
      </div>
    </div>
  );

  const renderStandardStep2 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Pricing & Discount</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Base Price (₹) / person"
          type="number"
          min="0"
          value={form.basePrice}
          onChange={(e) => set('basePrice', e.target.value)}
        />
        <Input
          label="Discount (%)"
          type="number"
          min="0"
          max="100"
          value={form.discountPercent}
          onChange={(e) => set('discountPercent', e.target.value)}
        />
      </div>

      <div className="rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Customer Display Price</p>
          {parseFloat(form.discountPercent) > 0 && (
            <p className="text-xs text-slate-400 line-through">
              ₹{(parseFloat(form.basePrice) || 0).toLocaleString('en-IN')}
            </p>
          )}
          <p className="text-2xl font-extrabold text-teal-800">
            ₹{finalPrice.toLocaleString('en-IN')}
            <span className="text-sm font-medium text-slate-500 ml-1">/ person</span>
          </p>
        </div>
        {parseFloat(form.discountPercent) > 0 && (
          <div className="rounded-xl bg-teal-600 text-white px-4 py-2 text-center shrink-0">
            <p className="text-xl font-black">{form.discountPercent}%</p>
            <p className="text-xs font-semibold">OFF</p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" size="md" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
        <Button type="button" variant="primary" size="md" onClick={() => setStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
          Continue to Itinerary
        </Button>
      </div>
    </div>
  );

  const renderStandardStep3 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">
          {isStay ? 'Amenities & Details' : 'Day-by-Day Itinerary'}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={addDay} leftIcon={<Plus className="w-4 h-4" />}>
          Add Day
        </Button>
      </div>

      <div className="space-y-3">
        {form.itinerary.map((day, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-700 text-white px-2.5 py-0.5 text-xs font-bold">
                Day {idx + 1}
              </span>
              {form.itinerary.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDay(idx)}
                  className="text-rose-400 hover:text-rose-600 transition-colors"
                  aria-label={`Remove day ${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <Input
              label="Title"
              value={day.title}
              onChange={(e) => updateDay(idx, 'title', e.target.value)}
              placeholder={`Day ${idx + 1} activity...`}
            />
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-1">
                Description (optional)
              </label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[15px] text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
                value={day.description}
                onChange={(e) => updateDay(idx, 'description', e.target.value)}
                placeholder="Brief description of the day's activities..."
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-1.5">
            Inclusions
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
            placeholder="Breakfast, Transfers, Sightseeing..."
            value={form.inclusions}
            onChange={(e) => set('inclusions', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-1.5">
            Exclusions
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
            placeholder="Flights, Personal expenses..."
            value={form.exclusions}
            onChange={(e) => set('exclusions', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" size="md" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
        <Button type="button" variant="primary" size="md" onClick={() => setStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
          Review & Submit
        </Button>
      </div>
    </div>
  );

  const renderStandardStep4 = () => {
    const rows = [
      { label: 'Listing Type', value: LISTING_TYPES.find((l) => l.value === form.listingType)?.label ?? form.listingType },
      { label: 'Title', value: form.title || '—' },
      { label: 'Destination', value: form.destinationCity ? `${form.destinationCity}, ${form.destinationState}` : form.destinationInput || '—' },
      { label: 'Duration', value: `${form.durationDays} Days / ${form.durationNights} Nights` },
      { label: 'Max Group Size', value: form.maxGroupSize },
      { label: 'Base Price', value: `₹${(parseFloat(form.basePrice) || 0).toLocaleString('en-IN')}` },
      { label: 'Discount', value: parseFloat(form.discountPercent) > 0 ? `${form.discountPercent}%` : 'None' },
      { label: 'Display Price', value: `₹${finalPrice.toLocaleString('en-IN')}` },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Review & Submit for Approval</h2>

        {form.imageUrl && (
          <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.imageUrl} alt="Cover Preview" className="h-full w-full object-cover" />
            <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow">
              Cover Image
            </div>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-0 divide-y divide-slate-100">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
              <span className="font-semibold text-slate-800 text-sm text-right">{value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-700">
          💡 Your listing will be reviewed by the Vibe Miles team before going live (usually 1–2 business days).
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" size="md" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
          <Button
            type="button"
            variant="accent"
            size="lg"
            isLoading={submitting}
            disabled={!checkingVerification && verificationStatus !== 'VERIFIED'}
            onClick={handleSubmit}
          >
            Submit for Approval
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16 max-w-3xl">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {editId ? 'Edit Package Listing' : 'Create New Listing'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {editId
            ? 'Update package details, itinerary, pricing, and resubmit for moderation.'
            : 'Provide details for your tour, cab, villa, homestay or hostel.'}
        </p>
      </div>

      {/* ── KYC VERIFICATION STATUS BANNER ── */}
      {!checkingVerification && verificationStatus !== 'VERIFIED' && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900 text-sm">KYC Document Verification Required</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your business account is currently <span className="font-semibold uppercase font-mono">{verificationStatus || 'UNVERIFIED'}</span>.
                In accordance with platform quality and traveler trust standards, service providers cannot publish or submit live marketplace listings until your business registration, government ID, and address proof documents are approved by our admin team.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Link href={ROUTES.PARTNER_VERIFICATION}>
              <Button size="sm" variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white">
                Complete KYC Verification →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── LISTING TYPE TABS (MATCHING IMAGE 1) ───────────────── */}
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        {LISTING_TYPES.map((lt) => {
          const active = form.listingType === lt.value;
          return (
            <button
              key={lt.value}
              type="button"
              onClick={() => handleListingTypeChange(lt.value)}
              className={`inline-flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition-all
                ${active
                  ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <span className="text-base leading-none">{lt.emoji}</span>
              <span>{lt.label}</span>
              {active && <Check className="w-4 h-4 text-teal-600" />}
            </button>
          );
        })}
      </div>

      {/* ── STEP INDICATOR (MATCHING IMAGES 1, 2, 3, 4) ────────── */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {steps.map((label, idx) => {
          const num = idx + 1;
          const isActive = step === num;
          const isDone = step > num;
          return (
            <div
              key={num}
              className={`flex items-center justify-center rounded-xl px-2 py-2.5 text-[11px] sm:text-xs font-bold transition-all text-center
                ${isActive
                  ? 'bg-teal-700 text-white shadow-md'
                  : isDone
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-transparent text-slate-500'
                }`}
            >
              <span className="leading-tight">{label}</span>
            </div>
          );
        })}
      </div>

      {/* ── STEP CONTENT ─────────────────────────────────────── */}
      {isCab ? (
        <>
          {step === 1 && renderCabStep1()}
          {step === 2 && renderCabStep2()}
          {step === 3 && renderCabStep3()}
          {step === 4 && renderCabStep4()}
        </>
      ) : (
        <>
          {step === 1 && renderStandardStep1()}
          {step === 2 && renderStandardStep2()}
          {step === 3 && renderStandardStep3()}
          {step === 4 && renderStandardStep4()}
        </>
      )}
    </div>
  );
}

export default function NewPackagePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading package form...</div>}>
      <NewPackageForm />
    </Suspense>
  );
}
