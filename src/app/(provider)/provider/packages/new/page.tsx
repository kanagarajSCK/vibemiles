'use client';

import React, {
  useState, useRef, useEffect, useCallback, useMemo, Suspense,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus, Trash2, ArrowRight, ArrowLeft,
  MapPin, Search, Check, AlertCircle, Home,
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

// ─── Villa / Homestay Constants ────────────────────────────────
const VILLA_PROPERTY_TYPES = [
  'Entire Villa',
  'Private Villa',
  'Resort Villa',
] as const;

const HOMESTAY_PROPERTY_TYPES = [
  'Entire Homestay',
  'Private Room in Homestay',
  'Farmstay / Cottage',
] as const;

const VILLA_AMENITIES = [
  'Living Room',
  'Kitchen',
  'Dining Area',
  'Private Pool',
  'Parking',
  'Wi-Fi',
] as const;

const VILLA_HOUSE_RULES = [
  'No Smoking',
  'No Pets',
  'No Parties',
  'Couples Allowed',
  'Bachelor Groups Allowed',
  'Children Allowed',
] as const;

// ─── Hostel Constants ──────────────────────────────────────────
const HOSTEL_PROPERTY_TYPES = [
  'Hostel',
  'Backpacker Hostel',
  'Dormitory',
  'Private Rooms',
] as const;

const HOSTEL_ROOM_TYPES = [
  'Dormitory',
  'Private Room',
  'Deluxe Dorm',
] as const;

const HOSTEL_GENDERS = [
  'Mixed',
  'Female Only',
  'Male Only',
] as const;

const HOSTEL_BATHROOM_TYPES = [
  'Shared',
  'Attached / Private',
] as const;

const HOSTEL_AMENITIES = [
  'High-Speed Wi-Fi',
  'Air Conditioning / Fans',
  'Personal Lockers / Storage',
  'Common Lounge / Coworking Area',
  'Shared Kitchen / Cafe',
  'Laundry Facilities',
  '24/7 Front Desk / Security',
  'Hot Water Shower',
  'CCTV Surveillance',
  'Board Games & Social Events',
] as const;

const HOSTEL_RULES = [
  '18+ Age Restriction Only',
  'Quiet Hours (10:00 PM - 7:00 AM)',
  'Valid Government ID Required at Check-in',
  'Outside Visitors Not Allowed in Dormitories',
  'No Alcohol / Drugs Inside Dorms',
] as const;

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

interface HostelRoomConfig {
  roomName: string;
  totalBeds: string;
  roomType: string;
  availableBeds: string;
  gender: string;
  bathroomType: string;
  pricePerNight: string;
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
  // Villa / Homestay Specific (Steps 1, 2, 3)
  villaPropertyType: string;
  locationName: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  maximumGuests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  villaAmenities: string[];
  villaPricePerNight: string;
  villaDiscountPercent: string;
  villaCleaningFee: string;
  villaSecurityDeposit: string;
  villaExtraGuestCharge: string;
  villaMinStayNights: string;
  villaHouseRules: string[];
  // Hostel Specific (Steps 1, 2, 3, 4)
  hostelPropertyType: string;
  hostelRooms: HostelRoomConfig[];
  hostelAmenities: string[];
  hostelCheckInTime: string;
  hostelCheckOutTime: string;
  hostelPolicies: string[];
  hostelTerms: string;
  // Accommodation generic
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
  // Villa / Homestay fields
  villaPropertyType: 'Entire Villa',
  locationName: '',
  address: '',
  city: '',
  state: 'Tamil Nadu',
  pinCode: '',
  maximumGuests: '10',
  bedrooms: '4',
  beds: '4',
  bathrooms: '3',
  villaAmenities: ['Private Pool', 'Parking', 'Wi-Fi'],
  villaPricePerNight: '12000',
  villaDiscountPercent: '0',
  villaCleaningFee: '0',
  villaSecurityDeposit: '0',
  villaExtraGuestCharge: '500',
  villaMinStayNights: '1',
  villaHouseRules: ['Couples Allowed', 'Children Allowed'],
  // Hostel fields
  hostelPropertyType: 'Hostel',
  hostelRooms: [
    {
      roomName: '6 Bed Mixed Dormitory',
      totalBeds: '6',
      roomType: 'Dormitory',
      availableBeds: '6',
      gender: 'Mixed',
      bathroomType: 'Shared',
      pricePerNight: '799',
    },
  ],
  hostelAmenities: [
    'High-Speed Wi-Fi',
    'Personal Lockers / Storage',
    'Common Lounge / Coworking Area',
    'Hot Water Shower',
    'CCTV Surveillance',
  ],
  hostelCheckInTime: '12:00 PM',
  hostelCheckOutTime: '11:00 AM',
  hostelPolicies: [
    '18+ Age Restriction Only',
    'Quiet Hours (10:00 PM - 7:00 AM)',
    'Valid Government ID Required at Check-in',
  ],
  hostelTerms: '',
  // Accommodation generic
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

// ─── Checkbox Card Component ───────────────────────────────────
function CheckboxCard({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <div
      onClick={onChange}
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm cursor-pointer transition-all select-none ${
        checked
          ? 'border-teal-600 bg-teal-50/70 text-teal-950 font-semibold shadow-xs'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          checked ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white'
        }`}
      >
        {checked && <Check className="w-3 h-3 stroke-[3]" />}
      </div>
      <span className="leading-tight">{label}</span>
    </div>
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
const VILLA_STEPS = ['1. Property Information', '2. Rooms & Pricing', '3. House Rules', '4. Review & Submit'] as const;
const HOSTEL_STEPS = ['1. Hostel Information', '2. Room Configuration', '3. Amenities', '4. Policies', '5. Review & Submit'] as const;

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
  const isVilla = form.listingType === 'villa' || form.listingType === 'homestay';
  const isHostel = form.listingType === 'hostel';

  const steps = isCab
    ? CAB_STEPS
    : isVilla
    ? VILLA_STEPS
    : isHostel
    ? HOSTEL_STEPS
    : TOUR_STEPS;

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
        villaPropertyType: 'Entire Villa',
        locationName: pkg.destinationName || '',
        address: '',
        city: pkg.city || pkg.destinationName || '',
        state: pkg.state || 'Tamil Nadu',
        pinCode: '',
        maximumGuests: String(pkg.maxGroupSize || 10),
        bedrooms: '4',
        beds: '4',
        bathrooms: '3',
        villaAmenities: ['Private Pool', 'Parking', 'Wi-Fi'],
        villaPricePerNight: String(pkg.basePrice || 12000),
        villaDiscountPercent: String(pkg.discountPercent || 0),
        villaCleaningFee: '0',
        villaSecurityDeposit: '0',
        villaExtraGuestCharge: '500',
        villaMinStayNights: '1',
        villaHouseRules: ['Couples Allowed', 'Children Allowed'],
        hostelPropertyType: 'Hostel',
        hostelRooms: [
          {
            roomName: '6 Bed Mixed Dormitory',
            totalBeds: '6',
            roomType: 'Dormitory',
            availableBeds: '6',
            gender: 'Mixed',
            bathroomType: 'Shared',
            pricePerNight: String(pkg.basePrice || 799),
          },
        ],
        hostelAmenities: [
          'High-Speed Wi-Fi',
          'Personal Lockers / Storage',
          'Common Lounge / Coworking Area',
          'Hot Water Shower',
          'CCTV Surveillance',
        ],
        hostelCheckInTime: '12:00 PM',
        hostelCheckOutTime: '11:00 AM',
        hostelPolicies: [
          '18+ Age Restriction Only',
          'Quiet Hours (10:00 PM - 7:00 AM)',
          'Valid Government ID Required at Check-in',
        ],
        hostelTerms: '',
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
      category: t,
      villaPropertyType: t === 'homestay' ? 'Entire Homestay' : 'Entire Villa',
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

  // Villa Derived Price calculation
  const villaFinalPrice = useMemo(() => {
    const base = parseFloat(form.villaPricePerNight) || 0;
    const disc = parseFloat(form.villaDiscountPercent) || 0;
    return Math.round(base - (base * disc) / 100);
  }, [form.villaPricePerNight, form.villaDiscountPercent]);

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

  // Hostel Room Helpers
  const addHostelRoom = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      hostelRooms: [
        ...prev.hostelRooms,
        {
          roomName: '',
          totalBeds: '6',
          roomType: 'Dormitory',
          availableBeds: '6',
          gender: 'Mixed',
          bathroomType: 'Shared',
          pricePerNight: '799',
        },
      ],
    }));
  }, []);

  const removeHostelRoom = useCallback((idx: number) => {
    setForm((prev) => ({
      ...prev,
      hostelRooms: prev.hostelRooms.filter((_, i) => i !== idx),
    }));
  }, []);

  const updateHostelRoom = useCallback(
    (idx: number, field: keyof HostelRoomConfig, val: string) => {
      setForm((prev) => {
        const next = [...prev.hostelRooms];
        next[idx] = { ...next[idx], [field]: val };
        return { ...prev, hostelRooms: next };
      });
    },
    []
  );

  // Toggle helper for arrays
  const toggleArrayItem = useCallback((field: 'villaAmenities' | 'villaHouseRules' | 'hostelAmenities' | 'hostelPolicies', item: string) => {
    setForm((prev) => {
      const current = prev[field];
      const exists = current.includes(item);
      const next = exists ? current.filter((x) => x !== item) : [...current, item];
      return { ...prev, [field]: next };
    });
  }, []);

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
      } else if (isVilla) {
        const defaultVillaImage = form.imageUrl.trim() || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80';
        const baseNightPrice = Number(form.villaPricePerNight) || Number(form.basePrice) || 12000;
        const discount = Number(form.villaDiscountPercent) || 0;
        payload = {
          name: form.title.trim(),
          description: form.description.trim() || `Luxurious ${form.villaPropertyType} offering ${form.bedrooms} bedrooms and ${form.bathrooms} bathrooms for up to ${form.maximumGuests} guests in ${form.city || form.destinationCity || 'scenic location'}.`,
          category: form.listingType === 'homestay' ? 'homestay' : 'villa',
          destinationCity: form.city.trim() || form.destinationCity || form.destinationInput || 'Chennai',
          destinationState: form.state.trim() || form.destinationState || 'Tamil Nadu',
          durationDays: 1,
          durationNights: 1,
          maxGroupSize: Number(form.maximumGuests) || 10,
          basePrice: baseNightPrice,
          discountPercent: discount,
          images: [defaultVillaImage],
          highlights: [
            `Property Type: ${form.villaPropertyType}`,
            `Capacity: Up to ${form.maximumGuests} Guests`,
            `Rooms: ${form.bedrooms} Bedrooms · ${form.beds} Beds · ${form.bathrooms} Bathrooms`,
            `Location: ${form.locationName || form.address ? `${form.locationName || form.address}, ` : ''}${form.city}, ${form.state}${form.pinCode ? ` - ${form.pinCode}` : ''}`,
            `Key Amenities: ${form.villaAmenities.length > 0 ? form.villaAmenities.join(', ') : 'All essential comforts'}`,
          ],
          inclusions: [
            `Accommodation in ${form.villaPropertyType}`,
            ...form.villaAmenities,
            'Clean Linens, Towels and Toiletries',
            Number(form.villaCleaningFee) > 0 ? `Cleaning Fee: ₹${form.villaCleaningFee}` : 'Standard Cleaning & Maintenance included',
          ].filter(Boolean),
          exclusions: [
            Number(form.villaSecurityDeposit) > 0 ? `Refundable Security Deposit: ₹${form.villaSecurityDeposit}` : '',
            Number(form.villaExtraGuestCharge) > 0 ? `Extra Guest Charge: ₹${form.villaExtraGuestCharge} / night` : '',
            `House Rules Enforced: ${form.villaHouseRules.join(', ')}`,
          ].filter(Boolean),
          cancellationPolicy: form.cancellationPolicy.trim() || 'Free cancellation up to 48 hours before check-in.',
          tags: [
            form.listingType,
            'stay',
            'villa',
            form.villaPropertyType.toLowerCase(),
            form.city.toLowerCase(),
            form.state.toLowerCase(),
          ].filter(Boolean),
          submitForReview: true,
        };
      } else if (isHostel) {
        const defaultHostelImage = form.imageUrl.trim() || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80';
        const lowestPrice = Math.min(...form.hostelRooms.map(r => Number(r.pricePerNight) || 799));
        const maxBeds = Math.max(...form.hostelRooms.map(r => Number(r.totalBeds) || 6));
        payload = {
          name: form.title.trim(),
          description: form.description.trim() || `Vibrant ${form.hostelPropertyType} in ${form.city || 'central location'} with modern dormitories, social lounge, high-speed Wi-Fi, and backpacker community vibes.`,
          category: 'hostel',
          destinationCity: form.city.trim() || form.destinationCity || form.destinationInput || 'Bangalore',
          destinationState: form.state.trim() || form.destinationState || 'Karnataka',
          durationDays: 1,
          durationNights: 1,
          maxGroupSize: maxBeds || 12,
          basePrice: lowestPrice || 799,
          discountPercent: 0,
          images: [defaultHostelImage],
          highlights: [
            `Property Type: ${form.hostelPropertyType}`,
            `Room Types: ${form.hostelRooms.map(r => `${r.roomName || 'Dorm'} (${r.gender}) - ₹${r.pricePerNight}/night`).join(' · ')}`,
            `Timings: Check-in ${form.hostelCheckInTime} · Check-out ${form.hostelCheckOutTime}`,
            `Location: ${form.locationName || form.address ? `${form.locationName || form.address}, ` : ''}${form.city}, ${form.state}${form.pinCode ? ` - ${form.pinCode}` : ''}`,
            `Top Amenities: ${form.hostelAmenities.join(', ')}`,
          ],
          inclusions: [
            'Comfortable bunk bed / stay as per selected room configuration',
            'Personal Locker / Safe Storage',
            'High-Speed Wi-Fi',
            ...form.hostelAmenities.filter(a => a !== 'High-Speed Wi-Fi'),
            'Fresh Bed Linen & Pillow',
          ].filter(Boolean),
          exclusions: [
            'Towel rental (available at front desk)',
            'Food & Beverages unless purchased separately',
            'Govt ID verification mandatory at check-in',
          ],
          cancellationPolicy: form.cancellationPolicy.trim() || 'Free cancellation up to 24 hours before check-in time.',
          tags: [
            'hostel',
            'backpacker',
            'dormitory',
            form.hostelPropertyType.toLowerCase(),
            form.city.toLowerCase(),
            form.state.toLowerCase(),
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
  }, [form, editId, isCab, isVilla, isHostel, verificationStatus, router]);

  // ═════════════════════════════════════════════════════════════
  // CAB / TAXI SPECIFIC STEP RENDERERS
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
        placeholder="e.g. Chennai → Pondicherry Cab"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
      />

      {/* 2. SERVICE TYPE */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          SERVICE TYPE *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CAB_SERVICE_TYPES.map((st) => (
            <RadioPill
              key={st}
              label={st}
              selected={form.cabServiceType === st}
              onClick={() => set('cabServiceType', st)}
            />
          ))}
        </div>
      </div>

      {/* 3. VEHICLE TYPE */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          VEHICLE TYPE *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CAB_VEHICLE_TYPES.map((vt) => (
            <RadioPill
              key={vt}
              label={vt}
              selected={form.vehicleType === vt}
              onClick={() => set('vehicleType', vt)}
            />
          ))}
        </div>
      </div>

      {/* 4. VEHICLE MODEL & VEHICLE REGISTRATION NUMBER */}
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
          max="50"
          value={form.seatingCapacity}
          onChange={(e) => set('seatingCapacity', e.target.value)}
        />
        <Input
          label="PICKUP LOCATION *"
          placeholder="e.g. Chennai Airport / Any Location"
          value={form.pickupLocation}
          onChange={(e) => set('pickupLocation', e.target.value)}
        />
      </div>

      {/* 6. DROP LOCATION */}
      <Input
        label="DROP LOCATION *"
        placeholder="e.g. White Town, Pondicherry / Customer Drop Point"
        value={form.dropLocation}
        onChange={(e) => set('dropLocation', e.target.value)}
      />

      {/* 7. DRIVER INCLUDED & AC / NON-AC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            DRIVER INCLUDED?
          </label>
          <div className="grid grid-cols-2 gap-2.5">
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

        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            AC / NON-AC
          </label>
          <div className="grid grid-cols-2 gap-2.5">
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
      </div>

      {/* Optional Vehicle Cover Photo */}
      <div className="space-y-1.5 pt-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          VEHICLE PHOTO (OPTIONAL)
        </label>
        <CoverImageUploader
          value={form.imageUrl}
          onChange={(url: string) => set('imageUrl', url)}
          onError={(msg: string | null) => setImageError(msg)}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => {
            if (!form.title.trim()) {
              setError('Service Name is required');
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
          PRICING TYPE *
        </label>
        <select
          value={form.cabPricingType}
          onChange={(e) => set('cabPricingType', e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        >
          {CAB_PRICING_TYPES.map((pt) => (
            <option key={pt} value={pt}>{pt}</option>
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

      {/* 6. ESTIMATED FARE CARD */}
      <div className="rounded-2xl bg-teal-50/80 border border-teal-200 p-4 sm:p-5 space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
          ESTIMATED FARE
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-teal-950">
          ₹{cabEstimatedTotal.toLocaleString('en-IN')}
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
      { label: 'Registration Number', value: form.vehicleRegNumber || '—' },
      { label: 'Seating Capacity', value: `${form.seatingCapacity} Passengers` },
      { label: 'Pickup Location', value: form.pickupLocation || '—' },
      { label: 'Drop Location', value: form.dropLocation || '—' },
      { label: 'Driver Included', value: form.driverIncluded },
      { label: 'AC / Non-AC', value: form.acType },
    ];

    const pricingRows = [
      { label: 'Pricing Type', value: form.cabPricingType },
      { label: 'Base Fare', value: `₹${(parseFloat(form.baseFare) || 0).toLocaleString('en-IN')}` },
      { label: 'Price / KM', value: `₹${form.pricePerKm}` },
      { label: 'Driver Allowance', value: `₹${form.driverAllowance}` },
      { label: 'Toll Charges', value: `₹${form.tollCharges}` },
      { label: 'Parking Charges', value: `₹${form.parkingCharges}` },
      { label: 'Night Charges', value: `₹${form.nightCharges}` },
      { label: 'Estimated Trip Distance', value: `${form.estimatedDistanceKm || '150'} KM` },
      { label: 'Estimated Total Fare', value: `₹${cabEstimatedTotal.toLocaleString('en-IN')}` },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Review & Submit Cab Listing
        </h2>

        {/* 1. Cab Service Details Summary */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Cab Service Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {serviceRows.map((r) => (
              <div key={r.label} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-500 font-medium">{r.label}:</span>
                <span className="text-slate-900 font-semibold text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Pricing Breakdown Summary */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Pricing & Charges
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {pricingRows.map((r) => (
              <div key={r.label} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-500 font-medium">{r.label}:</span>
                <span className="text-slate-900 font-semibold text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Service Policies Summary */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Service Policies
          </p>
          <p className="text-xs text-slate-600">
            <strong>Advance Payment:</strong> {form.advancePaymentPercent}% | <strong>Waiting Charges:</strong> ₹{form.waitingChargesPerHour}/hr | <strong>Extra KM:</strong> ₹{form.extraKmCharges}/KM
          </p>
          {form.cancellationPolicy && (
            <p className="text-xs text-slate-600">
              <strong>Cancellation:</strong> {form.cancellationPolicy}
            </p>
          )}
          {form.cabTermsAndConditions && (
            <p className="text-xs text-slate-600">
              <strong>Terms:</strong> {form.cabTermsAndConditions}
            </p>
          )}
        </div>

        {/* Verification Check & Action Buttons */}
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
            variant="primary"
            size="lg"
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8"
            isLoading={submitting}
            onClick={handleSubmit}
          >
            {verificationStatus !== 'VERIFIED'
              ? 'Verification Required'
              : 'Submit for Approval'}
          </Button>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════
  // VILLA / HOMESTAY SPECIFIC STEP RENDERERS (MATCHING IMAGES 1, 2, 3, 4)
  // ═════════════════════════════════════════════════════════════

  // Villa Step 1: Property Information (Images 1 & 2)
  const renderVillaStep1 = () => {
    const isHome = form.listingType === 'homestay';
    const propTypes = isHome ? HOMESTAY_PROPERTY_TYPES : VILLA_PROPERTY_TYPES;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Property Information
        </h2>

        {/* 1. VILLA NAME / HOMESTAY NAME */}
        <Input
          label={isHome ? 'HOMESTAY NAME *' : 'VILLA NAME *'}
          placeholder={isHome ? 'e.g. Traditional Plantation Homestay' : 'e.g. Luxury Beachside Villa'}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />

        {/* 2. PROPERTY TYPE */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            PROPERTY TYPE *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {propTypes.map((pt) => (
              <RadioPill
                key={pt}
                label={pt}
                selected={form.villaPropertyType === pt}
                onClick={() => set('villaPropertyType', pt)}
              />
            ))}
          </div>
        </div>

        {/* 3. LOCATION & ADDRESS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="LOCATION *"
            placeholder="e.g. ECR Beach Road"
            value={form.locationName}
            onChange={(e) => set('locationName', e.target.value)}
          />
          <Input
            label="ADDRESS *"
            placeholder="e.g. No. 45, Coconut Grove Way"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </div>

        {/* 4. CITY & STATE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="CITY *"
            placeholder="e.g. Pondicherry / Salem"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              STATE *
            </label>
            <select
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. PIN CODE */}
        <div className="sm:max-w-[calc(50%-0.5rem)]">
          <Input
            label="PIN CODE *"
            placeholder="e.g. 605001"
            value={form.pinCode}
            onChange={(e) => set('pinCode', e.target.value)}
          />
        </div>

        {/* 6. DESCRIPTION */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            DESCRIPTION *
          </label>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
            placeholder="Describe your villa, surrounding nature, landmark proximity, and special highlights..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        {/* 7. PROPERTY IMAGES */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            PROPERTY IMAGES *
          </label>
          <CoverImageUploader
            value={form.imageUrl}
            onChange={(url: string) => {
              set('imageUrl', url);
              setImageError(null);
            }}
            onError={(msg: string | null) => setImageError(msg)}
          />
        </div>

        {/* 8. ACCOMMODATION DETAILS */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Accommodation Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="MAXIMUM GUESTS *"
              type="number"
              min="1"
              value={form.maximumGuests}
              onChange={(e) => set('maximumGuests', e.target.value)}
            />
            <Input
              label="BEDROOMS *"
              type="number"
              min="1"
              value={form.bedrooms}
              onChange={(e) => set('bedrooms', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="BEDS *"
              type="number"
              min="1"
              value={form.beds}
              onChange={(e) => set('beds', e.target.value)}
            />
            <Input
              label="BATHROOMS *"
              type="number"
              min="1"
              value={form.bathrooms}
              onChange={(e) => set('bathrooms', e.target.value)}
            />
          </div>
        </div>

        {/* 9. AMENITIES (Matching Image 2) */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Amenities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VILLA_AMENITIES.map((am) => (
              <CheckboxCard
                key={am}
                label={am}
                checked={form.villaAmenities.includes(am)}
                onChange={() => toggleArrayItem('villaAmenities', am)}
              />
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
            onClick={() => {
              if (!form.title.trim()) {
                setError('Property Name is required');
                return;
              }
              setError(null);
              setStep(2);
            }}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continue to Rooms & Pricing
          </Button>
        </div>
      </div>
    );
  };

  // Villa Step 2: Rooms & Pricing
  const renderVillaStep2 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Rooms & Pricing
      </h2>

      {/* 1. BASE PRICE / NIGHT & DISCOUNT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="BASE PRICE / NIGHT (₹) *"
          type="number"
          min="0"
          value={form.villaPricePerNight}
          onChange={(e) => set('villaPricePerNight', e.target.value)}
        />
        <Input
          label="DISCOUNT (%)"
          type="number"
          min="0"
          max="100"
          value={form.villaDiscountPercent}
          onChange={(e) => set('villaDiscountPercent', e.target.value)}
        />
      </div>

      {/* 2. CLEANING FEE & SECURITY DEPOSIT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="CLEANING FEE (₹)"
          type="number"
          min="0"
          value={form.villaCleaningFee}
          onChange={(e) => set('villaCleaningFee', e.target.value)}
        />
        <Input
          label="SECURITY DEPOSIT (₹)"
          type="number"
          min="0"
          value={form.villaSecurityDeposit}
          onChange={(e) => set('villaSecurityDeposit', e.target.value)}
        />
      </div>

      {/* 3. EXTRA GUEST CHARGE & MINIMUM STAY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="EXTRA GUEST CHARGE / NIGHT (₹)"
          type="number"
          min="0"
          value={form.villaExtraGuestCharge}
          onChange={(e) => set('villaExtraGuestCharge', e.target.value)}
        />
        <Input
          label="MINIMUM STAY (NIGHTS)"
          type="number"
          min="1"
          value={form.villaMinStayNights}
          onChange={(e) => set('villaMinStayNights', e.target.value)}
        />
      </div>

      {/* ESTIMATED PRICE CARD */}
      <div className="rounded-2xl bg-teal-50/80 border border-teal-200 p-4 sm:p-5 space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
          ESTIMATED NIGHTLY RATE
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-teal-950">
          ₹{villaFinalPrice.toLocaleString('en-IN')}{' '}
          <span className="text-sm font-normal text-slate-500">/ night</span>
        </p>
        <p className="text-xs text-slate-500">
          {Number(form.villaDiscountPercent) > 0 ? `${form.villaDiscountPercent}% discount applied. ` : ''}
          {Number(form.villaCleaningFee) > 0 ? `+ ₹${form.villaCleaningFee} cleaning fee. ` : ''}
          {Number(form.villaSecurityDeposit) > 0 ? `(Refundable security deposit: ₹${form.villaSecurityDeposit})` : ''}
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
          Continue to House Rules
        </Button>
      </div>
    </div>
  );

  // Villa Step 3: House Rules (Image 4)
  const renderVillaStep3 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        House Rules
      </h2>

      {/* 1. HOUSE RULES CHECKBOX GRID (Matching Image 4) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          House Rules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VILLA_HOUSE_RULES.map((hr) => (
            <CheckboxCard
              key={hr}
              label={hr}
              checked={form.villaHouseRules.includes(hr)}
              onChange={() => toggleArrayItem('villaHouseRules', hr)}
            />
          ))}
        </div>
      </div>

      {/* 2. CANCELLATION POLICY (Matching Image 4) */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          CANCELLATION POLICY
        </label>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
          placeholder="e.g. Free cancellation up to 48 hours before check-in. 50% refund after that window."
          value={form.cancellationPolicy}
          onChange={(e) => set('cancellationPolicy', e.target.value)}
        />
      </div>

      {/* Navigation Buttons (Matching Image 4) */}
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

  // Villa Step 4: Review & Submit
  const renderVillaStep4 = () => {
    const propRows = [
      { label: 'Listing Type', value: form.listingType === 'homestay' ? 'Homestay' : 'Villa' },
      { label: 'Property Name', value: form.title || '—' },
      { label: 'Property Type', value: form.villaPropertyType },
      { label: 'Location', value: form.locationName || '—' },
      { label: 'Address', value: form.address || '—' },
      { label: 'City & State', value: `${form.city || '—'}, ${form.state}` },
      { label: 'Pin Code', value: form.pinCode || '—' },
      { label: 'Max Guests', value: `${form.maximumGuests} Guests` },
      { label: 'Bedrooms & Bathrooms', value: `${form.bedrooms} Bedrooms · ${form.beds} Beds · ${form.bathrooms} Baths` },
    ];

    const pricingRows = [
      { label: 'Price / Night', value: `₹${(parseFloat(form.villaPricePerNight) || 0).toLocaleString('en-IN')}` },
      { label: 'Discount', value: Number(form.villaDiscountPercent) > 0 ? `${form.villaDiscountPercent}%` : 'None' },
      { label: 'Cleaning Fee', value: Number(form.villaCleaningFee) > 0 ? `₹${form.villaCleaningFee}` : 'Included' },
      { label: 'Security Deposit', value: Number(form.villaSecurityDeposit) > 0 ? `₹${form.villaSecurityDeposit}` : 'None' },
      { label: 'Minimum Stay', value: `${form.villaMinStayNights || '1'} Night(s)` },
      { label: 'Effective Nightly Rate', value: `₹${villaFinalPrice.toLocaleString('en-IN')}` },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Review & Submit Property
        </h2>

        {/* 1. Property Details */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Property & Accommodation
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {propRows.map((r) => (
              <div key={r.label} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-500 font-medium">{r.label}:</span>
                <span className="text-slate-900 font-semibold text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Amenities Badges */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Selected Amenities
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {form.villaAmenities.length > 0 ? (
              form.villaAmenities.map((am) => (
                <span key={am} className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-900">
                  <Check className="w-3 h-3 text-teal-600" /> {am}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">No amenities selected</span>
            )}
          </div>
        </div>

        {/* 3. Pricing Summary */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Pricing Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {pricingRows.map((r) => (
              <div key={r.label} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-500 font-medium">{r.label}:</span>
                <span className="text-slate-900 font-semibold text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. House Rules Summary */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            House Rules & Cancellation
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {form.villaHouseRules.map((hr) => (
              <span key={hr} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {hr}
              </span>
            ))}
          </div>
          {form.cancellationPolicy && (
            <p className="text-xs text-slate-600 pt-1">
              <strong>Cancellation:</strong> {form.cancellationPolicy}
            </p>
          )}
        </div>

        {/* Verification Check & Action Buttons */}
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
            variant="primary"
            size="lg"
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8"
            isLoading={submitting}
            onClick={handleSubmit}
          >
            {verificationStatus !== 'VERIFIED'
              ? 'Verification Required'
              : 'Submit for Approval'}
          </Button>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════
  // HOSTEL SPECIFIC STEP RENDERERS (MATCHING IMAGE 5 & PROMPT)
  // ═════════════════════════════════════════════════════════════

  // Hostel Step 1: Hostel Information (Image 5)
  const renderHostelStep1 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Hostel Information
      </h2>

      {/* 1. HOSTEL NAME */}
      <Input
        label="HOSTEL NAME *"
        placeholder="e.g. Backpacker Nomad Hostel & Cafe"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
      />

      {/* 2. PROPERTY TYPE (Matching Image 5) */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          PROPERTY TYPE *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {HOSTEL_PROPERTY_TYPES.map((pt) => (
            <RadioPill
              key={pt}
              label={pt}
              selected={form.hostelPropertyType === pt}
              onClick={() => set('hostelPropertyType', pt)}
            />
          ))}
        </div>
      </div>

      {/* 3. LOCATION & ADDRESS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="LOCATION *"
          placeholder="e.g. Indiranagar / Koramangala"
          value={form.locationName}
          onChange={(e) => set('locationName', e.target.value)}
        />
        <Input
          label="ADDRESS *"
          placeholder="e.g. 12th Main Road, 4th Cross"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
        />
      </div>

      {/* 4. CITY & STATE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="CITY *"
          placeholder="e.g. Bengaluru / Goa"
          value={form.city}
          onChange={(e) => set('city', e.target.value)}
        />
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            STATE *
          </label>
          <select
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. PIN CODE */}
      <div className="sm:max-w-[calc(50%-0.5rem)]">
        <Input
          label="PIN CODE *"
          placeholder="e.g. 560038"
          value={form.pinCode}
          onChange={(e) => set('pinCode', e.target.value)}
        />
      </div>

      {/* 6. DESCRIPTION */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          DESCRIPTION
        </label>
        <textarea
          rows={4}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
          placeholder="Describe your hostel vibe, community events, rooftop cafe, common spaces..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      {/* 7. PROPERTY IMAGES */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          PROPERTY IMAGES
        </label>
        <CoverImageUploader
          value={form.imageUrl}
          onChange={(url: string) => set('imageUrl', url)}
          onError={(msg: string | null) => setImageError(msg)}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => {
            if (!form.title.trim()) {
              setError('Hostel Name is required');
              return;
            }
            setError(null);
            setStep(2);
          }}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Room Configuration
        </Button>
      </div>
    </div>
  );

  // Hostel Step 2: Room Configuration (Matches User Prompt)
  const renderHostelStep2 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Room Configuration
          </h2>
          <p className="text-xs text-slate-500">
            Add your dormitories, private rooms, and bed configurations.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addHostelRoom}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Room Type
        </Button>
      </div>

      {/* Room Repeater Cards */}
      <div className="space-y-5">
        {form.hostelRooms.map((room, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 relative"
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Room type {idx + 1}
              </span>
              {form.hostelRooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHostelRoom(idx)}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            {/* ROOM NAME */}
            <Input
              label="ROOM NAME"
              placeholder="e.g. 6 Bed Mixed Dormitory"
              value={room.roomName}
              onChange={(e) => updateHostelRoom(idx, 'roomName', e.target.value)}
            />

            {/* TOTAL BEDS & AVAILABLE BEDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="TOTAL BEDS *"
                type="number"
                min="1"
                value={room.totalBeds}
                onChange={(e) => updateHostelRoom(idx, 'totalBeds', e.target.value)}
              />
              <Input
                label="AVAILABLE BEDS"
                type="number"
                min="0"
                value={room.availableBeds}
                onChange={(e) => updateHostelRoom(idx, 'availableBeds', e.target.value)}
              />
            </div>

            {/* ROOM TYPE & GENDER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  ROOM TYPE
                </label>
                <select
                  value={room.roomType}
                  onChange={(e) => updateHostelRoom(idx, 'roomType', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                >
                  {HOSTEL_ROOM_TYPES.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  GENDER
                </label>
                <select
                  value={room.gender}
                  onChange={(e) => updateHostelRoom(idx, 'gender', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                >
                  {HOSTEL_GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* BATHROOM TYPE & PRICE / NIGHT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  BATHROOM TYPE
                </label>
                <select
                  value={room.bathroomType}
                  onChange={(e) => updateHostelRoom(idx, 'bathroomType', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                >
                  {HOSTEL_BATHROOM_TYPES.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>

              <Input
                label="PRICE / NIGHT (₹)*"
                type="number"
                min="0"
                value={room.pricePerNight}
                onChange={(e) => updateHostelRoom(idx, 'pricePerNight', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Button to add room type */}
      <Button
        type="button"
        variant="outline"
        size="md"
        className="w-full border-dashed border-2 py-3 text-teal-700 hover:border-teal-600"
        onClick={addHostelRoom}
        leftIcon={<Plus className="w-4 h-4" />}
      >
        + Add Room Type
      </Button>

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
          onClick={() => {
            const emptyRoom = form.hostelRooms.find((r) => !r.roomName.trim());
            if (emptyRoom) {
              setError('Please enter a room name for all configured room types.');
              return;
            }
            setError(null);
            setStep(3);
          }}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Amenities
        </Button>
      </div>
    </div>
  );

  // Hostel Step 3: Amenities
  const renderHostelStep3 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Amenities
      </h2>
      <p className="text-xs text-slate-500">
        Select facilities and common amenities available for guests at your hostel.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOSTEL_AMENITIES.map((am) => (
          <CheckboxCard
            key={am}
            label={am}
            checked={form.hostelAmenities.includes(am)}
            onChange={() => toggleArrayItem('hostelAmenities', am)}
          />
        ))}
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
          Continue to Policies
        </Button>
      </div>
    </div>
  );

  // Hostel Step 4: Policies
  const renderHostelStep4 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Policies
      </h2>

      {/* CHECK-IN & CHECK-OUT TIME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="CHECK-IN TIME"
          placeholder="e.g. 12:00 PM"
          value={form.hostelCheckInTime}
          onChange={(e) => set('hostelCheckInTime', e.target.value)}
        />
        <Input
          label="CHECK-OUT TIME"
          placeholder="e.g. 11:00 AM"
          value={form.hostelCheckOutTime}
          onChange={(e) => set('hostelCheckOutTime', e.target.value)}
        />
      </div>

      {/* HOSTEL RULES CHECKBOXES */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">
          Hostel House Rules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HOSTEL_RULES.map((hr) => (
            <CheckboxCard
              key={hr}
              label={hr}
              checked={form.hostelPolicies.includes(hr)}
              onChange={() => toggleArrayItem('hostelPolicies', hr)}
            />
          ))}
        </div>
      </div>

      {/* CANCELLATION POLICY */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          CANCELLATION POLICY
        </label>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
          placeholder="e.g. Free cancellation up to 24 hours before check-in. Non-refundable afterwards."
          value={form.cancellationPolicy}
          onChange={(e) => set('cancellationPolicy', e.target.value)}
        />
      </div>

      {/* Navigation Buttons */}
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
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
          onClick={() => setStep(5)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Review & Submit
        </Button>
      </div>
    </div>
  );

  // Hostel Step 5: Review & Submit
  const renderHostelStep5 = () => {
    const infoRows = [
      { label: 'Listing Type', value: 'Hostel / Room Stay' },
      { label: 'Hostel Name', value: form.title || '—' },
      { label: 'Property Type', value: form.hostelPropertyType },
      { label: 'Location', value: form.locationName || '—' },
      { label: 'Address', value: form.address || '—' },
      { label: 'City & State', value: `${form.city || '—'}, ${form.state}` },
      { label: 'Pin Code', value: form.pinCode || '—' },
      { label: 'Check-in / Check-out', value: `${form.hostelCheckInTime} / ${form.hostelCheckOutTime}` },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Review & Submit Hostel Listing
        </h2>

        {/* 1. Hostel Information Summary */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Hostel Information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {infoRows.map((r) => (
              <div key={r.label} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-500 font-medium">{r.label}:</span>
                <span className="text-slate-900 font-semibold text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Configured Rooms */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Room Configurations ({form.hostelRooms.length})
          </p>
          <div className="space-y-2">
            {form.hostelRooms.map((rm, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                <div>
                  <p className="font-bold text-slate-900">{rm.roomName || `Room ${i + 1}`}</p>
                  <p className="text-xs text-slate-500">
                    {rm.totalBeds} Beds · {rm.roomType} · {rm.gender} · {rm.bathroomType} Bathroom
                  </p>
                </div>
                <span className="font-extrabold text-teal-800">₹{rm.pricePerNight} / night</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Amenities */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Amenities
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {form.hostelAmenities.map((am) => (
              <span key={am} className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-900">
                <Check className="w-3 h-3 text-teal-600" /> {am}
              </span>
            ))}
          </div>
        </div>

        {/* 4. Policies */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
            Policies & Rules
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {form.hostelPolicies.map((p) => (
              <span key={p} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {p}
              </span>
            ))}
          </div>
          {form.cancellationPolicy && (
            <p className="text-xs text-slate-600 pt-1">
              <strong>Cancellation:</strong> {form.cancellationPolicy}
            </p>
          )}
        </div>

        {/* Verification Check & Action Buttons */}
        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setStep(4)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8"
            isLoading={submitting}
            onClick={handleSubmit}
          >
            {verificationStatus !== 'VERIFIED'
              ? 'Verification Required'
              : 'Submit for Approval'}
          </Button>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════
  // STANDARD TOUR PACKAGE STEP RENDERERS
  // ═════════════════════════════════════════════════════════════

  const renderStandardStep1 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Basic Information
      </h2>

      {/* Package Title */}
      <Input
        label="PACKAGE TITLE *"
        placeholder="e.g. 5-Day Kashmir Paradise Tour"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
      />

      {/* Destination & Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LocationSearch
          value={form.destinationInput}
          onChange={(val) => set('destinationInput', val)}
          onSelect={(city, state) => {
            set('destinationCity', city);
            set('destinationState', state);
          }}
        />

        <div className="space-y-1.5">
          <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[15px] text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            <option value="tour">Tour Packages</option>
            <option value="devotional">Devotional Trips</option>
            <option value="foreign">Foreign Trips</option>
            <option value="adventure">Adventures</option>
            <option value="camping">Camping</option>
          </select>
        </div>
      </div>

      {/* Duration & Group Size */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="DURATION (DAYS) *"
          type="number"
          min="1"
          value={form.durationDays}
          onChange={(e) => set('durationDays', e.target.value)}
        />
        <Input
          label="DURATION (NIGHTS)"
          type="number"
          min="0"
          value={form.durationNights}
          onChange={(e) => set('durationNights', e.target.value)}
        />
        <Input
          label="MAX GROUP SIZE *"
          type="number"
          min="1"
          value={form.maxGroupSize}
          onChange={(e) => set('maxGroupSize', e.target.value)}
        />
      </div>

      {/* Cover Image Upload */}
      <div className="space-y-1.5">
        <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          Cover Image <span className="text-rose-500">*</span>
        </label>
        <CoverImageUploader
          value={form.imageUrl}
          onChange={(url: string) => {
            set('imageUrl', url);
            setImageError(null);
          }}
          onError={(msg: string | null) => setImageError(msg)}
        />
        {imageError && (
          <p className="text-xs text-rose-500 font-medium mt-1">{imageError}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          Description
        </label>
        <textarea
          rows={4}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
          placeholder="Detailed overview of the tour experience, landscape, attractions, and cultural highlights..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => {
            if (!form.title.trim()) {
              setError('Package Title is required');
              return;
            }
            if (!form.imageUrl) {
              setImageError('Cover image is required before proceeding.');
              return;
            }
            setError(null);
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
        Pricing & Inclusions
      </h2>

      {/* Price & Discount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="BASE PRICE (₹) *"
          type="number"
          min="0"
          value={form.basePrice}
          onChange={(e) => set('basePrice', e.target.value)}
        />
        <Input
          label="DISCOUNT (%)"
          type="number"
          min="0"
          max="100"
          value={form.discountPercent}
          onChange={(e) => set('discountPercent', e.target.value)}
        />
      </div>

      {/* Final Price Card */}
      <div className="rounded-2xl bg-teal-50/80 border border-teal-200 p-4 sm:p-5 space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
          FINAL DISPLAY PRICE (PER PERSON)
        </p>
        <p className="text-2xl sm:text-3xl font-extrabold text-teal-950">
          ₹{finalPrice.toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-slate-500">
          Travelers will see this discounted price on the marketplace.
        </p>
      </div>

      {/* Inclusions & Exclusions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            INCLUSIONS (ONE PER LINE)
          </label>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
            placeholder="e.g.&#10;Hotel accommodation&#10;Daily breakfast & dinner&#10;Airport transfers"
            value={form.inclusions}
            onChange={(e) => set('inclusions', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            EXCLUSIONS (ONE PER LINE)
          </label>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
            placeholder="e.g.&#10;Flight tickets&#10;Personal expenses&#10;Travel insurance"
            value={form.exclusions}
            onChange={(e) => set('exclusions', e.target.value)}
          />
        </div>
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
          Continue to Itinerary
        </Button>
      </div>
    </div>
  );

  const renderStandardStep3 = () => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">
          Day-by-Day Itinerary
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addDay}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Day
        </Button>
      </div>

      <div className="space-y-4">
        {form.itinerary.map((day, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Day {day.day}
              </span>
              {form.itinerary.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDay(idx)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            <Input
              label="TITLE"
              placeholder={`e.g. Day ${day.day}: Arrival & Hotel Check-in`}
              value={day.title}
              onChange={(e) => updateDay(idx, 'title', e.target.value)}
            />

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                DESCRIPTION
              </label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
                placeholder="Activities, sightseeing points, meals included on this day..."
                value={day.description}
                onChange={(e) => updateDay(idx, 'description', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Cancellation Policy */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          CANCELLATION POLICY
        </label>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
          placeholder="e.g. Full refund up to 7 days before departure. 50% refund between 7 and 3 days."
          value={form.cancellationPolicy}
          onChange={(e) => set('cancellationPolicy', e.target.value)}
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

  const renderStandardStep4 = () => {
    const summaryRows = [
      { label: 'Category', value: form.category },
      { label: 'Destination', value: form.destinationCity ? `${form.destinationCity}, ${form.destinationState}` : form.destinationInput || '—' },
      { label: 'Duration', value: `${form.durationDays} Days / ${form.durationNights} Nights` },
      { label: 'Max Group Size', value: form.maxGroupSize },
      { label: 'Base Price', value: `₹${(parseFloat(form.basePrice) || 0).toLocaleString('en-IN')}` },
      { label: 'Discount', value: parseFloat(form.discountPercent) > 0 ? `${form.discountPercent}%` : 'None' },
      { label: 'Display Price', value: `₹${finalPrice.toLocaleString('en-IN')}` },
      { label: 'Itinerary Days', value: `${form.itinerary.length} Day(s) planned` },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Review & Submit Package
        </h2>

        {/* Cover Image Preview */}
        {form.imageUrl && (
          <div className="relative h-48 w-full overflow-hidden rounded-xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.imageUrl}
              alt="Cover preview"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Package Title */}
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">{form.title}</h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-3">{form.description}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {summaryRows.map((r) => (
            <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">{r.label}:</span>
              <span className="text-slate-900 font-semibold">{r.value}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
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
            variant="primary"
            size="lg"
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8"
            isLoading={submitting}
            onClick={handleSubmit}
          >
            {verificationStatus !== 'VERIFIED'
              ? 'Verification Required'
              : 'Submit for Approval'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── HEADER ───────────────────────────────────────────── */}
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

      {/* ── ERROR MESSAGE ── */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* ── LISTING TYPE TABS (MATCHING IMAGES) ────────────────── */}
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

      {/* ── STEP INDICATOR (MATCHING IMAGES 1, 2, 3, 4, 5) ────── */}
      <div
        className={`grid gap-1.5 sm:gap-2 ${
          steps.length === 5
            ? 'grid-cols-2 sm:grid-cols-5'
            : 'grid-cols-2 sm:grid-cols-4'
        }`}
      >
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

      {/* ── STEP CONTENT DISPATCH ────────────────────────────── */}
      {isCab ? (
        <>
          {step === 1 && renderCabStep1()}
          {step === 2 && renderCabStep2()}
          {step === 3 && renderCabStep3()}
          {step === 4 && renderCabStep4()}
        </>
      ) : isVilla ? (
        <>
          {step === 1 && renderVillaStep1()}
          {step === 2 && renderVillaStep2()}
          {step === 3 && renderVillaStep3()}
          {step === 4 && renderVillaStep4()}
        </>
      ) : isHostel ? (
        <>
          {step === 1 && renderHostelStep1()}
          {step === 2 && renderHostelStep2()}
          {step === 3 && renderHostelStep3()}
          {step === 4 && renderHostelStep4()}
          {step === 5 && renderHostelStep5()}
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
