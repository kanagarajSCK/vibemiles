'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, Building2, Home, Compass, Utensils, Car,
  User, Phone, Mail, Lock, MapPin, Check, ChevronRight,
  Camera, FileText, CreditCard, Eye,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PublicHeader } from '@/components/navigation/PublicHeader';
import { PublicFooter } from '@/components/navigation/PublicFooter';
import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';
import type { BusinessCategory } from '@/types';

// ── Types ──
type BusinessType =
  | 'hotel_resort'
  | 'villa_homestay'
  | 'camping'
  | 'tour_organizer'
  | 'travel_agency'
  | 'adventure'
  | 'local_guide'
  | 'food_business'
  | 'cab_transport'
  | 'other';

interface WizardState {
  // Step 1
  businessType: BusinessType | '';
  // Step 2
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 3
  businessName: string;
  ownerName: string;
  yearsInBusiness: string;
  businessDescription: string;
  websiteUrl: string;
  businessPhone: string;
  businessEmail: string;
  // Step 4
  country: string;
  state: string;
  city: string;
  locality: string;
  fullAddress: string;
  pinCode: string;
  // Step 5 — dynamic (partial)
  propertyType: string;
  roomCount: string;
  checkIn: string;
  checkOut: string;
  // Step 8 — banking
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  // Step 9 — pricing
  startingPrice: string;
  priceUnit: string;
  cancellationPolicy: string;
  // Step 10 — confirm
  confirmed: boolean;
}

const INITIAL_STATE: WizardState = {
  businessType: '', fullName: '', mobile: '', email: '', password: '', confirmPassword: '',
  businessName: '', ownerName: '', yearsInBusiness: '', businessDescription: '', websiteUrl: '', businessPhone: '', businessEmail: '',
  country: 'India', state: '', city: '', locality: '', fullAddress: '', pinCode: '',
  propertyType: '', roomCount: '', checkIn: '14:00', checkOut: '11:00',
  accountHolder: '', bankName: '', accountNumber: '', ifscCode: '',
  startingPrice: '', priceUnit: '', cancellationPolicy: '',
  confirmed: false,
};

const BUSINESS_TYPE_OPTIONS = [
  { value: 'hotel_resort', label: 'Hotel / Resort', icon: Building2, desc: 'Hotels, resorts, boutique properties' },
  { value: 'villa_homestay', label: 'Villa / Homestay', icon: Home, desc: 'Private villas, homestays, guest houses' },
  { value: 'camping', label: 'Camping', icon: MapPin, desc: 'Camping sites, glamping, outdoor resorts' },
  { value: 'tour_organizer', label: 'Tour Organizer', icon: Compass, desc: 'Custom & group tour packages' },
  { value: 'travel_agency', label: 'Travel Agency', icon: Compass, desc: 'Full-service travel planning' },
  { value: 'adventure', label: 'Adventure Experience', icon: MapPin, desc: 'Trekking, water sports, activities' },
  { value: 'local_guide', label: 'Local Guide', icon: User, desc: 'Guided tours & local expertise' },
  { value: 'food_business', label: 'Food Business', icon: Utensils, desc: 'Restaurants, culinary tours, food experiences' },
  { value: 'cab_transport', label: 'Cab / Transport', icon: Car, desc: 'Cab service, airport transfer, rentals' },
  { value: 'other', label: 'Other', icon: ChevronRight, desc: 'Any other travel-related business' },
];

const TOTAL_STEPS = 10;
const STEP_LABELS = [
  'Business Type', 'Account Info', 'Business Info', 'Location',
  'Business Details', 'Media', 'Documents', 'Bank Details', 'Pricing', 'Preview',
];

