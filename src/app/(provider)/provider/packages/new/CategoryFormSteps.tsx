'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Utensils,
  Mountain,
  Compass,
  ShieldCheck,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Phone,
  Award,
  Globe,
  Coffee,
  Tag,
  Activity,
  Info,
  X,
  DollarSign,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  Search,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CoverImageUploader } from '@/components/travel/CoverImageUploader';
import { getCategoryDefaultCoverImage } from '@/constants';

// ─── Interfaces ────────────────────────────────────────────────
export interface FoodMenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  foodType: 'veg' | 'non-veg' | 'vegan';
  price: string;
  isSpecial: boolean;
  isBestseller: boolean;
  imageUrl?: string;
}

export interface GuideTourStop {
  id: string;
  stopName: string;
  location: string;
  durationMinutes: string;
  description: string;
  landmark: string;
}

// ─── Constants: Food Experiences ────────────────────────────────
export const FOOD_BUSINESS_TYPES = [
  'Restaurant / Fine Dining',
  'Authentic Regional Dhaba',
  'Heritage Home Dining',
  'Street Food Walk & Trail',
  'Chef Masterclass & Studio',
  'Cafe & Roastery',
  'Bakery & Patisserie',
  'Food Truck & Pop-up',
  'Plantation / Farm Lunch',
] as const;

export const FOOD_FORMATS = [
  'Street Food Walk',
  'Home Dining & Family Meal',
  'Chef Masterclass & Tasting',
  'Royal Thali Feast',
  'Plantation / Farm-to-Table Lunch',
  'Buffet & Live Counters',
  'A La Carte Dining',
] as const;

export const FOOD_CUISINE_OPTIONS = [
  'North Indian',
  'South Indian',
  'Chettinad',
  'Mughlai',
  'Kashmiri Wazwan',
  'Bengali',
  'Gujarati / Rajasthani',
  'Kerala Malabar',
  'Hyderabadi',
  'Street Food & Chaat',
  'Continental',
  'Pan Asian',
  'Seafood Special',
  'Bakery & Desserts',
] as const;

export const FOOD_DIETARY_OPTIONS = [
  'Veg Friendly',
  'Pure Vegetarian (100% Veg)',
  'Non-Veg Available',
  'Vegan Options',
  'Jain Accommodated',
  'Halal Certified',
  'Nut-Free / Allergy Aware',
] as const;

export const FOOD_MENU_CATEGORIES = [
  'Starters & Appetizers',
  'Main Course',
  'Breads & Rice',
  'Desserts & Sweets',
  'Beverages & Refreshers',
  'Chef Specials',
  'Street Food Quick Bites',
  'Traditional Thali Meals',
] as const;

export const FOOD_ALCOHOL_POLICIES = [
  'No Alcohol Served (Family Environment)',
  'Alcohol Served on Menu',
  'BYOB (Bring Your Own Bottle) Allowed',
  'Wine & Beer Only',
] as const;

export const FOOD_BOOKING_SERVICES = [
  'Table Reservation',
  'Guided Food Trail & Tasting Walk',
  'Chef Table & Masterclass',
  'Private Dining / Event Hall',
  'Farm-to-Table Experience',
] as const;

export const FOOD_DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const FOOD_CONFIRMATION_METHODS = [
  'Instant Auto-Confirmation',
  'Provider Manual Approval (Within 1 Hour)',
  'Advance Phone Confirmation Required',
] as const;

// ─── Constants: Adventure Activities ────────────────────────────
export const ADV_CATEGORIES = [
  'Trekking & Hiking',
  'Scuba Diving & Snorkeling',
  'Paragliding & Powered Hang Gliding',
  'White Water Rafting & Kayaking',
  'Bungee Jumping & Giant Swing',
  'Rock Climbing & Rappelling',
  'Ziplining & Aerial Rope Courses',
  'Off-Road ATV & Quad Biking',
  'Desert Safari & Dune Bashing',
  'Skiing & Snowboarding',
  'Surfing & Stand-Up Paddle',
  'Hot Air Ballooning',
] as const;

export const ADV_DIFFICULTY_LEVELS = [
  'Easy (Suitable for Beginners & Families)',
  'Moderate (Basic Fitness Required)',
  'Strenuous (Good Stamina Needed)',
  'Extreme (Technical Skills / Advanced Only)',
] as const;

export const ADV_ENVIRONMENTS = [
  'Outdoor Wilderness',
  'Mountain & High Altitude',
  'Open Water / Coastal',
  'River & Whitewater',
  'Desert Dunes',
  'Aerial / High Airspace',
  'Indoor Adventure Park',
] as const;

export const ADV_PRICING_TYPES = [
  'Per Person',
  'Per Couple',
  'Per Group / Batch',
  'Family Combo (2 Adults + 2 Kids)',
] as const;

export const ADV_EQUIPMENT_OPTIONS = [
  'Safety Helmet & Harness',
  'Life Jacket / Buoyancy Aid',
  'Wetsuit & Scuba Tank / Regulator',
  'Trekking Poles & Crampons',
  'Ropes, Carabiners & Belay Devices',
  'Paraglider Wing & Reserve Chute',
  'GoPro Camera Footage Included',
  'Protective Guards & Gloves',
] as const;

export const ADV_MEDICAL_RESTRICTIONS = [
  'Heart Conditions or Hypertension',
  'Pregnancy',
  'Recent Surgery or Fracture',
  'Severe Asthma or Respiratory Conditions',
  'Back / Spine / Neck Ailments',
  'Epilepsy or Vertigo',
  'None / General Good Health',
] as const;

export const ADV_SWIMMING_REQUIREMENTS = [
  'Not Required (Life Jacket Provided)',
  'Basic Swimming (Float and Tread Water)',
  'Intermediate Swimming (100m without support)',
] as const;

export const ADV_INSURANCE_OPTIONS = [
  'Comprehensive Adventure Accidental Coverage Included',
  'Basic First Aid Support (Personal Insurance Recommended)',
  'Optional Add-on Insurance Available at Site',
] as const;

export const ADV_RISK_LEVELS = [
  'Low (Fully Controlled Environment)',
  'Moderate (Standard Outdoor Risk)',
  'High (Requires Safety Briefing & Gear)',
  'Extreme (Mandatory Waiver & High Adrenaline)',
] as const;

// ─── Constants: Local Guides ────────────────────────────────────
export const GUIDE_SPECIALIZATIONS = [
  'Heritage, Monuments & Archaeology',
  'Spiritual, Temples & Sacred Rituals',
  'Culinary, Street Food & Spice Trails',
  'Architecture, Havelis & Colonial Era',
  'Nature, Birdwatching & Wildlife',
  'Photography & Visual Walks',
  'Modern City, Nightlife & Hidden Gems',
  'Tribal Art & Indigenous Culture',
] as const;

export const GUIDE_LANGUAGES = [
  'English',
  'Hindi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Gujarati',
  'French',
  'German',
  'Spanish',
  'Italian',
  'Japanese',
  'Russian',
] as const;

export const GUIDE_TYPES = [
  'Individual Local Guide',
  'Registered Tour Agency / Co-op',
  'Certified Heritage Storyteller',
  'Academic Historian / Professor',
] as const;

export const GUIDE_CERTIFICATION_TYPES = [
  'Ministry of Tourism (Govt of India / Regional)',
  'State Tourism Department Certified',
  'Archaeological Survey of India (ASI) Licensed',
  'Incredible India Badge Holder',
  'Local Cultural Association Accredited',
  'Independent Experienced Local Historian',
  'None',
] as const;

export const GUIDE_TOUR_FORMATS = [
  'Private Guided Tour (Exclusive for booked party)',
  'Shared Small Group Walk (Max 10-12 guests)',
  'VIP Custom Itinerary Walk',
] as const;

