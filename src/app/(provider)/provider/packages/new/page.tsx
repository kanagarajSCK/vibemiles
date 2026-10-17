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

// ─── Constants (module-level, never recreated) ─────────────────
const LISTING_TYPES = [
  { value: 'tour',       label: 'Tour Package',       emoji: '🗺️' },
  { value: 'devotional', label: 'Devotional Trip',    emoji: '🛕' },
  { value: 'foreign',    label: 'Foreign Trip',       emoji: '✈️' },
  { value: 'cab',        label: 'Cab / Taxi',         emoji: '🚗' },
  { value: 'villa',      label: 'Villa',              emoji: '🏡' },
  { value: 'homestay',   label: 'Homestay',           emoji: '🏠' },
  { value: 'hostel',     label: 'Hostel / Room Stay', emoji: '🛏️' },
] as const;

type ListingType = typeof LISTING_TYPES[number]['value'];

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
// Every field is initialised to a defined, stable value.
// No field ever starts as undefined or null.
// This prevents React's controlled/uncontrolled warning entirely.
interface FormData {
  listingType: ListingType;
  // Basic Info
  title: string;
  category: string;
  destinationInput: string;   // raw text in the autocomplete box
  destinationCity: string;
  destinationState: string;
  durationDays: string;      // kept as string so <input type="number"> is always controlled
  durationNights: string;
  maxGroupSize: string;
  description: string;
  // Cab-specific
  pickupLocation: string;
  dropLocation: string;
  vehicleType: string;
  // Accommodation-specific (villa/homestay/hostel)
  accommodationType: string;
  totalRooms: string;
  amenities: string;
  // Pricing
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
  pickupLocation: '',
  dropLocation: '',
  vehicleType: '',
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
  // AbortController ref to cancel stale requests
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    // Cancel previous in-flight request
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
      // Ignore intentional AbortErrors; clear on other errors
      if (err instanceof Error && err.name !== 'AbortError') {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce — 300 ms
  useEffect(() => {
    const t = setTimeout(() => search(value), 300);
    return () => clearTimeout(t);
  }, [value, search]);

  // Cleanup in-flight request on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // Close on outside click
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
          value={value}                          // always a string — never undefined
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
                type="button"           // ← explicit: never submits a form
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

// ─── Step indicator ───────────────────────────────────────────
const STEPS = ['Basic Info', 'Pricing', 'Itinerary', 'Review & Submit'] as const;

// ─── Inner Form Component ──────────────────────────────────────
function NewPackageForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit') || null;

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(true);

  // Single flat form state — always fully initialised
  const [form, setForm] = useState<FormData>(INITIAL_FORM);

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
        pickupLocation: '',
        dropLocation: '',
        vehicleType: '',
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

  // Switching listing type ONLY updates listingType & category;
  // all other fields are preserved intact.
  const handleListingTypeChange = useCallback((t: ListingType) => {
    setForm((prev) => ({
      ...prev,
      listingType: t,
      category: t === 'hostel' ? 'hotel' : t,
    }));
  }, []);

  // Itinerary helpers
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

  // Derived — never triggers re-render of its own
  const finalPrice = useMemo(() => {
    const base = parseFloat(form.basePrice) || 0;
    const disc = parseFloat(form.discountPercent) || 0;
    return Math.round(base - (base * disc) / 100);
  }, [form.basePrice, form.discountPercent]);

  const handleSubmit = useCallback(async () => {
    if (verificationStatus && verificationStatus !== 'VERIFIED') {
      setError('KYC Verification Required: Your business profile must be verified before submitting listings.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
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

      if (editId) {
        await packageService.updateProviderPackage(editId, payload);
      } else {
        await packageService.createProviderPackage(payload);
      }

      router.push(ROUTES.PROVIDER_PACKAGES);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save listing');
      setSubmitting(false);
    }
  }, [form, editId, router]);

  const isCab  = form.listingType === 'cab';
  const isStay = ['villa', 'homestay', 'hostel'].includes(form.listingType);

  // ── STEP 1: Basic Info ───────────────────────────────────────
  const renderStep1 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Basic Information</h2>

      <Input
        label="Package Title"
        required
        placeholder={
          isCab ? 'e.g. Manali to Chandigarh Airport Cab' :
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
          <p>Please list temple orientation, Aarti viewing, and holy transport clearly in your inclusions. Note that VIP sanctum darshan passes must be obtained by devotees directly from official temple trusts (e.g. TTD, Kashi Vishwanath).</p>
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
        {/* State — stays in sync with autocomplete selection */}
        <div>
          <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-1.5">
            State
          </label>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[15px] text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition-all"
            value={form.destinationState}           // always a string
            onChange={(e) => set('destinationState', e.target.value)}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration — only for non-cab */}
      {!isCab && (
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
      )}

      {/* Cab-specific fields */}
      {isCab && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Pickup Location"
              placeholder="e.g. Manali Bus Stand"
              value={form.pickupLocation}
              onChange={(e) => set('pickupLocation', e.target.value)}
            />
            <Input
              label="Drop Location"
              placeholder="e.g. Chandigarh Airport"
              value={form.dropLocation}
              onChange={(e) => set('dropLocation', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vehicle Type"
              placeholder="e.g. Innova Crysta, Tempo Traveller"
              value={form.vehicleType}
              onChange={(e) => set('vehicleType', e.target.value)}
            />
            <Input
              label="Max Passengers"
              type="number"
              min="1"
              value={form.maxGroupSize}
              onChange={(e) => set('maxGroupSize', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Stay-specific fields */}
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

      <Input
        label="Cover Image URL (optional)"
        placeholder="https://images.unsplash.com/photo-..."
        value={form.imageUrl}
        onChange={(e) => set('imageUrl', e.target.value)}
        helperText="Hosted image URL (Unsplash, CDN, etc). If left blank, a curated high-definition travel image will be assigned."
      />

      <div>
        <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600 mb-1.5">
          Description
        </label>
        <textarea
          rows={4}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[15px] text-slate-900 placeholder-slate-400 transition-all focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none"
          placeholder="Describe highlights, experiences, accommodation and what makes this listing special..."
          value={form.description}           // always a string
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="button" variant="primary" size="md" onClick={() => setStep(2)} rightIcon={<ArrowRight className="w-4 h-4" />}>
          Continue to Pricing
        </Button>
      </div>
    </div>
  );

  // ── STEP 2: Pricing ──────────────────────────────────────────
  const renderStep2 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Pricing & Discount</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={`Base Price (₹) / ${isCab ? 'trip' : 'person'}`}
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
            <span className="text-sm font-medium text-slate-500 ml-1">/ {isCab ? 'trip' : 'person'}</span>
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

  // ── STEP 3: Itinerary ────────────────────────────────────────
  const renderStep3 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-slate-900">
          {isCab ? 'Route & Stops' : isStay ? 'Amenities & Details' : 'Day-by-Day Itinerary'}
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
                  type="button"           // ← never submits form
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
              value={day.title}           // always a string
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
                value={day.description}   // always a string
                onChange={(e) => updateDay(idx, 'description', e.target.value)}
                placeholder="Brief description of the day's activities..."
              />
            </div>
          </div>
        ))}
      </div>

      {/* Inclusions / Exclusions */}
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

  // ── STEP 4: Review & Submit ───────────────────────────────────
  const renderStep4 = () => {
    const rows = [
      { label: 'Listing Type', value: LISTING_TYPES.find((l) => l.value === form.listingType)?.label ?? form.listingType },
      { label: 'Title', value: form.title || '—' },
      { label: 'Destination', value: form.destinationCity ? `${form.destinationCity}, ${form.destinationState}` : form.destinationInput || '—' },
      ...(!isCab ? [
        { label: 'Duration', value: `${form.durationDays} Days / ${form.durationNights} Nights` },
      ] : [
        { label: 'Pickup', value: form.pickupLocation || '—' },
        { label: 'Drop', value: form.dropLocation || '—' },
      ]),
      { label: isCab ? 'Max Passengers' : 'Max Group Size', value: form.maxGroupSize },
      { label: 'Base Price', value: `₹${(parseFloat(form.basePrice) || 0).toLocaleString('en-IN')}` },
      { label: 'Discount', value: parseFloat(form.discountPercent) > 0 ? `${form.discountPercent}%` : 'None' },
      { label: 'Display Price', value: `₹${finalPrice.toLocaleString('en-IN')}` },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Review & Submit for Approval</h2>

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
            : 'Publish a Tour Package, Cab Service, Villa, Homestay or Hostel listing.'}
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

      {/* ── LISTING TYPE TABS ────────────────────────────────── */}
      {/* Every button has type="button" — none of them submit a form */}
      <div className="flex flex-wrap gap-3">
        {LISTING_TYPES.map((lt) => {
          const active = form.listingType === lt.value;
          return (
            <button
              key={lt.value}
              type="button"               // ← CRITICAL: prevents accidental form submit
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

      {/* ── STEP INDICATOR ───────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {STEPS.map((label, idx) => {
          const num = idx + 1;
          const isActive = step === num;
          const isDone   = step > num;
          return (
            <div
              key={num}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 rounded-xl px-1 sm:px-2 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold transition-all text-center
                ${isActive ? 'bg-teal-700 text-white shadow-md'
                  : isDone  ? 'bg-teal-100 text-teal-700'
                  : 'bg-slate-100 text-slate-400'}`}
            >
              {isDone ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span className="sm:hidden">{num}.</span>}
              <span className="hidden sm:inline">{num}. </span>
              <span className="leading-tight">{label}</span>
            </div>
          );
        })}
      </div>

      {/* ── STEP CONTENT ─────────────────────────────────────── */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
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