export default function PartnerRegisterPage() {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const update = (field: keyof WizardState, value: string | boolean) =>
    setState((prev) => ({ ...prev, [field]: value }));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await authService.register({
        fullName: state.fullName || state.ownerName || 'Partner',
        email: state.email || state.businessEmail,
        phone: state.mobile || state.businessPhone || '9876543210',
        password: state.password || 'ProviderPass123!',
        role: 'provider',
        businessName: state.businessName || 'My Travel Business',
        businessCategory: (selectedBizType?.label as BusinessCategory) || 'Tour Organizer',
        city: state.city || 'Bengaluru',
        state: state.state || 'Karnataka',
        pincode: state.pinCode || '560001',
      });
      await refreshUser();
      setIsSubmitting(false);
      setSubmitted(true);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : 'Registration failed.');
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-lg text-center space-y-6 bg-white rounded-3xl border border-slate-200 p-10 shadow-lg">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-100">
              <Check className="w-8 h-8 text-emerald-700" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Registration Submitted!</h1>
            <p className="text-slate-500 text-sm">
              Your business has been submitted for verification. Our team will review your information within 2–3 business days.
            </p>
            <p className="text-xs text-slate-400">
              You can track your verification status from your Partner Dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={ROUTES.PROVIDER_DASHBOARD}>
                <Button variant="primary" size="lg" className="font-bold">
                  Go to Partner Dashboard
                </Button>
              </Link>
              <Link href={ROUTES.PARTNER_VERIFICATION}>
                <Button variant="outline" size="md">
                  Check Verification Status
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const selectedBizType = BUSINESS_TYPE_OPTIONS.find((b) => b.value === state.businessType);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicHeader />
      <main className="flex-1">
        {/* Header bar */}
        <div className="bg-slate-900 text-white py-6">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">Partner Registration</span>
            </div>
            <h1 className="text-xl font-extrabold">Register Your Travel Business</h1>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
          {/* Progress stepper */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">Step {step} of {TOTAL_STEPS}</span>
              <span className="text-xs font-bold text-teal-700">{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-teal-700 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
            <div className="mt-3 hidden sm:flex gap-1 flex-wrap">
              {STEP_LABELS.map((label, i) => (
                <span
                  key={label}
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    i + 1 < step ? 'bg-teal-100 text-teal-700' :
                    i + 1 === step ? 'bg-teal-700 text-white' :
                    'bg-slate-100 text-slate-400'
                  )}
                >
                  {i + 1 < step && '✓ '}{label}
                </span>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">

            {/* STEP 1 — Business Type */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">What would you like to list?</h2>
                  <p className="text-sm text-slate-500 mt-1">Choose your primary business type. You can add more services later.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {BUSINESS_TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('businessType', opt.value)}
                        className={cn(
                          'flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all',
                          state.businessType === opt.value
                            ? 'border-teal-700 bg-teal-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <div className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                          state.businessType === opt.value ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={cn('font-bold text-sm', state.businessType === opt.value ? 'text-teal-800' : 'text-slate-800')}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                        {state.businessType === opt.value && (
                          <Check className="w-4 h-4 text-teal-700 ml-auto shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2 — Account Info */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Account Information</h2>
                  <p className="text-sm text-slate-500 mt-1">Create your partner account credentials.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Full Name" placeholder="Your full name" required value={state.fullName} onChange={(e) => update('fullName', e.target.value)} leftIcon={<User className="w-4 h-4 text-slate-400" />} />
                  <Input label="Mobile Number" placeholder="+91 98765 43210" required value={state.mobile} onChange={(e) => update('mobile', e.target.value)} leftIcon={<Phone className="w-4 h-4 text-slate-400" />} />
                  <Input label="Email Address" type="email" placeholder="you@business.com" required value={state.email} onChange={(e) => update('email', e.target.value)} leftIcon={<Mail className="w-4 h-4 text-slate-400" />} />
                  <div />
                  <Input label="Password" type="password" placeholder="Min. 8 characters" required value={state.password} onChange={(e) => update('password', e.target.value)} leftIcon={<Lock className="w-4 h-4 text-slate-400" />} />
                  <Input label="Confirm Password" type="password" placeholder="Repeat password" required value={state.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} leftIcon={<Lock className="w-4 h-4 text-slate-400" />} />
                </div>
                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700" />
                  <span>I agree to the <Link href="/terms" className="text-teal-700 font-semibold hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-teal-700 font-semibold hover:underline">Privacy Policy</Link></span>
                </label>
              </div>
            )}

            {/* STEP 3 — Business Info */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Business Information</h2>
                  <p className="text-sm text-slate-500 mt-1">Tell us about your business.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Business Name" placeholder="Legal business name" required value={state.businessName} onChange={(e) => update('businessName', e.target.value)} />
                  <Input label="Owner / Contact Person" placeholder="Full name" required value={state.ownerName} onChange={(e) => update('ownerName', e.target.value)} />
                  <Input label="Years in Business" type="number" placeholder="e.g. 5" value={state.yearsInBusiness} onChange={(e) => update('yearsInBusiness', e.target.value)} />
                  <Input label="Business Phone" placeholder="+91 98765 43210" required value={state.businessPhone} onChange={(e) => update('businessPhone', e.target.value)} />
                  <Input label="Business Email" type="email" placeholder="info@business.com" required value={state.businessEmail} onChange={(e) => update('businessEmail', e.target.value)} />
                  <Input label="Website URL (Optional)" placeholder="https://yourbusiness.com" value={state.websiteUrl} onChange={(e) => update('websiteUrl', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Business Description <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={4}
                    placeholder="Describe your business, services, and what makes you unique... (min. 100 characters)"
                    value={state.businessDescription}
                    onChange={(e) => update('businessDescription', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none resize-none"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">{state.businessDescription.length}/800 characters</p>
                </div>
              </div>
            )}

            {/* STEP 4 — Location */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Business Location</h2>
                  <p className="text-sm text-slate-500 mt-1">Where is your business located?</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select label="Country" value={state.country} onChange={(e) => update('country', e.target.value)} options={[{ value: 'India', label: 'India' }]} />
                  <Select label="State" required value={state.state} onChange={(e) => update('state', e.target.value)} options={[
                    { value: '', label: 'Select State' },
                    { value: 'Karnataka', label: 'Karnataka' },
                    { value: 'Kerala', label: 'Kerala' },
                    { value: 'Goa', label: 'Goa' },
                    { value: 'Rajasthan', label: 'Rajasthan' },
                    { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
                    { value: 'Uttarakhand', label: 'Uttarakhand' },
                    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
                    { value: 'Maharashtra', label: 'Maharashtra' },
                    { value: 'Jammu & Kashmir', label: 'Jammu & Kashmir' },
                    { value: 'Other', label: 'Other' },
                  ]} />
                  <Input label="City" placeholder="e.g. Goa, Manali" required value={state.city} onChange={(e) => update('city', e.target.value)} leftIcon={<MapPin className="w-4 h-4 text-slate-400" />} />
                  <Input label="Area / Locality" placeholder="Area or neighbourhood" value={state.locality} onChange={(e) => update('locality', e.target.value)} />
                  <div className="sm:col-span-2">
                    <Input label="Full Address" placeholder="Street address, building name" required value={state.fullAddress} onChange={(e) => update('fullAddress', e.target.value)} />
                  </div>
                  <Input label="PIN / Postal Code" placeholder="e.g. 403001" value={state.pinCode} onChange={(e) => update('pinCode', e.target.value)} />
                </div>
              </div>
            )}

            {/* STEP 5 — Dynamic Business Details */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Business Details</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Details specific to your <span className="font-semibold text-teal-700">{selectedBizType?.label}</span> business.
                  </p>
                </div>

                {/* Hotel / Resort */}
                {(state.businessType === 'hotel_resort') && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select label="Property Type" value={state.propertyType} onChange={(e) => update('propertyType', e.target.value)} options={[
                      { value: '', label: 'Select Type' },
                      { value: 'hotel', label: 'Hotel' },
                      { value: 'resort', label: 'Resort' },
                      { value: 'boutique', label: 'Boutique Hotel' },
                    ]} />
                    <Select label="Star Category" options={[
                      { value: '', label: 'Select Star Category' },
                      { value: '1', label: '1 Star' }, { value: '2', label: '2 Star' },
                      { value: '3', label: '3 Star' }, { value: '4', label: '4 Star' },
                      { value: '5', label: '5 Star' }, { value: 'Unrated', label: 'Unrated' },
                    ]} />
                    <Input label="Number of Rooms" type="number" placeholder="e.g. 24" value={state.roomCount} onChange={(e) => update('roomCount', e.target.value)} />
                    <Input label="Guest Capacity" type="number" placeholder="Max guests" />
                    <Input label="Check-in Time" type="time" value={state.checkIn} onChange={(e) => update('checkIn', e.target.value)} />
                    <Input label="Check-out Time" type="time" value={state.checkOut} onChange={(e) => update('checkOut', e.target.value)} />
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Amenities</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Wi-Fi', 'Pool', 'Restaurant', 'AC', 'Parking', 'Gym', 'Spa', 'Pet Friendly'].map((a) => (
                          <label key={a} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" />
                            {a}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Villa / Homestay / Camping */}
                {(state.businessType === 'villa_homestay' || state.businessType === 'camping') && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Property Name" placeholder="e.g. Green Valley Homestay" />
                    <Input label="Number of Bedrooms" type="number" placeholder="e.g. 4" />
                    <Input label="Bathrooms" type="number" placeholder="e.g. 2" />
                    <Input label="Maximum Guests" type="number" placeholder="Max guests" />
                    <Select label="Room Type" options={[
                      { value: '', label: 'Select Type' },
                      { value: 'entire', label: 'Entire Place' },
                      { value: 'private', label: 'Private Room' },
                      { value: 'shared', label: 'Shared Room' },
                    ]} />
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Amenities</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Wi-Fi', 'Kitchen', 'Parking', 'AC', 'Hot Water', 'Garden', 'BBQ', 'Washing Machine'].map((a) => (
                          <label key={a} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" />
                            {a}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tour Organizer / Travel Agency */}
                {(state.businessType === 'tour_organizer' || state.businessType === 'travel_agency') && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Destinations Covered" placeholder="e.g. Manali, Spiti, Ladakh" />
                    <Input label="Max Group Size" type="number" placeholder="e.g. 20" />
                    <Select label="Tour Types" options={[
                      { value: '', label: 'Select' },
                      { value: 'group', label: 'Group Tours' },
                      { value: 'private', label: 'Private Tours' },
                      { value: 'both', label: 'Both' },
                    ]} />
                    <Select label="Custom Tours Available" options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
                    <div className="sm:col-span-2">
                      <Input label="Languages Supported" placeholder="e.g. English, Hindi, Tamil" />
                    </div>
                  </div>
                )}

                {/* Adventure */}
                {state.businessType === 'adventure' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Activity Name" placeholder="e.g. White Water Rafting" />
                    <Select label="Difficulty Level" options={[
                      { value: '', label: 'Select' },
                      { value: 'easy', label: 'Easy' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'difficult', label: 'Difficult' },
                      { value: 'expert', label: 'Expert' },
                    ]} />
                    <Input label="Duration" placeholder="e.g. 3 hours" />
                    <Input label="Minimum Age" type="number" placeholder="e.g. 12" />
                    <Input label="Maximum Participants" type="number" placeholder="e.g. 15" />
                    <Select label="Equipment Included" options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'partial', label: 'Partial' }]} />
                  </div>
                )}

                {/* Local Guide */}
                {state.businessType === 'local_guide' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Languages Spoken" placeholder="e.g. English, Hindi, French" />
                    <Input label="Destinations Covered" placeholder="e.g. Jaipur, Agra" />
                    <Input label="Years of Experience" type="number" placeholder="e.g. 8" />
                    <Input label="Max Group Size" type="number" placeholder="e.g. 12" />
                    <Select label="Guide License" options={[{ value: 'yes', label: 'Yes — Licensed' }, { value: 'no', label: 'No License' }]} />
                    <Input label="Specializations" placeholder="e.g. Heritage, Wildlife, Food" />
                  </div>
                )}

                {/* Food Business */}
                {state.businessType === 'food_business' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input label="Cuisine Type" placeholder="e.g. South Indian, Mughlai" />
                    <Select label="Food Type" options={[
                      { value: 'veg', label: 'Pure Vegetarian' },
                      { value: 'nonveg', label: 'Non-Vegetarian' },
                      { value: 'both', label: 'Both Veg & Non-Veg' },
                    ]} />
                    <Select label="Service Type" options={[
                      { value: 'dine', label: 'Dine-in' },
                      { value: 'delivery', label: 'Delivery Only' },
                      { value: 'experience', label: 'Food Experience' },
                      { value: 'all', label: 'All of the above' },
                    ]} />
                    <Input label="Seating Capacity" type="number" placeholder="e.g. 40" />
                    <Input label="Opening Hours" placeholder="e.g. 10:00 AM – 10:00 PM" />
                    <Input label="Signature Dishes" placeholder="e.g. Kerala Sadhya, Biryani" />
                  </div>
                )}

                {/* Cab / Transport */}
                {state.businessType === 'cab_transport' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select label="Primary Service" options={[
                      { value: 'local', label: 'Local City Travel' },
                      { value: 'airport', label: 'Airport Transfer' },
                      { value: 'outstation', label: 'Outstation Travel' },
                      { value: 'all', label: 'All Services' },
                    ]} />
                    <Input label="Number of Vehicles" type="number" placeholder="e.g. 5" />
                    <Select label="Driver Included" options={[{ value: 'yes', label: 'Yes, with driver' }, { value: 'self', label: 'Self-drive rental' }]} />
                    <Input label="Areas / Cities Covered" placeholder="e.g. Goa, Mumbai, Pune" />
                    <Input label="Operating Hours" placeholder="e.g. 24/7 or 6AM–10PM" />
                  </div>
                )}

                {/* Other */}
                {state.businessType === 'other' && (
                  <div className="space-y-4">
                    <Input label="Business Category Description" placeholder="Describe your business category" />
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Service Details</label>
                      <textarea rows={4} placeholder="Describe the services you offer..." className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none resize-none" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 6 — Media Upload */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Media & Photos</h2>
                  <p className="text-sm text-slate-500 mt-1">Upload photos of your business. High quality images attract more travelers.</p>
                </div>
                {[
                  { label: 'Business Logo', desc: 'PNG or JPG, square preferred, max 2MB', icon: Camera },
                  { label: 'Cover / Banner Image', desc: 'Recommended: 1280×720px, max 5MB', icon: Camera },
                  { label: 'Business Gallery Photos', desc: 'Up to 10 photos. JPG, PNG. Max 5MB each.', icon: Camera },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-colors cursor-pointer">
                      <Icon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="font-semibold text-slate-700">{item.label}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                      <label className="mt-3 inline-flex cursor-pointer">
                        <input type="file" accept="image/*" className="sr-only" multiple />
                        <span className="text-xs font-bold text-teal-700 border border-teal-300 rounded-lg px-4 py-1.5 hover:bg-teal-50 transition-colors">
                          Choose Files
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            {/* STEP 7 — Documents */}
            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Documents & Verification</h2>
                  <p className="text-sm text-slate-500 mt-1">Upload your business verification documents.</p>
                </div>
                <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-sm text-teal-800">
                  <ShieldInfo /> Your verification documents are used only for account verification and will <strong>not</strong> be publicly displayed.
                </div>
                {[
                  { label: 'Business Registration Certificate', desc: 'Certificate of incorporation or GST registration', required: true },
                  { label: 'Government-Issued ID', desc: 'Aadhaar, PAN card, or Passport', required: true },
                  { label: 'Address Proof', desc: 'Utility bill, rental agreement, or bank statement', required: true },
                  { label: 'GST Certificate (if applicable)', desc: 'Upload if your business is GST registered', required: false },
                  { label: 'Tourism / Trade License (if applicable)', desc: 'Any relevant license for your business category', required: false },
                ].map((doc) => (
                  <div key={doc.label} className="rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-teal-300 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900">
                        {doc.label} {doc.required && <span className="text-rose-500">*</span>}
                      </p>
                      <p className="text-xs text-slate-500">{doc.desc}</p>
                    </div>
                    <label className="cursor-pointer shrink-0">
                      <input type="file" accept=".pdf,.jpg,.png" className="sr-only" />
                      <span className="text-xs font-bold text-teal-700 border border-teal-300 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition-colors">
                        Upload
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 8 — Bank Details */}
            {step === 8 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Bank & Payout Information</h2>
                  <p className="text-sm text-slate-500 mt-1">Your payout details for receiving payments from bookings.</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 font-medium">
                  🔒 Your banking information is encrypted and stored securely. It is never shared publicly.
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="Account Holder Name" placeholder="Name as on bank account" required value={state.accountHolder} onChange={(e) => update('accountHolder', e.target.value)} leftIcon={<CreditCard className="w-4 h-4 text-slate-400" />} />
                  <Input label="Bank Name" placeholder="e.g. State Bank of India" required value={state.bankName} onChange={(e) => update('bankName', e.target.value)} />
                  <Input label="Account Number" type="password" placeholder="Account number" required value={state.accountNumber} onChange={(e) => update('accountNumber', e.target.value)} />
                  <Input label="Confirm Account Number" placeholder="Re-enter account number" required />
                  <Input label="IFSC Code" placeholder="e.g. SBIN0001234" required value={state.ifscCode} onChange={(e) => update('ifscCode', e.target.value)} />
                  <Input label="UPI ID (Optional)" placeholder="yourname@upi" />
                </div>
              </div>
            )}

            {/* STEP 9 — Pricing & Policies */}
            {step === 9 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Pricing & Policies</h2>
                  <p className="text-sm text-slate-500 mt-1">Set your starting price and define your policies.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Starting Price (₹) <span className="text-rose-500">*</span></label>
                    <div className="flex">
                      <span className="flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-sm font-bold">₹</span>
                      <input type="number" placeholder="0" value={state.startingPrice} onChange={(e) => update('startingPrice', e.target.value)} className="flex-1 rounded-r-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none" />
                    </div>
                  </div>
                  <Select label="Price Unit" value={state.priceUnit} onChange={(e) => update('priceUnit', e.target.value)} options={[
                    { value: 'per_night', label: 'Per Night' },
                    { value: 'per_person', label: 'Per Person' },
                    { value: 'per_hour', label: 'Per Hour' },
                    { value: 'per_km', label: 'Per KM' },
                    { value: 'per_tour', label: 'Per Tour' },
                    { value: 'fixed', label: 'Fixed Price' },
                  ]} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Cancellation Policy <span className="text-rose-500">*</span></label>
                  <textarea rows={3} placeholder="Describe your cancellation and refund policy..." value={state.cancellationPolicy} onChange={(e) => update('cancellationPolicy', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Terms & Conditions (Optional)</label>
                  <textarea rows={3} placeholder="Any specific terms and conditions for bookings..." className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none resize-none" />
                </div>
              </div>
            )}

            {/* STEP 10 — Preview & Submit */}
            {step === 10 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Preview & Submit</h2>
                  <p className="text-sm text-slate-500 mt-1">Review your information before final submission.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Business Type', value: selectedBizType?.label || '—' },
                    { label: 'Business Name', value: state.businessName || '—' },
                    { label: 'Owner', value: state.fullName || '—' },
                    { label: 'Email', value: state.email || '—' },
                    { label: 'Phone', value: state.mobile || '—' },
                    { label: 'City', value: state.city || '—' },
                    { label: 'State', value: state.state || '—' },
                    { label: 'Starting Price', value: state.startingPrice ? `₹ ${state.startingPrice} ${state.priceUnit.replace(/_/g, ' ')}` : '—' },
                  ].map((row) => (
                    <div key={row.label} className="flex flex-col gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{row.label}</span>
                      <span className="text-sm font-semibold text-slate-900">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
                  <Eye className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500">
                    Please review all details. After submission, our team will verify your documents within 2–3 business days. You&apos;ll receive a notification once your listing is approved.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.confirmed}
                    onChange={(e) => update('confirmed', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700"
                  />
                  <span className="text-sm text-slate-700">
                    I confirm that all the information provided is accurate and I agree to the{' '}
                    <Link href="/terms" className="text-teal-700 font-semibold hover:underline">Terms of Service</Link>.
                  </span>
                </label>

                {submitError && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700">
                    {submitError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-4">
            <div>
              {step > 1 && (
                <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={prev}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:block">Step {step} of {TOTAL_STEPS}</span>
              {step < TOTAL_STEPS ? (
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={next}
                  disabled={step === 1 && !state.businessType}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="accent"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={!state.confirmed}
                  className="font-bold"
                >
                  Submit for Verification
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

// Inline shield info icon component
function ShieldInfo() {
  return <span className="inline-block mr-1">🔒</span>;
}