export const GUIDE_PRICING_TYPES = [
  'Per Hour',
  'Half Day (Up to 4 Hours)',
  'Full Day (Up to 8 Hours)',
  'Fixed Tour Route Package',
] as const;

export const GUIDE_TRANSPORT_OPTIONS = [
  'Walking Tour (No Transport Needed)',
  'Public / Auto-Rickshaw Hops (At Actuals)',
  'Private AC Vehicle Included in Tour Fee',
  'Customer Arranges Vehicle',
] as const;

export const GUIDE_TICKET_HANDLING = [
  'Customer Buys Directly at Monument Counter',
  'Guide Pre-Books Tickets (Included in Package Price)',
  'Guide Facilitates Fast-Track / QR Entry',
] as const;

// ─── Reusable UI Subcomponents ─────────────────────────────────

export function MultiSelectPills({
  options,
  selected,
  onChange,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((x) => x !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSel = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              isSel
                ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-xs'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>{opt}</span>
            {isSel && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

export function RadioPill({
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

export function CheckboxCard({
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

export interface SharedLocationSearchProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (city: string, state: string) => void;
}

export function DestinationLocationInput({
  value,
  onChange,
  onSelect,
}: SharedLocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const res = await fetch(
        `/api/destinations/search?q=${encodeURIComponent(q)}&limit=6`,
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
        Destination / City <span className="text-rose-500">*</span>
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

// ════════════════════════════════════════════════════════════════
// 1. FOOD EXPERIENCES (4 STEPS)
// ════════════════════════════════════════════════════════════════

export function FoodStep1({
  form,
  set,
  setForm,
  categoryStore,
  setImageError,
  setError,
  setStep,
}: {
  form: any;
  set: (k: any, v: any) => void;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  categoryStore: React.MutableRefObject<any>;
  setImageError: (m: string | null) => void;
  setError: (m: string | null) => void;
  setStep: (s: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-teal-600" />
            Restaurant & Food Business Details
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 1 of 4: Provide complete business location, cuisines, dining format, and authentic details.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Food Experiences
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="RESTAURANT / EXPERIENCE NAME *"
          placeholder="e.g. Royal Thali Palace & Heritage Dining"
          value={form.title}
          onChange={(e) => {
            set('title', e.target.value);
            set('foodRestaurantName', e.target.value);
          }}
        />

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            FOOD BUSINESS TYPE *
          </label>
          <select
            value={form.foodBusinessType}
            onChange={(e) => set('foodBusinessType', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {FOOD_BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DestinationLocationInput
          value={form.destinationInput}
          onChange={(val) => set('destinationInput', val)}
          onSelect={(city, state) => {
            set('destinationCity', city);
            set('destinationState', state);
          }}
        />

        <Input
          label="GOOGLE MAPS LOCATION LINK (OPTIONAL)"
          placeholder="https://maps.google.com/?q=..."
          value={form.foodGoogleMapsUrl}
          onChange={(e) => set('foodGoogleMapsUrl', e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          FULL BUSINESS ADDRESS *
        </label>
        <textarea
          rows={2}
          placeholder="Door No, Street Name, Landmark, Area, City, Pin Code"
          value={form.foodAddress}
          onChange={(e) => set('foodAddress', e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          RESTAURANT / CULINARY STORY DESCRIPTION *
        </label>
        <textarea
          rows={4}
          placeholder="Describe your culinary heritage, chef philosophy, authentic regional recipes, ambiance, and dining specialties..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            FOOD EXPERIENCE FORMAT *
          </label>
          <select
            value={form.foodFormat}
            onChange={(e) => set('foodFormat', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {FOOD_FORMATS.map((fmt) => (
              <option key={fmt} value={fmt}>{fmt}</option>
            ))}
          </select>
        </div>

        <Input
          label="OPENING TIME *"
          type="time"
          value={form.foodOpeningTime}
          onChange={(e) => set('foodOpeningTime', e.target.value)}
        />

        <Input
          label="CLOSING TIME *"
          type="time"
          value={form.foodClosingTime}
          onChange={(e) => set('foodClosingTime', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="DIRECT BUSINESS CONTACT NUMBER *"
          placeholder="+91 98765 43210"
          value={form.foodContactNumber}
          onChange={(e) => set('foodContactNumber', e.target.value)}
        />
        <Input
          label="WHATSAPP NUMBER FOR RESERVATIONS"
          placeholder="+91 98765 43210"
          value={form.foodWhatsappNumber}
          onChange={(e) => set('foodWhatsappNumber', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          FOOD CUISINE TYPES (SELECT ALL THAT APPLY) *
        </label>
        <MultiSelectPills
          options={FOOD_CUISINE_OPTIONS}
          selected={form.foodCuisines}
          onChange={(next) => set('foodCuisines', next)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          DIETARY OPTIONS ACCOMMODATED *
        </label>
        <MultiSelectPills
          options={FOOD_DIETARY_OPTIONS}
          selected={form.foodDietaryOptions}
          onChange={(next) => set('foodDietaryOptions', next)}
        />
      </div>

      <div className="space-y-1.5 pt-2">
        <CoverImageUploader
          key={`food_cover_uploader_${form.listingType}`}
          label="Restaurant Cover & Dining Gallery Photos *"
          category="food"
          required={true}
          images={form.images}
          value={form.imageUrl}
          onChange={(val, all) => {
            const list = Array.isArray(val) ? val : all || [val].filter(Boolean);
            setForm((prev: any) => {
              const next = {
                ...prev,
                images: list,
                imageUrl: list[0] || '',
              };
              categoryStore.current[next.listingType] = next;
              return next;
            });
            setImageError(null);
          }}
          onError={(msg: string | null) => setImageError(msg)}
        />
      </div>

      <Input
        label="RESTAURANT LOGO IMAGE URL (OPTIONAL)"
        placeholder="https://images.unsplash.com/... or uploaded brand logo"
        value={form.foodLogoUrl}
        onChange={(e) => set('foodLogoUrl', e.target.value)}
      />

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => {
            if (!form.title.trim()) {
              setError('Restaurant / Experience Name is required');
              return;
            }
            if (!form.foodAddress.trim()) {
              setError('Full Business Address is required');
              return;
            }
            if (form.foodCuisines.length === 0) {
              setError('Please select at least one Cuisine Type');
              return;
            }
            if (!form.imageUrl && form.images.length === 0) {
              const defaultImage = getCategoryDefaultCoverImage('food');
              setForm((prev: any) => ({
                ...prev,
                images: [defaultImage],
                imageUrl: defaultImage,
              }));
            }
            setError(null);
            setStep(2);
          }}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Menu & Pricing
        </Button>
      </div>
    </div>
  );
}

export function FoodStep2({
  form,
  set,
  newFoodItem,
  setNewFoodItem,
  addFoodItem,
  removeFoodItem,
  setError,
  setStep,
}: {
  form: any;
  set: (k: any, v: any) => void;
  newFoodItem: FoodMenuItem;
  setNewFoodItem: React.Dispatch<React.SetStateAction<FoodMenuItem>>;
  addFoodItem: () => void;
  removeFoodItem: (id: string) => void;
  setError: (m: string | null) => void;
  setStep: (s: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-600" />
            Menu & Food Pricing
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 2 of 4: Add signature menu items, courses, pricing structures, and dining policies.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Step 2 / 4
        </span>
      </div>

      {/* Add Food Item Sub-form */}
      <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-4">
        <h3 className="text-sm font-bold text-teal-900 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-teal-700" />
          Add Signature Menu Item / Tasting Course
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="FOOD ITEM NAME"
            placeholder="e.g. Kashmiri Dum Aloo"
            value={newFoodItem.name}
            onChange={(e) => setNewFoodItem((prev) => ({ ...prev, name: e.target.value }))}
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              MENU CATEGORY
            </label>
            <select
              value={newFoodItem.category}
              onChange={(e) => setNewFoodItem((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            >
              {FOOD_MENU_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
              FOOD TYPE
            </label>
            <select
              value={newFoodItem.foodType}
              onChange={(e) => setNewFoodItem((prev) => ({ ...prev, foodType: e.target.value as any }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="veg">🟢 Veg</option>
              <option value="non-veg">🔴 Non-Veg</option>
              <option value="vegan">🌱 Vegan</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="PRICE (₹) *"
            type="number"
            placeholder="350"
            value={newFoodItem.price}
            onChange={(e) => setNewFoodItem((prev) => ({ ...prev, price: e.target.value }))}
          />
          <Input
            label="FOOD ITEM IMAGE URL (OPTIONAL)"
            placeholder="https://images.unsplash.com/photo-..."
            value={newFoodItem.imageUrl || ''}
            onChange={(e) => setNewFoodItem((prev) => ({ ...prev, imageUrl: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            ITEM DESCRIPTION & INGREDIENTS
          </label>
          <input
            type="text"
            placeholder="e.g. Slow-cooked baby potatoes in rich aromatic yogurt gravy with fennel and ginger"
            value={newFoodItem.description}
            onChange={(e) => setNewFoodItem((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newFoodItem.isSpecial}
                onChange={(e) => setNewFoodItem((prev) => ({ ...prev, isSpecial: e.target.checked }))}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Chef&apos;s Special
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newFoodItem.isBestseller}
                onChange={(e) => setNewFoodItem((prev) => ({ ...prev, isBestseller: e.target.checked }))}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Bestseller
            </label>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFoodItem}
            className="border-teal-600 text-teal-700 hover:bg-teal-50 font-bold"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + Add Food Item
          </Button>
        </div>
      </div>

      {/* Added Food Items Table */}
      {form.foodMenuItems.length > 0 ? (
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            MENU ITEMS ADDED ({form.foodMenuItems.length})
          </label>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {form.foodMenuItems.map((item: FoodMenuItem) => (
              <div key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50 text-sm">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>{item.foodType === 'veg' ? '🟢' : item.foodType === 'vegan' ? '🌱' : '🔴'}</span>
                    <span>{item.name}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 font-medium">
                      {item.category}
                    </span>
                    {item.isSpecial && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800 font-semibold">
                        Special
                      </span>
                    )}
                    {item.isBestseller && (
                      <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] text-teal-800 font-semibold">
                        Bestseller
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-teal-700">₹{item.price}</span>
                  <button
                    type="button"
                    onClick={() => removeFoodItem(item.id)}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
          No individual food items added yet. You can also specify an overall experience base price below.
        </div>
      )}

      {/* Experience & General Dining Pricing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
        <Input
          label="BASE EXPERIENCE / BUFFET PRICE (₹) *"
          type="number"
          placeholder="e.g. 799"
          value={form.foodBasePrice}
          onChange={(e) => {
            set('foodBasePrice', e.target.value);
            set('basePrice', e.target.value);
          }}
        />

        <Input
          label="PRICE PER PERSON (₹)"
          type="number"
          placeholder="e.g. 799"
          value={form.foodPricePerPerson}
          onChange={(e) => set('foodPricePerPerson', e.target.value)}
        />

        <Input
          label="MINIMUM ORDER AMOUNT (₹)"
          type="number"
          placeholder="e.g. 400"
          value={form.foodMinOrderAmount}
          onChange={(e) => set('foodMinOrderAmount', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            TAXES (GST)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <RadioPill
              label="Included"
              selected={form.foodTaxesIncluded === 'Included'}
              onClick={() => set('foodTaxesIncluded', 'Included')}
            />
            <RadioPill
              label="Excluded"
              selected={form.foodTaxesIncluded === 'Excluded'}
              onClick={() => set('foodTaxesIncluded', 'Excluded')}
            />
          </div>
        </div>

        <Input
          label="DISCOUNT / SPECIAL OFFER (%)"
          type="number"
          min="0"
          max="80"
          placeholder="e.g. 10"
          value={form.foodDiscountPercent}
          onChange={(e) => {
            set('foodDiscountPercent', e.target.value);
            set('discountPercent', e.target.value);
          }}
        />

        <Input
          label="EXTRA CHARGES (IF APPLICABLE)"
          placeholder="e.g. 5% Service Charge"
          value={form.foodExtraCharges}
          onChange={(e) => set('foodExtraCharges', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="NUMBER OF TASTINGS / COURSES"
          placeholder="e.g. 6 Tastings & 2 Desserts"
          value={form.foodTastingCount}
          onChange={(e) => set('foodTastingCount', e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            ALCOHOL POLICY *
          </label>
          <select
            value={form.foodAlcoholPolicy}
            onChange={(e) => set('foodAlcoholPolicy', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {FOOD_ALCOHOL_POLICIES.map((pol) => (
              <option key={pol} value={pol}>{pol}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center pt-6">
          <CheckboxCard
            label="Beverages & Drinking Water Included"
            checked={form.foodBeveragesIncluded}
            onChange={() => set('foodBeveragesIncluded', !form.foodBeveragesIncluded)}
          />
        </div>
      </div>

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
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => {
            if (!form.foodBasePrice && !form.foodPricePerPerson && form.foodMenuItems.length === 0) {
              setError('Please provide at least a Base Price, Price Per Person, or add Menu Items');
              return;
            }
            setError(null);
            setStep(3);
          }}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Booking & Availability
        </Button>
      </div>
    </div>
  );
}

export function FoodStep3({
  form,
  set,
  setError,
  setStep,
}: {
  form: any;
  set: (k: any, v: any) => void;
  setError: (m: string | null) => void;
  setStep: (s: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Online Booking & Availability
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 3 of 4: Setup reservation tables, party limits, time slots, and hygiene compliance.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Step 3 / 4
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            BOOKING SERVICE TYPE *
          </label>
          <select
            value={form.foodBookingService}
            onChange={(e) => set('foodBookingService', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {FOOD_BOOKING_SERVICES.map((srv) => (
              <option key={srv} value={srv}>{srv}</option>
            ))}
          </select>
        </div>

        <Input
          label="TOTAL TABLE / SEATING CAPACITY *"
          type="number"
          placeholder="e.g. 40"
          value={form.foodTableCapacity}
          onChange={(e) => set('foodTableCapacity', e.target.value)}
        />

        <Input
          label="AVAILABLE TABLES FOR RESERVATION"
          type="number"
          placeholder="e.g. 10"
          value={form.foodAvailableTables}
          onChange={(e) => set('foodAvailableTables', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="MAXIMUM PARTY SIZE PER BOOKING *"
          type="number"
          placeholder="e.g. 12"
          value={form.foodMaxPartySize}
          onChange={(e) => {
            set('foodMaxPartySize', e.target.value);
            set('maxGroupSize', e.target.value);
          }}
        />

        <Input
          label="ADVANCE BOOKING NOTICE"
          placeholder="e.g. 2 hours before / 1 day in advance"
          value={form.foodAdvanceBooking}
          onChange={(e) => set('foodAdvanceBooking', e.target.value)}
        />

        <Input
          label="TYPICAL RESERVATION DURATION"
          placeholder="e.g. 90 minutes / 2 hours"
          value={form.foodReservationDuration}
          onChange={(e) => set('foodReservationDuration', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          OPERATIONAL DAYS OF THE WEEK *
        </label>
        <MultiSelectPills
          options={FOOD_DAYS_OF_WEEK}
          selected={form.foodAvailableDays}
          onChange={(next) => set('foodAvailableDays', next)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="MORNING / LUNCH TIME SLOTS"
          placeholder="e.g. 12:00 PM, 01:00 PM, 02:00 PM"
          value={form.foodMorningSlots}
          onChange={(e) => set('foodMorningSlots', e.target.value)}
        />

        <Input
          label="EVENING / DINNER TIME SLOTS"
          placeholder="e.g. 07:00 PM, 08:30 PM, 09:45 PM"
          value={form.foodEveningSlots}
          onChange={(e) => set('foodEveningSlots', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="STARTING / MEETING LANDMARK (FOR WALKS)"
          placeholder="e.g. Near Jama Masjid Gate 3 / Restaurant Front Desk"
          value={form.foodMeetingLandmark}
          onChange={(e) => set('foodMeetingLandmark', e.target.value)}
        />

        <Input
          label="WALKING DISTANCE (FOR FOOD TRAILS)"
          placeholder="e.g. 1.5 km easy stroll"
          value={form.foodWalkingDistance}
          onChange={(e) => set('foodWalkingDistance', e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          SPECIAL REQUESTS & ALLERGY PROTOCOLS
        </label>
        <input
          type="text"
          placeholder="e.g. Jain food prepared upon 1-hour prior notice, nut-free kitchen zone, high chairs available"
          value={form.foodSpecialRequests}
          onChange={(e) => set('foodSpecialRequests', e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Food Safety & Hygiene Information
          </span>
          <span className="text-[11px] text-slate-500 font-medium">FSSAI Standards</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CheckboxCard
            label="FSSAI Food Safety Compliance Registered"
            checked={form.foodFssaiCompliance}
            onChange={() => set('foodFssaiCompliance', !form.foodFssaiCompliance)}
          />

          <Input
            label="FSSAI REGISTRATION / LICENSE NUMBER (OPTIONAL)"
            placeholder="e.g. 10019011000123"
            value={form.foodFssaiNumber}
            onChange={(e) => set('foodFssaiNumber', e.target.value)}
          />
        </div>

        <Input
          label="DRINKING WATER & HYGIENE PROTOCOLS"
          placeholder="e.g. Complimentary packaged mineral water provided, UV-filtered kitchen water, sanitized dining tables"
          value={form.foodHygieneInfo}
          onChange={(e) => set('foodHygieneInfo', e.target.value)}
        />
      </div>

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
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => {
            if (form.foodAvailableDays.length === 0) {
              setError('Please select at least one Operational Day of the week');
              return;
            }
            setError(null);
            setStep(4);
          }}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Policies & Submit
        </Button>
      </div>
    </div>
  );
}

export function FoodStep4({
  form,
  set,
  setStep,
  verificationStatus,
  submitting,
  onSubmit,
}: {
  form: any;
  set: (k: any, v: any) => void;
  setStep: (s: number) => void;
  verificationStatus: string | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Policies, Verification & Submit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 4 of 4: Review reservation policies, verify business credentials, and submit for approval.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Final Review
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            CANCELLATION POLICY *
          </label>
          <textarea
            rows={2}
            value={form.foodCancellationPolicy}
            onChange={(e) => {
              set('foodCancellationPolicy', e.target.value);
              set('cancellationPolicy', e.target.value);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            REFUND POLICY
          </label>
          <textarea
            rows={2}
            value={form.foodRefundPolicy}
            onChange={(e) => set('foodRefundPolicy', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="LATE ARRIVAL POLICY"
          value={form.foodLateArrivalPolicy}
          onChange={(e) => set('foodLateArrivalPolicy', e.target.value)}
        />

        <Input
          label="NO-SHOW POLICY"
          value={form.foodNoShowPolicy}
          onChange={(e) => set('foodNoShowPolicy', e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            CONFIRMATION METHOD
          </label>
          <select
            value={form.foodConfirmationMethod}
            onChange={(e) => set('foodConfirmationMethod', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {FOOD_CONFIRMATION_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Business Verification & Tax Info (Optional)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="GSTIN NUMBER"
            placeholder="e.g. 33AAAAA0000A1Z5"
            value={form.foodGstin}
            onChange={(e) => set('foodGstin', e.target.value)}
          />
          <Input
            label="FSSAI LICENSE ID"
            placeholder="e.g. 10019011000123"
            value={form.foodFssaiNumber}
            onChange={(e) => set('foodFssaiNumber', e.target.value)}
          />
          <Input
            label="TRADE REGISTRATION / CIN"
            placeholder="e.g. UDYAM-TN-01-00000"
            value={form.foodBusinessRegDetails}
            onChange={(e) => set('foodBusinessRegDetails', e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Final Listing Summary Preview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <p><span className="text-slate-500 font-medium">Restaurant Name:</span> <span className="font-bold text-slate-900">{form.title || form.foodRestaurantName}</span></p>
            <p><span className="text-slate-500 font-medium">Business Type:</span> <span className="font-semibold text-slate-800">{form.foodBusinessType} ({form.foodFormat})</span></p>
            <p><span className="text-slate-500 font-medium">Destination:</span> <span className="font-semibold text-slate-800">{form.destinationCity || form.destinationInput}, {form.destinationState}</span></p>
            <p><span className="text-slate-500 font-medium">Cuisines:</span> <span className="font-semibold text-slate-800">{form.foodCuisines.join(', ') || 'Regional'}</span></p>
          </div>
          <div className="space-y-1.5">
            <p><span className="text-slate-500 font-medium">Price:</span> <span className="font-bold text-teal-700">₹{form.foodBasePrice || form.basePrice || 'N/A'}</span></p>
            <p><span className="text-slate-500 font-medium">Menu Items:</span> <span className="font-semibold text-slate-800">{form.foodMenuItems.length} item(s) configured</span></p>
            <p><span className="text-slate-500 font-medium">Operating Hours:</span> <span className="font-semibold text-slate-800">{form.foodOpeningTime} - {form.foodClosingTime}</span></p>
            <p><span className="text-slate-500 font-medium">Max Party Size:</span> <span className="font-semibold text-slate-800">{form.foodMaxPartySize || '12'} Guests</span></p>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <CheckboxCard
          label="I agree to VibeMiles Provider Terms, FSSAI hygiene standards, and guest dining service commitment."
          checked={termsAccepted}
          onChange={() => setTermsAccepted(!termsAccepted)}
        />
      </div>

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
          onClick={onSubmit}
        >
          {verificationStatus !== 'VERIFIED'
            ? 'Verification Required'
            : 'Submit for Approval'}
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. ADVENTURE ACTIVITIES (4 STEPS)
// ════════════════════════════════════════════════════════════════

export function AdventureStep1({
  form,
  set,
  setForm,
  categoryStore,
  setImageError,
  setError,
  setStep,
}: {
  form: any;
  set: (k: any, v: any) => void;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  categoryStore: React.MutableRefObject<any>;
  setImageError: (m: string | null) => void;
  setError: (m: string | null) => void;
  setStep: (s: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mountain className="w-5 h-5 text-teal-600" />
            Adventure Activity Details
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 1 of 4: Setup activity type, terrain, difficulty levels, duration, and safety overview.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Adventure
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="ACTIVITY TITLE *"
          placeholder="e.g. White Water River Rafting - Grade IV Rapids"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            ACTIVITY CATEGORY *
          </label>
          <select
            value={form.advCategory}
            onChange={(e) => set('advCategory', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {ADV_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DestinationLocationInput
          value={form.destinationInput}
          onChange={(val) => set('destinationInput', val)}
          onSelect={(city, state) => {
            set('destinationCity', city);
            set('destinationState', state);
          }}
        />

        <Input
          label="ACTIVITY BASE / LAUNCH POINT NAME *"
          placeholder="e.g. Shivpuri Launch Point / Marine Dive Pier"
          value={form.advLocationName}
          onChange={(e) => set('advLocationName', e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          ACTIVITY DESCRIPTION & THRILL HIGHLIGHTS *
        </label>
        <textarea
          rows={4}
          placeholder="Describe the adventure rush, rapids or flight duration, landscape views, instructor credentials, and what makes it extraordinary..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="ACTIVITY DURATION *"
          placeholder="e.g. 3 Hours / Half Day"
          value={form.advDurationHours}
          onChange={(e) => set('advDurationHours', e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            DIFFICULTY LEVEL *
          </label>
          <select
            value={form.advDifficulty}
            onChange={(e) => set('advDifficulty', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {ADV_DIFFICULTY_LEVELS.map((diff) => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            ENVIRONMENT / TERRAIN *
          </label>
          <select
            value={form.advEnvironment}
            onChange={(e) => set('advEnvironment', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {ADV_ENVIRONMENTS.map((env) => (
              <option key={env} value={env}>{env}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="MINIMUM PARTICIPANT AGE (YEARS) *"
          type="number"
          placeholder="e.g. 12"
          value={form.advMinAge}
          onChange={(e) => set('advMinAge', e.target.value)}
        />

        <Input
          label="MINIMUM PARTICIPANTS PER BOOKING"
          type="number"
          placeholder="e.g. 1"
          value={form.advMinParticipants}
          onChange={(e) => set('advMinParticipants', e.target.value)}
        />

        <Input
          label="MAXIMUM PARTICIPANTS PER BATCH *"
          type="number"
          placeholder="e.g. 15"
          value={form.advMaxParticipants}
          onChange={(e) => {
            set('advMaxParticipants', e.target.value);
            set('maxGroupSize', e.target.value);
          }}
        />
      </div>

      <div className="space-y-1.5 pt-2">
        <CoverImageUploader
          key={`adv_cover_uploader_${form.listingType}`}
          label="Activity Cover & Action Gallery Photos *"
          category="adventure"
          required={true}
          images={form.images}
          value={form.imageUrl}
          onChange={(val, all) => {
            const list = Array.isArray(val) ? val : all || [val].filter(Boolean);
            setForm((prev: any) => {
              const next = {
                ...prev,
                images: list,
                imageUrl: list[0] || '',
              };
              categoryStore.current[next.listingType] = next;
              return next;
            });
            setImageError(null);
          }}
          onError={(msg: string | null) => setImageError(msg)}
        />
      </div>

      <Input
        label="GOOGLE MAPS LOCATION LINK (OPTIONAL)"
        placeholder="https://maps.google.com/?q=..."
        value={form.advGoogleMapsUrl}
        onChange={(e) => set('advGoogleMapsUrl', e.target.value)}
      />

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => {
            if (!form.title.trim()) {
              setError('Activity Title is required');
              return;
            }
            if (!form.advLocationName.trim()) {
              setError('Base / Launch Point Name is required');
              return;
            }
            if (!form.imageUrl && form.images.length === 0) {
              const defaultImage = getCategoryDefaultCoverImage('adventure');
              setForm((prev: any) => ({
                ...prev,
                images: [defaultImage],
                imageUrl: defaultImage,
              }));
            }
            setError(null);
            setStep(2);
          }}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Pricing & Gear
        </Button>
      </div>
    </div>
  );
}

export function AdventureStep2({
  form,
  set,
  setStep,
}: {
  form: any;
  set: (k: any, v: any) => void;
  setStep: (s: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-600" />
            Pricing & Gear
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 2 of 4: Set ticket pricing, group packages, included safety equipment, and instructor credentials.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Step 2 / 4
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="PRICE PER PERSON (₹) *"
          type="number"
          placeholder="e.g. 1499"
          value={form.advPricePerPerson}
          onChange={(e) => {
            set('advPricePerPerson', e.target.value);
            set('basePrice', e.target.value);
          }}
        />

        <Input
          label="ADULT PRICE (₹)"
          type="number"
          placeholder="e.g. 1499"
          value={form.advAdultPrice}
          onChange={(e) => set('advAdultPrice', e.target.value)}
        />

        <Input
          label="CHILD PRICE (₹)"
          type="number"
          placeholder="e.g. 999"
          value={form.advChildPrice}
          onChange={(e) => set('advChildPrice', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="GROUP PACKAGE PRICE (FOR 5+ PERSONS)"
          type="number"
          placeholder="e.g. 6500"
          value={form.advGroupPrice}
          onChange={(e) => set('advGroupPrice', e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            PRICING MODEL *
          </label>
          <select
            value={form.advPricingType}
            onChange={(e) => set('advPricingType', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {ADV_PRICING_TYPES.map((pt) => (
              <option key={pt} value={pt}>{pt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            TAXES (GST)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <RadioPill
              label="Included"
              selected={form.advTaxesIncluded === 'Included'}
              onClick={() => set('advTaxesIncluded', 'Included')}
            />
            <RadioPill
              label="Excluded"
              selected={form.advTaxesIncluded === 'Excluded'}
              onClick={() => set('advTaxesIncluded', 'Excluded')}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          EQUIPMENT INCLUDED IN TICKET PRICE *
        </label>
        <MultiSelectPills
          options={ADV_EQUIPMENT_OPTIONS}
          selected={form.advEquipmentIncluded}
          onChange={(next) => set('advEquipmentIncluded', next)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            SAFETY GEAR INCLUDED DETAILS
          </label>
          <input
            type="text"
            placeholder="e.g. CE-certified high-impact helmet, 4-point harness, life jacket (50N buoyancy)"
            value={form.advSafetyGearIncluded}
            onChange={(e) => set('advSafetyGearIncluded', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            EXTRA EQUIPMENT RENTAL CHARGES
          </label>
          <input
            type="text"
            placeholder="e.g. GoPro rental ₹500, Wetsuit upgrade ₹300"
            value={form.advExtraEquipmentCharges}
            onChange={(e) => set('advExtraEquipmentCharges', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            CERTIFIED INSTRUCTOR / TRAINER AVAILABLE?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <RadioPill
              label="Yes, Certified"
              selected={form.advInstructorAvailable === 'Yes'}
              onClick={() => set('advInstructorAvailable', 'Yes')}
            />
            <RadioPill
              label="Self-Guided"
              selected={form.advInstructorAvailable === 'No'}
              onClick={() => set('advInstructorAvailable', 'No')}
            />
          </div>
        </div>

        <Input
          label="INSTRUCTOR-TO-PARTICIPANT RATIO"
          placeholder="e.g. 1 Instructor per 4 Participants"
          value={form.advInstructorRatio}
          onChange={(e) => set('advInstructorRatio', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          BASE CAMP AMENITIES & FACILITIES
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CheckboxCard
            label="Changing Rooms & Showers"
            checked={form.advChangingRoom}
            onChange={() => set('advChangingRoom', !form.advChangingRoom)}
          />
          <CheckboxCard
            label="Secure Locker Facility"
            checked={form.advLockerFacility}
            onChange={() => set('advLockerFacility', !form.advLockerFacility)}
          />
          <CheckboxCard
            label="Complimentary Refreshments"
            checked={form.advRefreshments}
            onChange={() => set('advRefreshments', !form.advRefreshments)}
          />
        </div>
      </div>

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
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => setStep(3)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Schedule & Plan
        </Button>
      </div>
    </div>
  );
}

export function AdventureStep3({
  form,
  set,
  setStep,
}: {
  form: any;
  set: (k: any, v: any) => void;
  setStep: (s: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Schedule & Plan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 3 of 4: Setup daily batch slots, reporting instructions, dress code, and seasonal availability.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Step 3 / 4
        </span>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          OPERATIONAL DAYS OF THE WEEK *
        </label>
        <MultiSelectPills
          options={FOOD_DAYS_OF_WEEK}
          selected={form.advAvailableDays}
          onChange={(next) => set('advAvailableDays', next)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="DAILY BATCH TIME SLOTS *"
          placeholder="e.g. 06:00 AM, 09:30 AM, 02:00 PM"
          value={form.advBatchSlots}
          onChange={(e) => set('advBatchSlots', e.target.value)}
        />

        <Input
          label="MAX PARTICIPANTS PER BATCH SLOT"
          type="number"
          placeholder="e.g. 8"
          value={form.advMaxPerSlot}
          onChange={(e) => set('advMaxPerSlot', e.target.value)}
        />

        <Input
          label="BOOKING CUTOFF TIME"
          placeholder="e.g. 12 hours before slot"
          value={form.advBookingCutoff}
          onChange={(e) => set('advBookingCutoff', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="CHECK-IN / REPORTING TIME *"
          placeholder="e.g. 30 minutes prior to slot time"
          value={form.advCheckinTime}
          onChange={(e) => set('advCheckinTime', e.target.value)}
        />

        <Input
          label="SEASONAL AVAILABILITY WINDOW"
          placeholder="e.g. September to June (Monsoon closed)"
          value={form.advSeasonalAvailability}
          onChange={(e) => set('advSeasonalAvailability', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            MANDATORY DRESS CODE
          </label>
          <input
            type="text"
            placeholder="e.g. Quick-dry t-shirt, shorts/tights, strap sandals or running shoes"
            value={form.advDressCode}
            onChange={(e) => set('advDressCode', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            WHAT CUSTOMERS SHOULD BRING
          </label>
          <input
            type="text"
            placeholder="e.g. Change of clothes, towel, sunscreen, water bottle, dry bag"
            value={form.advWhatToBring}
            onChange={(e) => set('advWhatToBring', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            WEATHER RESTRICTIONS & CONDITIONS
          </label>
          <input
            type="text"
            placeholder="e.g. Activity cancelled during heavy rainfall, thunder, or high wind gusts above 25 knots"
            value={form.advWeatherRestrictions}
            onChange={(e) => set('advWeatherRestrictions', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            TRANSPORTATION TO LAUNCH SITE AVAILABLE?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <RadioPill
              label="Yes, Included"
              selected={form.advTransportationAvailable === 'Yes'}
              onClick={() => set('advTransportationAvailable', 'Yes')}
            />
            <RadioPill
              label="No (Self-Arrival)"
              selected={form.advTransportationAvailable === 'No'}
              onClick={() => set('advTransportationAvailable', 'No')}
            />
          </div>
        </div>
      </div>

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
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => setStep(4)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Safety & Policies
        </Button>
      </div>
    </div>
  );
}

export function AdventureStep4({
  form,
  set,
  setStep,
  verificationStatus,
  submitting,
  onSubmit,
}: {
  form: any;
  set: (k: any, v: any) => void;
  setStep: (s: number) => void;
  verificationStatus: string | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Safety, Policies & Review
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 4 of 4: Medical criteria, insurance coverage, emergency response, and final approval submission.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Safety Review
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            RISK LEVEL CLASSIFICATION *
          </label>
          <select
            value={form.advRiskLevel}
            onChange={(e) => set('advRiskLevel', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {ADV_RISK_LEVELS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            SWIMMING PROFICIENCY *
          </label>
          <select
            value={form.advSwimmingRequirement}
            onChange={(e) => set('advSwimmingRequirement', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {ADV_SWIMMING_REQUIREMENTS.map((sw) => (
              <option key={sw} value={sw}>{sw}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            INSURANCE COVERAGE *
          </label>
          <select
            value={form.advInsuranceCoverage}
            onChange={(e) => set('advInsuranceCoverage', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {ADV_INSURANCE_OPTIONS.map((ins) => (
              <option key={ins} value={ins}>{ins}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          MEDICAL CONDITIONS RESTRICTED FROM PARTICIPATION
        </label>
        <MultiSelectPills
          options={ADV_MEDICAL_RESTRICTIONS}
          selected={form.advMedicalRestrictions}
          onChange={(next) => set('advMedicalRestrictions', next)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CheckboxCard
          label="Mandatory Safety Gear Inspection before launch"
          checked={form.advMandatoryGear}
          onChange={() => set('advMandatoryGear', !form.advMandatoryGear)}
        />
        <CheckboxCard
          label="On-site Emergency First Aid Kit & trained medic"
          checked={form.advFirstAidFacility}
          onChange={() => set('advFirstAidFacility', !form.advFirstAidFacility)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="EMERGENCY CONTACT NUMBER *"
          placeholder="+91 98765 00000"
          value={form.advEmergencyContact}
          onChange={(e) => set('advEmergencyContact', e.target.value)}
        />
        <Input
          label="SAFETY CERTIFICATIONS / PERMIT NUMBERS (OPTIONAL)"
          placeholder="e.g. NIWS / PADI / DGCA registration numbers"
          value={form.advSafetyCertifications}
          onChange={(e) => set('advSafetyCertifications', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            CANCELLATION POLICY *
          </label>
          <textarea
            rows={2}
            value={form.advCancellationPolicy}
            onChange={(e) => {
              set('advCancellationPolicy', e.target.value);
              set('cancellationPolicy', e.target.value);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            BAD WEATHER CANCELLATION & REFUND POLICY
          </label>
          <textarea
            rows={2}
            value={form.advBadWeatherPolicy}
            onChange={(e) => set('advBadWeatherPolicy', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Activity Summary Preview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <p><span className="text-slate-500 font-medium">Activity:</span> <span className="font-bold text-slate-900">{form.title}</span></p>
            <p><span className="text-slate-500 font-medium">Category:</span> <span className="font-semibold text-slate-800">{form.advCategory} ({form.advDifficulty})</span></p>
            <p><span className="text-slate-500 font-medium">Location:</span> <span className="font-semibold text-slate-800">{form.advLocationName}, {form.destinationCity || form.destinationInput}</span></p>
            <p><span className="text-slate-500 font-medium">Duration:</span> <span className="font-semibold text-slate-800">{form.advDurationHours || '2-3 Hours'}</span></p>
          </div>
          <div className="space-y-1.5">
            <p><span className="text-slate-500 font-medium">Price:</span> <span className="font-bold text-teal-700">₹{form.advPricePerPerson || form.basePrice || 'N/A'} / person</span></p>
            <p><span className="text-slate-500 font-medium">Min Age:</span> <span className="font-semibold text-slate-800">{form.advMinAge || '12'} Years</span></p>
            <p><span className="text-slate-500 font-medium">Risk Level:</span> <span className="font-semibold text-slate-800">{form.advRiskLevel}</span></p>
            <p><span className="text-slate-500 font-medium">Emergency Line:</span> <span className="font-semibold text-slate-800">{form.advEmergencyContact || 'Registered'}</span></p>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <CheckboxCard
          label="I certify all gear is safety-inspected and all guides hold valid adventure certifications."
          checked={termsAccepted}
          onChange={() => setTermsAccepted(!termsAccepted)}
        />
      </div>

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
          onClick={onSubmit}
        >
          {verificationStatus !== 'VERIFIED'
            ? 'Verification Required'
            : 'Submit for Approval'}
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. LOCAL GUIDES (4 STEPS)
// ════════════════════════════════════════════════════════════════

export function GuideStep1({
  form,
  set,
  setForm,
  categoryStore,
  setImageError,
  setError,
  setStep,
}: {
  form: any;
  set: (k: any, v: any) => void;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  categoryStore: React.MutableRefObject<any>;
  setImageError: (m: string | null) => void;
  setError: (m: string | null) => void;
  setStep: (s: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-600" />
            Guide Profile & City
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 1 of 4: Setup your storytelling profile, languages spoken, experience, and tourism credentials.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Local Guides
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="GUIDE SERVICE TITLE *"
          placeholder="e.g. Certified Historian Guide for Varanasi Ghats & Temples"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />

        <Input
          label="GUIDE / BUSINESS NAME *"
          placeholder="e.g. Rajesh Sharma / Heritage Walkers Co."
          value={form.guideFullName}
          onChange={(e) => set('guideFullName', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DestinationLocationInput
          value={form.destinationInput}
          onChange={(val) => set('destinationInput', val)}
          onSelect={(city, state) => {
            set('destinationCity', city);
            set('destinationState', state);
          }}
        />

        <Input
          label="SERVICE AREAS / NEIGHBORHOODS *"
          placeholder="e.g. Old City, Assi Ghat, Sarnath Circuit"
          value={form.guideServiceAreas}
          onChange={(e) => set('guideServiceAreas', e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          GUIDE BIO & STORYTELLING PHILOSOPHY *
        </label>
        <textarea
          rows={4}
          placeholder="Introduce yourself, your passion for local culture, depth of historical knowledge, storytelling style, and why travelers love walking with you..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="YEARS OF EXPERIENCE *"
          type="number"
          placeholder="e.g. 8"
          value={form.guideExperienceYears}
          onChange={(e) => set('guideExperienceYears', e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            GUIDE TYPE *
          </label>
          <select
            value={form.guideType}
            onChange={(e) => set('guideType', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {GUIDE_TYPES.map((gt) => (
              <option key={gt} value={gt}>{gt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            SPECIALIZATION *
          </label>
          <select
            value={form.guideSpecialization}
            onChange={(e) => set('guideSpecialization', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {GUIDE_SPECIALIZATIONS.map((sp) => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            TOUR FORMAT *
          </label>
          <select
            value={form.guideTourFormat}
            onChange={(e) => set('guideTourFormat', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {GUIDE_TOUR_FORMATS.map((tf) => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            TOURISM CERTIFICATION / LICENSING BODY
          </label>
          <select
            value={form.guideCertificationType}
            onChange={(e) => set('guideCertificationType', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {GUIDE_CERTIFICATION_TYPES.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          LANGUAGES SPOKEN FLUENTLY *
        </label>
        <MultiSelectPills
          options={GUIDE_LANGUAGES}
          selected={form.guideLanguages}
          onChange={(next) => set('guideLanguages', next)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="DEFAULT MEETING POINT LANDMARK *"
          placeholder="e.g. Dasaswamedh Ghat Main Steps / Hotel Lobby"
          value={form.guideMeetingPoint}
          onChange={(e) => set('guideMeetingPoint', e.target.value)}
        />

        <Input
          label="TOURISM LICENSE / BADGE ID (OPTIONAL)"
          placeholder="e.g. RL-UP-2021-0844"
          value={form.guideLicenseId}
          onChange={(e) => set('guideLicenseId', e.target.value)}
        />
      </div>

      <div className="space-y-1.5 pt-2">
        <CoverImageUploader
          key={`guide_cover_uploader_${form.listingType}`}
          label="Guide Profile & Tour Photos *"
          category="guide"
          required={true}
          images={form.images}
          value={form.imageUrl}
          onChange={(val, all) => {
            const list = Array.isArray(val) ? val : all || [val].filter(Boolean);
            setForm((prev: any) => {
              const next = {
                ...prev,
                images: list,
                imageUrl: list[0] || '',
              };
              categoryStore.current[next.listingType] = next;
              return next;
            });
            setImageError(null);
          }}
          onError={(msg: string | null) => setImageError(msg)}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => {
            if (!form.title.trim()) {
              setError('Guide Service Title is required');
              return;
            }
            if (form.guideLanguages.length === 0) {
              setError('Please select at least one Language Spoken');
              return;
            }
            if (!form.imageUrl && form.images.length === 0) {
              const defaultImage = getCategoryDefaultCoverImage('guide');
              setForm((prev: any) => ({
                ...prev,
                images: [defaultImage],
                imageUrl: defaultImage,
              }));
            }
            setError(null);
            setStep(2);
          }}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Pricing & Hours
        </Button>
      </div>
    </div>
  );
}

export function GuideStep2({
  form,
  set,
  setStep,
}: {
  form: any;
  set: (k: any, v: any) => void;
  setStep: (s: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-teal-600" />
            Pricing & Hours
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 2 of 4: Setup hourly or day rates, group thresholds, transportation, and equipment included.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Step 2 / 4
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            PRICING MODEL *
          </label>
          <select
            value={form.guidePricingType}
            onChange={(e) => set('guidePricingType', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {GUIDE_PRICING_TYPES.map((pt) => (
              <option key={pt} value={pt}>{pt}</option>
            ))}
          </select>
        </div>

        <Input
          label="PRICE PER HOUR (₹)"
          type="number"
          placeholder="e.g. 500"
          value={form.guidePricePerHour}
          onChange={(e) => set('guidePricePerHour', e.target.value)}
        />

        <Input
          label="FULL DAY PRICE (₹) *"
          type="number"
          placeholder="e.g. 2500"
          value={form.guideFullDayPrice}
          onChange={(e) => {
            set('guideFullDayPrice', e.target.value);
            set('basePrice', e.target.value);
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="HALF DAY PRICE (₹)"
          type="number"
          placeholder="e.g. 1500"
          value={form.guideHalfDayPrice}
          onChange={(e) => set('guideHalfDayPrice', e.target.value)}
        />

        <Input
          label="GROUP PACKAGE PRICE (UP TO 8 GUESTS)"
          type="number"
          placeholder="e.g. 4000"
          value={form.guideGroupPrice}
          onChange={(e) => set('guideGroupPrice', e.target.value)}
        />

        <Input
          label="EXTRA PERSON CHARGE (₹)"
          type="number"
          placeholder="e.g. 300"
          value={form.guideAdditionalPersonCharge}
          onChange={(e) => set('guideAdditionalPersonCharge', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            LOCAL TRANSPORTATION *
          </label>
          <select
            value={form.guideTransportationIncluded}
            onChange={(e) => set('guideTransportationIncluded', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {GUIDE_TRANSPORT_OPTIONS.map((to) => (
              <option key={to} value={to}>{to}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            MONUMENT ENTRY TICKET HANDLING *
          </label>
          <select
            value={form.guideTicketHandling}
            onChange={(e) => set('guideTicketHandling', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            {GUIDE_TICKET_HANDLING.map((th) => (
              <option key={th} value={th}>{th}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          OPERATIONAL DAYS OF THE WEEK *
        </label>
        <MultiSelectPills
          options={FOOD_DAYS_OF_WEEK}
          selected={form.guideAvailableDays}
          onChange={(next) => set('guideAvailableDays', next)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="DEFAULT START TIME *"
          type="time"
          value={form.guideStartingTime}
          onChange={(e) => set('guideStartingTime', e.target.value)}
        />

        <Input
          label="DEFAULT END TIME *"
          type="time"
          value={form.guideEndingTime}
          onChange={(e) => set('guideEndingTime', e.target.value)}
        />

        <Input
          label="MAX CUSTOMERS PER TOUR SLOT *"
          type="number"
          placeholder="e.g. 10"
          value={form.guideMaxCustomersPerSlot}
          onChange={(e) => {
            set('guideMaxCustomersPerSlot', e.target.value);
            set('maxGroupSize', e.target.value);
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CheckboxCard
          label="Audio whisper headsets provided for group clarity"
          checked={form.guideAudioWhisperHeadsets}
          onChange={() => set('guideAudioWhisperHeadsets', !form.guideAudioWhisperHeadsets)}
        />
        <CheckboxCard
          label="Fast-track ticket queue assistance included"
          checked={form.guideTicketQueueAssistance}
          onChange={() => set('guideTicketQueueAssistance', !form.guideTicketQueueAssistance)}
        />
      </div>

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
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => setStep(3)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Tour Route & Topics
        </Button>
      </div>
    </div>
  );
}

export function GuideStep3({
  form,
  set,
  newGuideStop,
  setNewGuideStop,
  addGuideStop,
  removeGuideStop,
  setStep,
}: {
  form: any;
  set: (k: any, v: any) => void;
  newGuideStop: GuideTourStop;
  setNewGuideStop: React.Dispatch<React.SetStateAction<GuideTourStop>>;
  addGuideStop: () => void;
  removeGuideStop: (id: string) => void;
  setStep: (s: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Tour Route & Topics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 3 of 4: Outline monuments covered, route checkpoints, story themes, and dress instructions.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Step 3 / 4
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="TOUR STARTING POINT *"
          placeholder="e.g. Dasaswamedh Ghat Steps"
          value={form.guideTourStartingPoint}
          onChange={(e) => set('guideTourStartingPoint', e.target.value)}
        />

        <Input
          label="TOUR ENDING POINT *"
          placeholder="e.g. Manikarnika Ghat / Godowlia Chowk"
          value={form.guideTourEndingPoint}
          onChange={(e) => set('guideTourEndingPoint', e.target.value)}
        />

        <Input
          label="TOTAL WALKING DISTANCE"
          placeholder="e.g. 2.5 km gentle walk"
          value={form.guideWalkingDistance}
          onChange={(e) => set('guideWalkingDistance', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            KEY MONUMENTS / SITES VISITED
          </label>
          <input
            type="text"
            placeholder="e.g. Kashi Vishwanath Corridor, Old Silk Weavers Lane, Ganga Aarti Balcony"
            value={form.guideKeyMonuments}
            onChange={(e) => set('guideKeyMonuments', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            STORY THEMES & HISTORICAL TOPICS
          </label>
          <input
            type="text"
            placeholder="e.g. Vedic rituals, Mughal Architecture, Royal patronage, Buddhist origins at Sarnath"
            value={form.guideTopics}
            onChange={(e) => set('guideTopics', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>
      </div>

      {/* Interactive Tour Stop Builder */}
      <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-4">
        <h3 className="text-sm font-bold text-teal-900 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-teal-700" />
          Add Itinerary Stop / Heritage Point
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="STOP NAME *"
            placeholder="e.g. Manikarnika Sacred Fire"
            value={newGuideStop.stopName}
            onChange={(e) => setNewGuideStop((prev) => ({ ...prev, stopName: e.target.value }))}
          />
          <Input
            label="LOCATION / LANDMARK"
            placeholder="e.g. Old Burning Ghat Ghat No 2"
            value={newGuideStop.location}
            onChange={(e) => setNewGuideStop((prev) => ({ ...prev, location: e.target.value }))}
          />
          <Input
            label="DURATION (MINUTES)"
            placeholder="30"
            value={newGuideStop.durationMinutes}
            onChange={(e) => setNewGuideStop((prev) => ({ ...prev, durationMinutes: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            HISTORICAL STORIES & HIGHLIGHTS OF THIS STOP
          </label>
          <input
            type="text"
            placeholder="e.g. 3,000-year uninterrupted eternal fire legend and royal cremation rituals"
            value={newGuideStop.description}
            onChange={(e) => setNewGuideStop((prev) => ({ ...prev, description: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGuideStop}
            className="border-teal-600 text-teal-700 hover:bg-teal-50 font-bold"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + Add Tour Stop
          </Button>
        </div>
      </div>

      {form.guideStops.length > 0 && (
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            TOUR STOPS ADDED ({form.guideStops.length})
          </label>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {form.guideStops.map((stop: GuideTourStop, idx: number) => (
              <div key={stop.id} className="flex items-center justify-between p-3 hover:bg-slate-50 text-sm">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{stop.stopName}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({stop.durationMinutes} mins · {stop.location})
                    </span>
                  </div>
                  {stop.description && (
                    <p className="text-xs text-slate-500 pl-7">{stop.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeGuideStop(stop.id)}
                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            SPECIAL INSTRUCTIONS / DRESS CODE
          </label>
          <input
            type="text"
            placeholder="e.g. Modest attire covering shoulders & knees for temple sanctums, slip-on shoes recommended"
            value={form.guideSpecialInstructions}
            onChange={(e) => set('guideSpecialInstructions', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            WHAT CUSTOMERS SHOULD CARRY
          </label>
          <input
            type="text"
            placeholder="e.g. Valid Govt ID for monument entry, small cash for shoe tokens / prasad, water bottle"
            value={form.guideWhatToBring}
            onChange={(e) => set('guideWhatToBring', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>
      </div>

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
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => setStep(4)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Verification & Policies
        </Button>
      </div>
    </div>
  );
}

export function GuideStep4({
  form,
  set,
  setStep,
  verificationStatus,
  submitting,
  onSubmit,
}: {
  form: any;
  set: (k: any, v: any) => void;
  setStep: (s: number) => void;
  verificationStatus: string | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            Verification, Policies & Submit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Step 4 of 4: Review guide booking rules, cancellation guarantees, code of conduct, and submit for approval.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 text-teal-700 font-bold px-3 py-1 text-xs border border-teal-200">
          Final Review
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            CANCELLATION POLICY *
          </label>
          <textarea
            rows={2}
            value={form.guideCancellationPolicy}
            onChange={(e) => {
              set('guideCancellationPolicy', e.target.value);
              set('cancellationPolicy', e.target.value);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
            REFUND & RESCHEDULING POLICY
          </label>
          <textarea
            rows={2}
            value={form.guideRefundPolicy}
            onChange={(e) => set('guideRefundPolicy', e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="LATE ARRIVAL POLICY"
          value={form.guideLateArrivalPolicy}
          onChange={(e) => set('guideLateArrivalPolicy', e.target.value)}
        />

        <Input
          label="NO-SHOW POLICY"
          value={form.guideNoShowPolicy}
          onChange={(e) => set('guideNoShowPolicy', e.target.value)}
        />

        <Input
          label="EMERGENCY CONTACT PHONE *"
          placeholder="+91 98765 00000"
          value={form.guideEmergencyContact}
          onChange={(e) => set('guideEmergencyContact', e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Guide Service Summary Preview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <p><span className="text-slate-500 font-medium">Service:</span> <span className="font-bold text-slate-900">{form.title}</span></p>
            <p><span className="text-slate-500 font-medium">Guide:</span> <span className="font-semibold text-slate-800">{form.guideFullName} ({form.guideType})</span></p>
            <p><span className="text-slate-500 font-medium">City:</span> <span className="font-semibold text-slate-800">{form.destinationCity || form.destinationInput}</span></p>
            <p><span className="text-slate-500 font-medium">Languages:</span> <span className="font-semibold text-slate-800">{form.guideLanguages.join(', ')}</span></p>
          </div>
          <div className="space-y-1.5">
            <p><span className="text-slate-500 font-medium">Pricing:</span> <span className="font-bold text-teal-700">₹{form.guideFullDayPrice || form.guidePricePerHour || form.basePrice || 'N/A'}</span></p>
            <p><span className="text-slate-500 font-medium">Monuments / Stops:</span> <span className="font-semibold text-slate-800">{form.guideStops.length} stops planned</span></p>
            <p><span className="text-slate-500 font-medium">License / Cert:</span> <span className="font-semibold text-slate-800">{form.guideCertificationType}</span></p>
            <p><span className="text-slate-500 font-medium">Starting Point:</span> <span className="font-semibold text-slate-800">{form.guideTourStartingPoint || form.guideMeetingPoint || 'City Center'}</span></p>
          </div>
        </div>
      </div>

      <div className="pt-1">
        <CheckboxCard
          label="I agree to follow the National Code of Conduct for Safe and Honorable Tourism, and provide genuine local knowledge."
          checked={termsAccepted}
          onChange={() => setTermsAccepted(!termsAccepted)}
        />
      </div>

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
          onClick={onSubmit}
        >
          {verificationStatus !== 'VERIFIED'
            ? 'Verification Required'
            : 'Submit for Approval'}
        </Button>
      </div>
    </div>
  );
}
