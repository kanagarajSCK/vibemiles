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
import { ROUTES, INDIAN_STATES, getCategoryDefaultCoverImage, normalizeCategorySlug } from '@/constants';
import { packageService } from '@/services/package.service';
import { CoverImageUploader } from '@/components/travel/CoverImageUploader';
import {
  FoodMenuItem,
  GuideTourStop,
  FoodStep1,
  FoodStep2,
  FoodStep3,
  FoodStep4,
  AdventureStep1,
  AdventureStep2,
  AdventureStep3,
  AdventureStep4,
  GuideStep1,
  GuideStep2,
  GuideStep3,
  GuideStep4,
} from './CategoryFormSteps';

// ─── Listing Types ─────────────────────────────────────────────
const LISTING_TYPES = [
  { value: 'tour',       label: 'Tour Package',          emoji: '🗺️' },
  { value: 'cab',        label: 'Cab / Taxi',            emoji: '🚗' },
  { value: 'villa',      label: 'Villa',                 emoji: '🏕️' },
  { value: 'homestay',   label: 'Homestay',              emoji: '🏡' },
  { value: 'hostel',     label: 'Hostel / Room Stay',    emoji: '🛋️' },
  { value: 'devotional', label: 'Devotional Trip',       emoji: '🛕' },
  { value: 'foreign',    label: 'Foreign Trip',          emoji: '✈️' },
  { value: 'food',       label: 'Food Experience',       emoji: '🍽️' },
  { value: 'adventure',  label: 'Adventure Activities',  emoji: '🧗' },
  { value: 'guide',      label: 'Local Guides',          emoji: '🧭' },
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
  images: string[];
  imageUrl: string;
  // Itinerary
  itinerary: ItineraryDay[];
  // Inclusions / Exclusions
  inclusions: string;
  exclusions: string;
  cancellationPolicy: string;

  // Food Experience Specific (Steps 1, 2, 3, 4)
  foodRestaurantName: string;
  foodBusinessType: string;
  foodAddress: string;
  foodGoogleMapsUrl: string;
  foodCuisines: string[];
  foodContactNumber: string;
  foodWhatsappNumber: string;
  foodOpeningTime: string;
  foodClosingTime: string;
  foodLogoUrl: string;
  foodFormat: string;
  foodDietaryOptions: string[];
  foodMenuItems: FoodMenuItem[];
  foodBasePrice: string;
  foodPricePerPerson: string;
  foodMinOrderAmount: string;
  foodTaxesIncluded: string;
  foodExtraCharges: string;
  foodDiscountPercent: string;
  foodMenuTimings: string;
  foodTastingCount: string;
  foodBeveragesIncluded: boolean;
  foodAlcoholPolicy: string;
  foodBookingService: string;
  foodAvailableDays: string[];
  foodTableCapacity: string;
  foodAvailableTables: string;
  foodAdvanceBooking: string;
  foodMaxPartySize: string;
  foodBookingTimeSlots: string;
  foodReservationDuration: string;
  foodMorningSlots: string;
  foodEveningSlots: string;
  foodSpecialRequests: string;
  foodMeetingLandmark: string;
  foodWalkingDistance: string;
  foodFssaiCompliance: boolean;
  foodFssaiNumber: string;
  foodHygieneInfo: string;
  foodCancellationPolicy: string;
  foodRefundPolicy: string;
  foodLateArrivalPolicy: string;
  foodNoShowPolicy: string;
  foodConfirmationMethod: string;
  foodBusinessRegDetails: string;
  foodGstin: string;

  // Adventure Activity Specific (Steps 1, 2, 3, 4)
  advCategory: string;
  advDurationHours: string;
  advMinAge: string;
  advMaxParticipants: string;
  advMinParticipants: string;
  advDifficulty: string;
  advEnvironment: string;
  advLocationName: string;
  advGoogleMapsUrl: string;
  advPricePerPerson: string;
  advAdultPrice: string;
  advChildPrice: string;
  advGroupPrice: string;
  advPricingType: string;
  advTaxesIncluded: string;
  advAdditionalCharges: string;
  advDiscounts: string;
  advEquipmentIncluded: string[];
  advSafetyGearIncluded: string;
  advEquipmentList: string;
  advInstructorAvailable: string;
  advGuideIncluded: string;
  advChangingRoom: boolean;
  advLockerFacility: boolean;
  advRefreshments: boolean;
  advExtraEquipmentCharges: string;
  advInstructorCertifications: string;
  advInstructorRatio: string;
  advAvailableDays: string[];
  advOpeningTime: string;
  advClosingTime: string;
  advTimeSlots: string;
  advMaxPerSlot: string;
  advBookingCutoff: string;
  advAdvanceBooking: string;
  advSeasonalAvailability: string;
  advBlackoutDates: string;
  advStartPoint: string;
  advCheckinTime: string;
  advStartTime: string;
  advCompletionTime: string;
  advInstructionsBefore: string;
  advWhatToBring: string;
  advDressCode: string;
  advWeatherRestrictions: string;
  advTransportationAvailable: string;
  advBatchSlots: string;
  advPackingChecklist: string;
  advSafetyInstructions: string;
  advRiskLevel: string;
  advMandatoryGear: boolean;
  advTrainedInstructorOnSite: boolean;
  advEmergencyContact: string;
  advFirstAidFacility: boolean;
  advInsuranceCoverage: string;
  advMedicalRestrictions: string[];
  advSwimmingRequirement: string;
  advWeightRestrictions: string;
  advFitnessPrerequisites: string;
  advCancellationPolicy: string;
  advRefundPolicy: string;
  advReschedulingPolicy: string;
  advBadWeatherPolicy: string;
  advLateArrivalPolicy: string;
  advNoShowPolicy: string;
  advSafetyCertifications: string;

  // Local Guide Specific (Steps 1, 2, 3, 4)
  guideFullName: string;
  guideServiceCategory: string;
  guideExperienceYears: string;
  guideLanguages: string[];
  guideServiceAreas: string;
  guideMeetingPoint: string;
  guideGoogleMapsUrl: string;
  guideType: string;
  guideSpecialization: string;
  guideTourFormat: string;
  guideCertificationType: string;
  guideLicenseId: string;
  guidePricingType: string;
  guidePricePerHour: string;
  guideHalfDayPrice: string;
  guideFullDayPrice: string;
  guideGroupPrice: string;
  guideAdditionalPersonCharge: string;
  guideChildPrice: string;
  guideTransportationIncluded: string;
  guideTicketHandling: string;
  guideAdditionalCharges: string;
  guideTaxesIncluded: string;
  guideAvailableDays: string[];
  guideStartingTime: string;
  guideEndingTime: string;
  guideTimeSlots: string;
  guideMaxCustomersPerSlot: string;
  guideAdvanceBooking: string;
  guideMinDuration: string;
  guideAudioWhisperHeadsets: boolean;
  guideTicketQueueAssistance: boolean;
  guideTourStartingPoint: string;
  guideTourEndingPoint: string;
  guideWalkingDistance: string;
  guideKeyMonuments: string;
  guideTopics: string;
  guideRouteOverview: string;
  guideStops: GuideTourStop[];
  guideSpecialInstructions: string;
  guideWhatToBring: string;
  guideTourismAffiliation: string;
  guideEmergencyContact: string;
  guideCancellationPolicy: string;
  guideRefundPolicy: string;
  guideReschedulingPolicy: string;
  guideBadWeatherPolicy: string;
  guideLateArrivalPolicy: string;
  guideNoShowPolicy: string;
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
  baseFare: '',
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
  state: '',
  pinCode: '',
  maximumGuests: '10',
  bedrooms: '4',
  beds: '4',
  bathrooms: '3',
  villaAmenities: ['Private Pool', 'Parking', 'Wi-Fi'],
  villaPricePerNight: '',
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
      pricePerNight: '',
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
  basePrice: '',
  discountPercent: '0',
  images: [],
  imageUrl: '',
  itinerary: [
    { day: 1, title: 'Arrival & Check-in', description: '' },
    { day: 2, title: 'Sightseeing', description: '' },
  ],
  inclusions: '',
  exclusions: '',
  cancellationPolicy: '',

  // Food Experience Defaults
  foodRestaurantName: '',
  foodBusinessType: 'Restaurant / Fine Dining',
  foodAddress: '',
  foodGoogleMapsUrl: '',
  foodCuisines: [],
  foodContactNumber: '',
  foodWhatsappNumber: '',
  foodOpeningTime: '11:00',
  foodClosingTime: '23:00',
  foodLogoUrl: '',
  foodFormat: 'Home Dining & Family Meal',
  foodDietaryOptions: [],
  foodMenuItems: [],
  foodBasePrice: '',
  foodPricePerPerson: '',
  foodMinOrderAmount: '',
  foodTaxesIncluded: 'Included',
  foodExtraCharges: '',
  foodDiscountPercent: '0',
  foodMenuTimings: 'Lunch & Dinner',
  foodTastingCount: '5 Courses',
  foodBeveragesIncluded: true,
  foodAlcoholPolicy: 'No Alcohol Served (Family Environment)',
  foodBookingService: 'Table Reservation',
  foodAvailableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  foodTableCapacity: '30',
  foodAvailableTables: '8',
  foodAdvanceBooking: '2 Hours Prior',
  foodMaxPartySize: '12',
  foodBookingTimeSlots: '12:30 PM, 02:00 PM, 07:30 PM, 09:00 PM',
  foodReservationDuration: '90 Minutes',
  foodMorningSlots: '12:00 PM - 03:30 PM',
  foodEveningSlots: '07:00 PM - 11:00 PM',
  foodSpecialRequests: 'High chairs available, Jain preparations on request',
  foodMeetingLandmark: '',
  foodWalkingDistance: '',
  foodFssaiCompliance: false,
  foodFssaiNumber: '',
  foodHygieneInfo: 'Packaged mineral water and sanitized tables',
  foodCancellationPolicy: 'Free cancellation up to 4 hours before booking slot.',
  foodRefundPolicy: 'Full refund if cancelled before 4 hours.',
  foodLateArrivalPolicy: 'Tables held for 15 minutes past reservation time.',
  foodNoShowPolicy: 'No-show after 20 minutes releases table to waitlist.',
  foodConfirmationMethod: 'Instant Auto-Confirmation',
  foodBusinessRegDetails: '',
  foodGstin: '',

  // Adventure Activity Defaults
  advCategory: 'Trekking & Hiking',
  advDurationHours: '3 Hours',
  advMinAge: '12',
  advMaxParticipants: '15',
  advMinParticipants: '1',
  advDifficulty: 'Moderate (Basic Fitness Required)',
  advEnvironment: 'Outdoor Wilderness',
  advLocationName: '',
  advGoogleMapsUrl: '',
  advPricePerPerson: '',
  advAdultPrice: '',
  advChildPrice: '',
  advGroupPrice: '',
  advPricingType: 'Per Person',
  advTaxesIncluded: 'Included',
  advAdditionalCharges: '',
  advDiscounts: '0',
  advEquipmentIncluded: [],
  advSafetyGearIncluded: '',
  advEquipmentList: '',
  advInstructorAvailable: 'Yes',
  advGuideIncluded: 'Yes',
  advChangingRoom: false,
  advLockerFacility: false,
  advRefreshments: false,
  advExtraEquipmentCharges: '',
  advInstructorCertifications: '',
  advInstructorRatio: '1 Instructor per 4 Participants',
  advAvailableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  advOpeningTime: '06:00',
  advClosingTime: '18:00',
  advTimeSlots: '06:00 AM, 09:30 AM, 02:00 PM',
  advMaxPerSlot: '12',
  advBookingCutoff: '12 Hours Prior',
  advAdvanceBooking: 'Yes',
  advSeasonalAvailability: 'October to May',
  advBlackoutDates: '',
  advStartPoint: '',
  advCheckinTime: '30 mins before activity',
  advStartTime: '06:30 AM',
  advCompletionTime: '10:00 AM',
  advInstructionsBefore: 'Safety briefing mandatory before entering launch area',
  advWhatToBring: 'Change of clothes, towel, strap sandals, sunscreen',
  advDressCode: 'Comfortable athletic wear / swimwear with straps',
  advWeatherRestrictions: 'Cancelled during thunder, heavy rain, or high winds',
  advTransportationAvailable: 'No',
  advBatchSlots: '06:00 AM, 09:30 AM, 02:00 PM',
  advPackingChecklist: 'Hydration bottle, dry bag, personal medications',
  advSafetyInstructions: 'Follow instructor whistle codes and stay within boundary',
  advRiskLevel: 'Moderate (Standard Outdoor Risk)',
  advMandatoryGear: false,
  advTrainedInstructorOnSite: false,
  advEmergencyContact: '',
  advFirstAidFacility: false,
  advInsuranceCoverage: '',
  advMedicalRestrictions: [],
  advSwimmingRequirement: 'Not Required (Life Jacket Provided)',
  advWeightRestrictions: 'Under 120 kg',
  advFitnessPrerequisites: 'Basic stamina to walk/swim 30 minutes',
  advCancellationPolicy: 'Free cancellation up to 24 hours before activity.',
  advRefundPolicy: '100% refund for weather cancellations.',
  advReschedulingPolicy: 'Free rescheduling allowed up to 12 hours prior.',
  advBadWeatherPolicy: 'Rescheduled or 100% refunded in case of rain/storm.',
  advLateArrivalPolicy: 'Late arrivals join next available batch if open.',
  advNoShowPolicy: 'No-show without notice non-refundable.',
  advSafetyCertifications: '',

  // Local Guide Defaults
  guideFullName: '',
  guideServiceCategory: 'Heritage & Culture Walk',
  guideExperienceYears: '',
  guideLanguages: [],
  guideServiceAreas: '',
  guideMeetingPoint: '',
  guideGoogleMapsUrl: '',
  guideType: 'Individual Local Guide',
  guideSpecialization: 'Heritage, Monuments & Archaeology',
  guideTourFormat: 'Private Guided Tour (Exclusive for booked party)',
  guideCertificationType: 'None',
  guideLicenseId: '',
  guidePricingType: 'Full Day (Up to 8 Hours)',
  guidePricePerHour: '',
  guideHalfDayPrice: '',
  guideFullDayPrice: '',
  guideGroupPrice: '',
  guideAdditionalPersonCharge: '',
  guideChildPrice: '',
  guideTransportationIncluded: 'Walking Tour (No Transport Needed)',
  guideTicketHandling: 'Customer Buys Directly at Monument Counter',
  guideAdditionalCharges: '',
  guideTaxesIncluded: 'Included',
  guideAvailableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  guideStartingTime: '08:30',
  guideEndingTime: '17:30',
  guideTimeSlots: '09:00 AM, 02:00 PM',
  guideMaxCustomersPerSlot: '10',
  guideAdvanceBooking: '1 Day Prior',
  guideMinDuration: '3 Hours',
  guideAudioWhisperHeadsets: false,
  guideTicketQueueAssistance: false,
  guideTourStartingPoint: '',
  guideTourEndingPoint: '',
  guideWalkingDistance: '',
  guideKeyMonuments: '',
  guideTopics: 'Historical folklore, dynasties, local hidden gems',
  guideRouteOverview: '',
  guideStops: [],
  guideSpecialInstructions: 'Modest attire covering shoulders & knees for sanctums',
  guideWhatToBring: 'Comfortable walking shoes, sunglasses, valid govt ID',
  guideTourismAffiliation: '',
  guideEmergencyContact: '',
  guideCancellationPolicy: 'Free cancellation up to 12 hours before tour time.',
  guideRefundPolicy: 'Full refund within 12-hour window.',
  guideReschedulingPolicy: 'Free rescheduling allowed subject to guide availability.',
  guideBadWeatherPolicy: 'Tours proceed with rain ponchos or indoor museum stops.',
  guideLateArrivalPolicy: 'Guide waits up to 30 minutes at starting landmark.',
  guideNoShowPolicy: 'No-show without notification after 45 minutes cancelled.',
};

function getDefaultFormForListingType(t: ListingType): FormData {
  return {
    ...INITIAL_FORM,
    listingType: t,
    category: t,
    title: '',
    description: '',
    images: [],
    imageUrl: '',
    destinationInput: '',
    destinationCity: '',
    destinationState: '',
    durationDays: t === 'cab' ? '1' : t === 'food' || t === 'guide' ? '1' : '3',
    durationNights: t === 'cab' || t === 'food' || t === 'guide' ? '0' : '2',
    maxGroupSize: t === 'cab' ? '4' : t === 'food' ? '12' : t === 'adventure' ? '15' : t === 'guide' ? '10' : '12',
    basePrice: '',
    villaPropertyType: t === 'homestay' ? 'Entire Homestay' : 'Entire Villa',
  };
}

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
const FOOD_STEPS = [
  '1. Restaurant & Food Business',
  '2. Menu & Pricing',
  '3. Booking & Availability',
  '4. Policies & Verification',
] as const;
const ADVENTURE_STEPS = [
  '1. Activity Details',
  '2. Pricing & Gear',
  '3. Schedule & Plan',
  '4. Safety & Policies',
] as const;
const GUIDE_STEPS = [
  '1. Guide Profile & City',
  '2. Pricing & Hours',
  '3. Tour Route & Topics',
  '4. Verification & Policies',
] as const;

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

  // Category-isolated drafts store to prevent cross-category photo & description leakage
  const categoryStore = useRef<Partial<Record<ListingType, FormData>>>({
    tour: { ...INITIAL_FORM },
  });

  // Builder states for inline multi-item list creation
  const [newFoodItem, setNewFoodItem] = useState<FoodMenuItem>({
    id: '',
    name: '',
    description: '',
    category: 'Main Course',
    foodType: 'veg',
    price: '',
    isSpecial: false,
    isBestseller: false,
    imageUrl: '',
  });

  const [newGuideStop, setNewGuideStop] = useState<GuideTourStop>({
    id: '',
    stopName: '',
    location: '',
    durationMinutes: '30',
    description: '',
    landmark: '',
  });

  const isCab = form.listingType === 'cab';
  const isVilla = form.listingType === 'villa' || form.listingType === 'homestay';
  const isHostel = form.listingType === 'hostel';
  const isFood = form.listingType === 'food';
  const isAdventure = form.listingType === 'adventure';
  const isGuide = form.listingType === 'guide';

  const addFoodItem = useCallback(() => {
    if (!newFoodItem.name.trim()) return;
    const item: FoodMenuItem = {
      ...newFoodItem,
      id: Date.now().toString(),
    };
    setForm((prev) => ({
      ...prev,
      foodMenuItems: [...prev.foodMenuItems, item],
    }));
    setNewFoodItem({
      id: '',
      name: '',
      description: '',
      category: 'Main Course',
      foodType: 'veg',
      price: '',
      isSpecial: false,
      isBestseller: false,
      imageUrl: '',
    });
  }, [newFoodItem]);

  const removeFoodItem = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      foodMenuItems: prev.foodMenuItems.filter((it) => it.id !== id),
    }));
  }, []);

  const addGuideStop = useCallback(() => {
    if (!newGuideStop.stopName.trim()) return;
    const stop: GuideTourStop = {
      ...newGuideStop,
      id: Date.now().toString(),
    };
    setForm((prev) => ({
      ...prev,
      guideStops: [...prev.guideStops, stop],
    }));
    setNewGuideStop({
      id: '',
      stopName: '',
      location: '',
      durationMinutes: '30',
      description: '',
      landmark: '',
    });
  }, [newGuideStop]);

  const removeGuideStop = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      guideStops: prev.guideStops.filter((s) => s.id !== id),
    }));
  }, []);

  const steps = isCab
    ? CAB_STEPS
    : isVilla
    ? VILLA_STEPS
    : isHostel
    ? HOSTEL_STEPS
    : isFood
    ? FOOD_STEPS
    : isAdventure
    ? ADVENTURE_STEPS
    : isGuide
    ? GUIDE_STEPS
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
      const rawCat = normalizeCategorySlug(pkg.category);
      const normalizedCat = (['tour', 'cab', 'villa', 'homestay', 'hostel', 'devotional', 'foreign', 'food', 'adventure', 'guide'].includes(rawCat) ? rawCat : 'tour') as ListingType;
      const loadedForm: FormData = {
        ...INITIAL_FORM,
        listingType: normalizedCat,
        title: pkg.name,
        category: normalizedCat,
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
        baseFare: String(pkg.basePrice || ''),
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
        villaPropertyType: normalizedCat === 'homestay' ? 'Entire Homestay' : 'Entire Villa',
        locationName: pkg.destinationName || '',
        address: '',
        city: pkg.city || pkg.destinationName || '',
        state: pkg.state || '',
        pinCode: '',
        maximumGuests: String(pkg.maxGroupSize || 10),
        bedrooms: '4',
        beds: '4',
        bathrooms: '3',
        villaAmenities: ['Private Pool', 'Parking', 'Wi-Fi'],
        villaPricePerNight: String(pkg.basePrice || ''),
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
            pricePerNight: String(pkg.basePrice || ''),
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
        basePrice: String(pkg.basePrice || ''),
        discountPercent: String(pkg.discountPercent || 0),
        foodRestaurantName: normalizedCat === 'food' ? pkg.name : '',
        foodBasePrice: String(pkg.basePrice || ''),
        foodPricePerPerson: String(pkg.basePrice || ''),
        advPricePerPerson: String(pkg.basePrice || ''),
        advAdultPrice: String(pkg.basePrice || ''),
        guideFullDayPrice: String(pkg.basePrice || ''),
        guidePricePerHour: String(pkg.basePrice ? Math.round(pkg.basePrice / 8) : ''),
        images: Array.isArray(pkg.images) && pkg.images.length > 0
          ? pkg.images
          : (pkg as unknown as { imageUrl?: string }).imageUrl
          ? [(pkg as unknown as { imageUrl?: string }).imageUrl!]
          : [],
        imageUrl: pkg.images?.[0] || (pkg as unknown as { imageUrl?: string }).imageUrl || '',
        itinerary: pkg.itinerary && pkg.itinerary.length > 0
          ? pkg.itinerary.map((i) => ({ day: i.day, title: i.title, description: i.description }))
          : INITIAL_FORM.itinerary,
        inclusions: pkg.inclusions?.join('\n') || '',
        exclusions: pkg.exclusions?.join('\n') || '',
        cancellationPolicy: pkg.cancellationPolicy?.notes || '',
      };
      categoryStore.current[normalizedCat] = loadedForm;
      setForm(loadedForm);
    }).catch((err) => {
      if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load listing for editing');
    });
    return () => { isMounted = false; };
  }, [editId]);

  // Helpers to update individual fields
  const set = useCallback(<K extends keyof FormData>(k: K, v: FormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      categoryStore.current[next.listingType] = next;
      return next;
    });
  }, []);

  const handleListingTypeChange = useCallback((newType: ListingType) => {
    setForm((currentForm) => {
      // 1. Save current category's form state (photos, description, title, details)
      categoryStore.current[currentForm.listingType] = { ...currentForm };

      // 2. Load target category's isolated draft if it exists, or create fresh pristine draft
      const savedForNewType = categoryStore.current[newType];
      if (savedForNewType) {
        return {
          ...savedForNewType,
          listingType: newType,
          category: newType,
        };
      }

      const defaultData = getDefaultFormForListingType(newType);
      categoryStore.current[newType] = defaultData;
      return defaultData;
    });

    setStep(1);
    setError(null);
    setImageError(null);
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

  const [savingDraft, setSavingDraft] = useState(false);

  const buildPayload = useCallback((submitForReview: boolean) => {
    // 1. Strict Validation if submitting for admin review
    if (submitForReview) {
      if (!form.title.trim() || form.title.trim().length < 3) {
        throw new Error('Title / Name is required and must be at least 3 characters.');
      }
      if (!form.description.trim() || form.description.trim().length < 10) {
        throw new Error('Description is required and must be at least 10 characters.');
      }
      const hasImages = (Array.isArray(form.images) && form.images.length > 0) || Boolean(form.imageUrl.trim());
      if (!hasImages) {
        throw new Error('Please upload at least one cover photo or image for your listing.');
      }
    }

    const rawImages = Array.isArray(form.images) && form.images.length > 0
      ? form.images
      : form.imageUrl.trim()
      ? [form.imageUrl.trim()]
      : [];

    let payload: Record<string, unknown>;

    if (isCab) {
      const destCity = form.pickupLocation.trim() || form.destinationCity.trim() || form.destinationInput.trim();
      const destState = form.destinationState.trim() || form.state.trim() || 'India';
      const fare = Number(form.baseFare) || Number(form.basePrice) || 0;

      if (submitForReview) {
        if (!destCity) throw new Error('Pickup Location or Destination City is required.');
        if (fare <= 0) throw new Error('Valid base fare is required and must be greater than 0.');
      }

      payload = {
        name: form.title.trim() || 'Cab Service',
        description: form.description.trim() || `${form.cabServiceType} Cab Service with ${form.vehicleType}.`,
        category: 'cab',
        destinationCity: destCity || 'Unspecified',
        destinationState: destState,
        durationDays: 1,
        durationNights: 0,
        maxGroupSize: Number(form.seatingCapacity) || 4,
        basePrice: fare,
        discountPercent: 0,
        images: rawImages,
        highlights: [
          `Service Type: ${form.cabServiceType}`,
          `Vehicle: ${form.vehicleType}${form.vehicleModel ? ` (${form.vehicleModel})` : ''}`,
          `Seating Capacity: ${form.seatingCapacity} Passengers`,
          form.pickupLocation ? `Pickup: ${form.pickupLocation}` : '',
          form.dropLocation ? `Drop: ${form.dropLocation}` : '',
          `Driver: ${form.driverIncluded === 'Yes' ? 'Commercial Driver Included' : 'Self-Drive / Unaccompanied'}`,
          `Air Conditioning: ${form.acType}`,
          fare > 0 ? `Pricing: ₹${fare} Base Fare (₹${form.pricePerKm || '0'}/KM)` : '',
        ].filter(Boolean),
        inclusions: [
          `${form.acType} Vehicle (${form.vehicleType})`,
          form.driverIncluded === 'Yes' ? 'Commercial Driver Allowance' : '',
          Number(form.tollCharges) > 0 ? `Toll Charges (₹${form.tollCharges})` : '',
          Number(form.parkingCharges) > 0 ? `Parking charges (₹${form.parkingCharges})` : '',
        ].filter(Boolean),
        exclusions: [
          'Interstate permits / Border tax (if applicable outside state)',
          form.waitingChargesPerHour ? `Waiting charges: ₹${form.waitingChargesPerHour}/hour after free pickup window` : '',
          form.extraKmCharges ? `Extra KM charges: ₹${form.extraKmCharges}/KM beyond trip distance` : '',
        ].filter(Boolean),
        cancellationPolicy: form.cancellationPolicy.trim() || 'Free cancellation up to 6 hours before scheduled pickup time.',
        tags: [
          'cab',
          'taxi',
          form.cabServiceType?.toLowerCase(),
          form.vehicleType?.toLowerCase(),
          form.pickupLocation?.toLowerCase(),
          form.dropLocation?.toLowerCase(),
        ].filter(Boolean),
        submitForReview,
      };
    } else if (isVilla) {
      const destCity = form.city.trim() || form.destinationCity.trim() || form.destinationInput.trim();
      const destState = form.state.trim() || form.destinationState.trim() || 'India';
      const nightPrice = Number(form.villaPricePerNight) || Number(form.basePrice) || 0;
      const discount = Number(form.villaDiscountPercent) || 0;

      if (submitForReview) {
        if (!destCity) throw new Error('Property City / Location is required.');
        if (nightPrice <= 0) throw new Error('Price per night is required and must be greater than 0.');
      }

      payload = {
        name: form.title.trim() || 'Villa / Homestay Property',
        description: form.description.trim() || `${form.villaPropertyType} in ${destCity || 'scenic location'}.`,
        category: form.listingType,
        destinationCity: destCity || 'Unspecified',
        destinationState: destState,
        durationDays: 1,
        durationNights: 1,
        maxGroupSize: Number(form.maximumGuests) || 10,
        basePrice: nightPrice,
        discountPercent: discount,
        images: rawImages,
        highlights: [
          `Property Type: ${form.villaPropertyType}`,
          `Capacity: Up to ${form.maximumGuests} Guests`,
          `Rooms: ${form.bedrooms} Bedrooms · ${form.beds} Beds · ${form.bathrooms} Bathrooms`,
          destCity ? `Location: ${form.locationName || form.address ? `${form.locationName || form.address}, ` : ''}${destCity}, ${destState}` : '',
          form.villaAmenities.length > 0 ? `Amenities: ${form.villaAmenities.join(', ')}` : '',
        ].filter(Boolean),
        inclusions: [
          `Accommodation in ${form.villaPropertyType}`,
          ...form.villaAmenities,
          'Clean Linens, Towels and Toiletries',
          Number(form.villaCleaningFee) > 0 ? `Cleaning Fee: ₹${form.villaCleaningFee}` : '',
        ].filter(Boolean),
        exclusions: [
          Number(form.villaSecurityDeposit) > 0 ? `Refundable Security Deposit: ₹${form.villaSecurityDeposit}` : '',
          Number(form.villaExtraGuestCharge) > 0 ? `Extra Guest Charge: ₹${form.villaExtraGuestCharge} / night` : '',
          form.villaHouseRules.length > 0 ? `House Rules: ${form.villaHouseRules.join(', ')}` : '',
        ].filter(Boolean),
        cancellationPolicy: form.cancellationPolicy.trim() || 'Free cancellation up to 48 hours before check-in.',
        tags: [
          form.listingType,
          'stay',
          'villa',
          form.villaPropertyType.toLowerCase(),
          destCity?.toLowerCase(),
        ].filter(Boolean),
        submitForReview,
      };
    } else if (isHostel) {
      const destCity = form.city.trim() || form.destinationCity.trim() || form.destinationInput.trim();
      const destState = form.state.trim() || form.destinationState.trim() || 'India';
      const validRoomPrices = form.hostelRooms
        .map((r) => Number(r.pricePerNight))
        .filter((p) => p > 0);
      const lowestPrice = validRoomPrices.length > 0 ? Math.min(...validRoomPrices) : Number(form.basePrice) || 0;
      const maxBeds = Math.max(...form.hostelRooms.map((r) => Number(r.totalBeds) || 0), 0);

      if (submitForReview) {
        if (!destCity) throw new Error('Hostel City / Location is required.');
        if (lowestPrice <= 0) throw new Error('Price per night is required for hostel rooms.');
      }

      payload = {
        name: form.title.trim() || 'Hostel Accommodation',
        description: form.description.trim() || `${form.hostelPropertyType} in ${destCity || 'prime location'}.`,
        category: 'hostel',
        destinationCity: destCity || 'Unspecified',
        destinationState: destState,
        durationDays: 1,
        durationNights: 1,
        maxGroupSize: maxBeds || 12,
        basePrice: lowestPrice,
        discountPercent: 0,
        images: rawImages,
        highlights: [
          `Property Type: ${form.hostelPropertyType}`,
          `Room Types: ${form.hostelRooms.map((r) => `${r.roomName || 'Dorm'} (${r.gender}) - ₹${r.pricePerNight || '0'}/night`).join(' · ')}`,
          `Timings: Check-in ${form.hostelCheckInTime} · Check-out ${form.hostelCheckOutTime}`,
          destCity ? `Location: ${form.locationName || form.address ? `${form.locationName || form.address}, ` : ''}${destCity}, ${destState}` : '',
          form.hostelAmenities.length > 0 ? `Amenities: ${form.hostelAmenities.join(', ')}` : '',
        ].filter(Boolean),
        inclusions: [
          'Bunk bed accommodation as per selected room',
          'Personal Locker / Safe Storage',
          'High-Speed Wi-Fi',
          ...form.hostelAmenities.filter((a) => a !== 'High-Speed Wi-Fi'),
          'Clean Bed Linen & Pillow',
        ].filter(Boolean),
        exclusions: [
          'Towel rental (available at front desk)',
          'Food & Beverages unless purchased separately',
          'Valid Govt ID required at check-in',
        ],
        cancellationPolicy: form.cancellationPolicy.trim() || 'Free cancellation up to 24 hours before check-in time.',
        tags: [
          'hostel',
          'backpacker',
          'dormitory',
          form.hostelPropertyType.toLowerCase(),
          destCity?.toLowerCase(),
        ].filter(Boolean),
        submitForReview,
      };
    } else if (isFood) {
      const destCity = form.destinationCity.trim() || form.destinationInput.trim() || form.foodAddress.trim();
      const destState = form.destinationState.trim() || 'India';
      const foodPrice =
        Number(form.foodBasePrice) ||
        Number(form.foodPricePerPerson) ||
        Number(form.basePrice) ||
        (form.foodMenuItems.length > 0 && Number(form.foodMenuItems[0].price) > 0 ? Number(form.foodMenuItems[0].price) : 0);

      if (submitForReview) {
        if (!destCity) throw new Error('Destination / City is required for Food Experience.');
        if (foodPrice <= 0 && form.foodMenuItems.length === 0) {
          throw new Error('Valid food experience price or menu item pricing is required.');
        }
      }

      payload = {
        name: form.title.trim() || form.foodRestaurantName.trim() || 'Food Experience',
        description: form.description.trim() || `${form.foodBusinessType} experience in ${destCity || 'city'}.`,
        category: 'food',
        destinationCity: destCity || 'Unspecified',
        destinationState: destState,
        durationDays: 1,
        durationNights: 0,
        maxGroupSize: Number(form.foodMaxPartySize) || Number(form.maxGroupSize) || 12,
        basePrice: foodPrice,
        discountPercent: Number(form.foodDiscountPercent) || 0,
        images: rawImages,
        highlights: [
          `Business Type: ${form.foodBusinessType}`,
          form.foodCuisines.length > 0 ? `Cuisines: ${form.foodCuisines.join(', ')}` : '',
          form.foodDietaryOptions.length > 0 ? `Dietary Options: ${form.foodDietaryOptions.join(', ')}` : '',
          `Food Format: ${form.foodFormat}`,
          `Operating Hours: ${form.foodOpeningTime} - ${form.foodClosingTime}`,
          `Service: ${form.foodBookingService}`,
          form.foodAvailableDays.length > 0 ? `Available Days: ${form.foodAvailableDays.join(', ')}` : '',
          form.foodFssaiCompliance && form.foodFssaiNumber.trim() ? `FSSAI Registered: ${form.foodFssaiNumber.trim()}` : '',
        ].filter(Boolean),
        inclusions: [
          form.foodTastingCount ? `Curated food tastings (${form.foodTastingCount})` : 'Curated meal experience',
          form.foodBeveragesIncluded ? 'Beverages & drinking water included' : 'Filtered water provided',
          'Reserved dining area & dedicated service',
          ...(form.foodMenuItems.length > 0 ? form.foodMenuItems.slice(0, 5).map((m) => `${m.name} (${m.foodType}) - ₹${m.price}`) : []),
        ].filter(Boolean),
        exclusions: [
          `Alcohol Policy: ${form.foodAlcoholPolicy}`,
          form.foodExtraCharges ? `Extra Charges: ${form.foodExtraCharges}` : '',
          Number(form.foodMinOrderAmount) > 0 ? `Minimum order value: ₹${form.foodMinOrderAmount}` : '',
        ].filter(Boolean),
        cancellationPolicy: form.foodCancellationPolicy.trim() || form.cancellationPolicy.trim() || 'Free cancellation up to 4 hours before reservation slot.',
        tags: [
          'food',
          'dining',
          'culinary',
          form.foodBusinessType.toLowerCase(),
          ...form.foodCuisines.map((c) => c.toLowerCase()),
          destCity?.toLowerCase(),
        ].filter(Boolean),
        submitForReview,
      };
    } else if (isAdventure) {
      const destCity = form.destinationCity.trim() || form.destinationInput.trim();
      const destState = form.destinationState.trim() || 'India';
      const advPrice =
        Number(form.advPricePerPerson) ||
        Number(form.advAdultPrice) ||
        Number(form.advGroupPrice) ||
        Number(form.basePrice) ||
        0;

      if (submitForReview) {
        if (!destCity) throw new Error('Destination / City is required for Adventure Activity.');
        if (advPrice <= 0) throw new Error('Adventure activity price is required and must be greater than 0.');
      }

      payload = {
        name: form.title.trim() || 'Adventure Activity',
        description: form.description.trim() || `${form.advCategory} activity in ${destCity || 'nature'}.`,
        category: 'adventure',
        destinationCity: destCity || 'Unspecified',
        destinationState: destState,
        durationDays: 1,
        durationNights: 0,
        maxGroupSize: Number(form.advMaxParticipants) || Number(form.maxGroupSize) || 15,
        basePrice: advPrice,
        discountPercent: Number(form.advDiscounts) || 0,
        images: rawImages,
        highlights: [
          `Activity Type: ${form.advCategory}`,
          `Difficulty Level: ${form.advDifficulty}`,
          `Environment: ${form.advEnvironment}`,
          form.advDurationHours ? `Duration: ${form.advDurationHours}` : '',
          form.advMinAge ? `Age Requirements: Minimum ${form.advMinAge} Years` : '',
          form.advMandatoryGear ? 'Certified Safety Gear Mandatory' : '',
          form.advInstructorAvailable === 'Yes' ? `Instructor: Certified Trainer${form.advInstructorRatio ? ` (${form.advInstructorRatio})` : ''}` : '',
          form.advInstructorCertifications.trim() ? `Instructor Certifications: ${form.advInstructorCertifications.trim()}` : '',
          form.advInsuranceCoverage.trim() && !form.advInsuranceCoverage.includes('Not Included') ? `Insurance: ${form.advInsuranceCoverage.trim()}` : '',
        ].filter(Boolean),
        inclusions: [
          'Full activity session with safety marshals',
          form.advSafetyGearIncluded ? `Safety Gear: ${form.advSafetyGearIncluded}` : 'Standard protective gear as applicable',
          form.advLockerFacility ? 'Locker and luggage storage' : '',
          form.advChangingRoom ? 'Changing rooms access' : '',
          form.advRefreshments ? 'Hydration & energy refreshments' : '',
          form.advFirstAidFacility ? 'Emergency First Aid Kit & On-site assistance' : '',
        ].filter(Boolean),
        exclusions: [
          'Personal accidental insurance unless selected',
          form.advExtraEquipmentCharges ? `Extra equipment rental: ${form.advExtraEquipmentCharges}` : '',
          'Transport to base camp unless selected',
        ].filter(Boolean),
        cancellationPolicy: form.advCancellationPolicy.trim() || form.cancellationPolicy.trim() || 'Free cancellation up to 24 hours prior. Subject to weather conditions.',
        tags: [
          'adventure',
          'activity',
          'outdoor',
          form.advCategory.toLowerCase(),
          form.advDifficulty.toLowerCase(),
          destCity?.toLowerCase(),
        ].filter(Boolean),
        submitForReview,
      };
    } else if (isGuide) {
      const destCity = form.destinationCity.trim() || form.destinationInput.trim();
      const destState = form.destinationState.trim() || 'India';
      const guidePrice =
        Number(form.guideFullDayPrice) ||
        Number(form.guideHalfDayPrice) ||
        Number(form.guidePricePerHour) ||
        Number(form.guideGroupPrice) ||
        Number(form.basePrice) ||
        0;

      if (submitForReview) {
        if (!destCity) throw new Error('Destination / City is required for Guide Service.');
        if (guidePrice <= 0) throw new Error('Guide service fee is required and must be greater than 0.');
      }

      payload = {
        name: form.title.trim() || form.guideFullName.trim() || 'Local Guide Service',
        description: form.description.trim() || `Local guide service in ${destCity || 'city'} covering heritage and culture.`,
        category: 'guide',
        destinationCity: destCity || 'Unspecified',
        destinationState: destState,
        durationDays: 1,
        durationNights: 0,
        maxGroupSize: Number(form.guideMaxCustomersPerSlot) || Number(form.maxGroupSize) || 10,
        basePrice: guidePrice,
        discountPercent: 0,
        images: rawImages,
        highlights: [
          `Guide: ${form.guideFullName || form.title}${form.guideExperienceYears ? ` (${form.guideExperienceYears} Years Exp)` : ''}`,
          `Specialization: ${form.guideSpecialization}`,
          form.guideLanguages.length > 0 ? `Languages: ${form.guideLanguages.join(', ')}` : '',
          `Tour Format: ${form.guideTourFormat}`,
          form.guideTourStartingPoint || form.guideMeetingPoint ? `Starting Point: ${form.guideTourStartingPoint || form.guideMeetingPoint}` : '',
          `Tour Duration: ${form.guidePricingType}${form.guideStartingTime && form.guideEndingTime ? ` (${form.guideStartingTime} - ${form.guideEndingTime})` : ''}`,
          form.guideCertificationType && form.guideCertificationType !== 'None'
            ? `Credentials: ${form.guideCertificationType}${form.guideLicenseId ? ` (ID: ${form.guideLicenseId})` : ''}`
            : 'Independent Local Storyteller & Guide',
        ].filter(Boolean),
        inclusions: [
          'Dedicated private/group local storytelling guide',
          form.guideAudioWhisperHeadsets ? 'Audio whisper headsets for clear commentary' : '',
          form.guideTicketQueueAssistance ? 'Priority ticket queue management & assistance' : '',
          form.guideTransportationIncluded === 'Yes' ? 'Local transfer between monuments included' : '',
        ].filter(Boolean),
        exclusions: [
          'Monument / Museum entry tickets (unless arranged separately)',
          'Food, snacks & personal purchases',
          'Gratuities / tips',
        ],
        cancellationPolicy: form.guideCancellationPolicy.trim() || form.cancellationPolicy.trim() || 'Free cancellation up to 12 hours prior to scheduled tour time.',
        tags: [
          'guide',
          'local-guide',
          'heritage',
          'storytelling',
          form.guideSpecialization.toLowerCase(),
          ...form.guideLanguages.map((l) => l.toLowerCase()),
          destCity?.toLowerCase(),
        ].filter(Boolean),
        submitForReview,
      };
    } else {
      const destCity = form.destinationCity.trim() || form.destinationInput.trim();
      const destState = form.destinationState.trim() || 'India';
      const tourPrice = Number(form.basePrice) || 0;

      if (submitForReview) {
        if (!destCity) throw new Error('Destination City is required for Tour Package.');
        if (tourPrice <= 0) throw new Error('Package base price is required and must be greater than 0.');
      }

      payload = {
        name: form.title.trim() || 'Tour Package',
        description: form.description.trim() || `Travel experience in ${destCity || 'scenic destination'}.`,
        category: form.category,
        destinationCity: destCity || 'Unspecified',
        destinationState: destState,
        durationDays: Number(form.durationDays) || 1,
        durationNights: Number(form.durationNights) ?? Math.max(0, (Number(form.durationDays) || 1) - 1),
        maxGroupSize: Number(form.maxGroupSize) || 10,
        basePrice: tourPrice,
        discountPercent: Number(form.discountPercent) || 0,
        images: rawImages,
        itinerary: form.itinerary,
        inclusions: form.inclusions.split('\n').map((s) => s.trim()).filter(Boolean),
        exclusions: form.exclusions.split('\n').map((s) => s.trim()).filter(Boolean),
        cancellationPolicy: form.cancellationPolicy,
        tags: [
          form.category,
          destCity?.toLowerCase(),
          destState?.toLowerCase(),
        ].filter(Boolean) as string[],
        submitForReview,
      };
    }

    return payload;
  }, [form, isCab, isVilla, isHostel, isFood, isAdventure, isGuide]);

  const handleSubmit = useCallback(async () => {
    if (verificationStatus !== 'VERIFIED') {
      setError('KYC Verification Required: Your business profile must be verified by admin before submitting listings.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = buildPayload(true);
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
  }, [buildPayload, editId, verificationStatus, router]);

  const handleSaveDraft = useCallback(async () => {
    setSavingDraft(true);
    setError(null);
    try {
      const payload = buildPayload(false);
      if (editId) {
        await packageService.updateProviderPackage(editId, payload as any);
      } else {
        await packageService.createProviderPackage(payload as any);
      }

      router.push(ROUTES.PROVIDER_PACKAGES);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
      setSavingDraft(false);
    }
  }, [buildPayload, editId, router]);

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
        <CoverImageUploader
          key={`cab_uploader_${form.listingType}`}
          label="Vehicle Photos (Optional)"
          category="cab"
          required={false}
          images={form.images}
          value={form.imageUrl}
          onChange={(val, all) => {
            const list = Array.isArray(val) ? val : all || [val].filter(Boolean);
            setForm((prev) => {
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

      {/* Navigation Buttons */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => {
            if (!form.title.trim() || form.title.trim().length < 3) {
              setError('Service Name is required and must be at least 3 characters');
              return;
            }
            if (!form.pickupLocation.trim()) {
              setError('Pickup Location is required');
              return;
            }
            if (!form.imageUrl && (!Array.isArray(form.images) || form.images.length === 0)) {
              setError('Please upload at least one vehicle photo');
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
          onClick={() => {
            if (!Number(form.baseFare) || Number(form.baseFare) <= 0) {
              setError('Base fare is required and must be greater than 0');
              return;
            }
            setError(null);
            setStep(3);
          }}
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
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setStep(3)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Back
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={submitting || savingDraft}
              isLoading={savingDraft}
              onClick={handleSaveDraft}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8 w-full sm:w-auto"
              disabled={savingDraft}
              isLoading={submitting}
              onClick={handleSubmit}
            >
              {verificationStatus !== 'VERIFIED'
                ? 'Verification Required'
                : 'Submit for Approval'}
            </Button>
          </div>
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
          <CoverImageUploader
            key={`villa_uploader_${form.listingType}`}
            label={form.listingType === 'homestay' ? 'Homestay Images & Cover Photo' : 'Villa Images & Cover Photo'}
            category={form.listingType === 'homestay' ? 'homestay' : 'villa'}
            required={true}
            images={form.images}
            value={form.imageUrl}
            onChange={(val, all) => {
              const list = Array.isArray(val) ? val : all || [val].filter(Boolean);
              setForm((prev) => {
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
              if (!form.title.trim() || form.title.trim().length < 3) {
                setError('Property Name is required and must be at least 3 characters');
                return;
              }
              if (!form.city.trim() && !form.destinationCity.trim() && !form.destinationInput.trim()) {
                setError('City / Location is required');
                return;
              }
              if (!form.imageUrl && (!Array.isArray(form.images) || form.images.length === 0)) {
                setError('Please upload at least one property photo');
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
          onClick={() => {
            if (!Number(form.villaPricePerNight) || Number(form.villaPricePerNight) <= 0) {
              setError('Price per night is required and must be greater than 0');
              return;
            }
            setError(null);
            setStep(3);
          }}
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

        {/* Cover & Gallery Preview */}
        {(form.imageUrl || form.images.length > 0) && (
          <div className="space-y-2">
            <div className="relative h-56 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.images[0] || form.imageUrl}
                alt="Property cover preview"
                className="h-full w-full object-cover"
              />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-md">
                ★ Primary Cover
              </span>
            </div>
            {form.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {form.images.slice(1).map((url, i) => (
                  <div key={i} className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Property gallery ${i + 2}`} className="h-full w-full object-cover" />
                  </div>
                ))}
                <span className="text-xs text-slate-500 font-medium pl-1">
                  +{form.images.length - 1} property photo{form.images.length - 1 > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

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
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setStep(3)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Back
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={submitting || savingDraft}
              isLoading={savingDraft}
              onClick={handleSaveDraft}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8 w-full sm:w-auto"
              disabled={savingDraft}
              isLoading={submitting}
              onClick={handleSubmit}
            >
              {verificationStatus !== 'VERIFIED'
                ? 'Verification Required'
                : 'Submit for Approval'}
            </Button>
          </div>
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
        <CoverImageUploader
          key={`hostel_uploader_${form.listingType}`}
          label="Property & Dormitory Images"
          category="hostel"
          required={true}
          images={form.images}
          value={form.imageUrl}
          onChange={(val, all) => {
            const list = Array.isArray(val) ? val : all || [val].filter(Boolean);
            setForm((prev) => {
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

      {/* Navigation Buttons */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6"
          onClick={() => {
            if (!form.title.trim() || form.title.trim().length < 3) {
              setError('Hostel Name is required and must be at least 3 characters');
              return;
            }
            if (!form.city.trim() && !form.destinationCity.trim() && !form.destinationInput.trim()) {
              setError('City / Location is required');
              return;
            }
            if (!form.imageUrl && (!Array.isArray(form.images) || form.images.length === 0)) {
              setError('Please upload at least one hostel photo');
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
            const invalidPrice = form.hostelRooms.find((r) => !Number(r.pricePerNight) || Number(r.pricePerNight) <= 0);
            if (invalidPrice) {
              setError('Please specify a valid price per night greater than 0 for all rooms.');
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

        {/* Cover & Gallery Preview */}
        {(form.imageUrl || form.images.length > 0) && (
          <div className="space-y-2">
            <div className="relative h-56 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.images[0] || form.imageUrl}
                alt="Hostel cover preview"
                className="h-full w-full object-cover"
              />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-md">
                ★ Primary Cover
              </span>
            </div>
            {form.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {form.images.slice(1).map((url, i) => (
                  <div key={i} className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Hostel gallery ${i + 2}`} className="h-full w-full object-cover" />
                  </div>
                ))}
                <span className="text-xs text-slate-500 font-medium pl-1">
                  +{form.images.length - 1} dorm/hostel photo{form.images.length - 1 > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

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
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setStep(4)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Back
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={submitting || savingDraft}
              isLoading={savingDraft}
              onClick={handleSaveDraft}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8 w-full sm:w-auto"
              disabled={savingDraft}
              isLoading={submitting}
              onClick={handleSubmit}
            >
              {verificationStatus !== 'VERIFIED'
                ? 'Verification Required'
                : 'Submit for Approval'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════
  // STANDARD TOUR & EXPERIENCE STEP RENDERERS
  // ═════════════════════════════════════════════════════════════

  const renderStandardStep1 = () => {
    const titleLabel = isFood
      ? 'EXPERIENCE TITLE *'
      : isAdventure
      ? 'ACTIVITY TITLE *'
      : isGuide
      ? 'GUIDE SERVICE TITLE *'
      : form.listingType === 'devotional'
      ? 'DEVOTIONAL PILGRIMAGE TITLE *'
      : form.listingType === 'foreign'
      ? 'FOREIGN TRIP TITLE *'
      : 'PACKAGE TITLE *';

    const titlePlaceholder = isFood
      ? 'e.g. Old Delhi Heritage Street Food Walk & Spice Market'
      : isAdventure
      ? 'e.g. Scuba Diving & Coral Reef Exploration in Havelock'
      : isGuide
      ? 'e.g. Certified Historian Guide for Hampi Ruins & Temples'
      : form.listingType === 'devotional'
      ? 'e.g. Tirupati Balaji VIP Darshan & Srikalahasti Pilgrimage'
      : form.listingType === 'foreign'
      ? 'e.g. 5-Day Dubai City Lights & Luxury Desert Safari'
      : 'e.g. 5-Day Kashmir Paradise Tour';

    const headerTitle = isFood
      ? 'Food Experience Details'
      : isAdventure
      ? 'Adventure Activity Details'
      : isGuide
      ? 'Local Guide Service Details'
      : form.listingType === 'devotional'
      ? 'Devotional Trip Details'
      : form.listingType === 'foreign'
      ? 'Foreign Trip Details'
      : 'Tour Package Details';

    const coverImageLabel = isFood
      ? 'Food Experience Cover & Gallery Photos'
      : isAdventure
      ? 'Adventure Activity Cover & Gallery Photos'
      : isGuide
      ? 'Local Guide Service Cover & Gallery Photos'
      : form.listingType === 'devotional'
      ? 'Devotional Trip Cover & Gallery Photos'
      : form.listingType === 'foreign'
      ? 'Foreign Trip Cover & Gallery Photos'
      : 'Listing Cover & Gallery Photos';

    const descriptionLabel = isFood
      ? 'Food Experience Description *'
      : isAdventure
      ? 'Activity Description *'
      : isGuide
      ? 'Guide Service Description *'
      : form.listingType === 'devotional'
      ? 'Devotional Pilgrimage Description *'
      : form.listingType === 'foreign'
      ? 'Foreign Trip Description *'
      : 'Package Description *';

    const descPlaceholder = isFood
      ? 'Describe the culinary trail, cuisines, authentic flavors, chef talks, or market visits...'
      : isAdventure
      ? 'Describe the adrenaline rush, safety briefings, instructor credentials, terrain, and thrill highlights...'
      : isGuide
      ? 'Describe your storytelling expertise, historical knowledge, personalized routes, and languages spoken...'
      : 'Detailed overview of the tour experience, landscape, attractions, and cultural highlights...';

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          {headerTitle}
        </h2>

        {/* Title */}
        <Input
          label={titleLabel}
          placeholder={titlePlaceholder}
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
              onChange={(e) => {
                const val = e.target.value as ListingType;
                handleListingTypeChange(val);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[15px] text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="tour">Tour Package</option>
              <option value="cab">Cab / Taxi</option>
              <option value="villa">Villa</option>
              <option value="homestay">Homestay</option>
              <option value="hostel">Hostel / Room Stay</option>
              <option value="devotional">Devotional Trip</option>
              <option value="foreign">Foreign Trip</option>
              <option value="food">Food Experience</option>
              <option value="adventure">Adventure Activities</option>
              <option value="guide">Local Guides</option>
            </select>
          </div>
        </div>

        {/* Duration & Group Size */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={isFood || isGuide ? 'DURATION (DAYS / SESSIONS) *' : 'DURATION (DAYS) *'}
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

        {/* Cover & Gallery Images Upload */}
        <div className="space-y-1.5">
          <CoverImageUploader
            key={`std_uploader_${form.listingType}`}
            label={coverImageLabel}
            category={form.category}
            required={true}
            images={form.images}
            value={form.imageUrl}
            onChange={(val, all) => {
              const list = Array.isArray(val) ? val : all || [val].filter(Boolean);
              setForm((prev) => {
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

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            {descriptionLabel}
          </label>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none transition-all"
            placeholder={descPlaceholder}
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
              if (!form.title.trim() || form.title.trim().length < 3) {
                setError('Package Title is required and must be at least 3 characters');
                return;
              }
              if (!form.destinationCity?.trim() && !form.destinationInput?.trim()) {
                setError('Destination City is required');
                return;
              }
              if (!form.imageUrl && (!Array.isArray(form.images) || form.images.length === 0)) {
                setError('Please upload at least one cover photo or image');
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
  };

  const renderStandardStep2 = () => {
    const headerTitle = isFood
      ? 'Pricing, Tastings & Inclusions'
      : isAdventure
      ? 'Pricing, Safety Gear & Inclusions'
      : isGuide
      ? 'Pricing, Hours & Inclusions'
      : 'Pricing & Inclusions';

    const inclusionsPlaceholder = isFood
      ? 'e.g.\nAll food tastings & snacks\nBottled mineral water\nExpert culinary guide\nLocal tea/lassi stop'
      : isAdventure
      ? 'e.g.\nCertified instructor / dive master\nSafety gear & helmet\nLife jackets & harness\nGoPro photos / video clips'
      : isGuide
      ? 'e.g.\nLicensed storytelling guide\nMonument entry queue assistance\nCustom itinerary planning\nLocal hidden gems recommendations'
      : 'e.g.\nHotel accommodation\nDaily breakfast & dinner\nAirport transfers';

    const exclusionsPlaceholder = isFood
      ? 'e.g.\nAlcoholic beverages\nHotel transfers\nPersonal shopping'
      : isAdventure
      ? 'e.g.\nTransport to launch site\nPersonal medical insurance\nExtra adventure rides'
      : isGuide
      ? 'e.g.\nMonument entrance tickets\nMeals & transport\nTips / gratuities'
      : 'e.g.\nFlight tickets\nPersonal expenses\nTravel insurance';

    const continueLabel = isFood
      ? 'Continue to Food Trail'
      : isAdventure
      ? 'Continue to Schedule'
      : isGuide
      ? 'Continue to Route'
      : 'Continue to Itinerary';

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          {headerTitle}
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
              placeholder={inclusionsPlaceholder}
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
              placeholder={exclusionsPlaceholder}
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
            onClick={() => {
              if (!Number(form.basePrice) || Number(form.basePrice) <= 0) {
                setError('Package base price is required and must be greater than 0');
                return;
              }
              setError(null);
              setStep(3);
            }}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {continueLabel}
          </Button>
        </div>
      </div>
    );
  };

  const renderStandardStep3 = () => {
    const headerTitle = isFood
      ? 'Food Trail & Tasting Stops'
      : isAdventure
      ? 'Activity Schedule & Safety Plan'
      : isGuide
      ? 'Tour Route & Key Highlights'
      : 'Day-by-Day Itinerary';

    const addLabel = isFood
      ? 'Add Stop / Meal'
      : isAdventure
      ? 'Add Phase / Session'
      : isGuide
      ? 'Add Landmark / Stop'
      : 'Add Day';

    const dayPrefix = isFood
      ? 'Stop'
      : isAdventure
      ? 'Session'
      : isGuide
      ? 'Highlight / Stop'
      : 'Day';

    const getTitlePlaceholder = (d: number) => isFood
      ? `e.g. Stop ${d}: Famous Paranthe & Jalebi sampling`
      : isAdventure
      ? `e.g. Session ${d}: Safety briefing & equipment fitting`
      : isGuide
      ? `e.g. Stop ${d}: Virupaksha Temple & stone chariot history`
      : `e.g. Day ${d}: Arrival & Hotel Check-in`;

    const descPlaceholder = isFood
      ? 'Dishes sampled, history of the shop, dietary notes...'
      : isAdventure
      ? 'Briefing details, safety protocols, instructions...'
      : isGuide
      ? 'Stories shared, architectural highlights, photo spots...'
      : 'Activities, sightseeing points, meals included on this day...';

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {headerTitle}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDay}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {addLabel}
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
                  {dayPrefix} {day.day}
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
                placeholder={getTitlePlaceholder(day.day)}
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
                  placeholder={descPlaceholder}
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
  };

  const renderStandardStep4 = () => {
    const summaryRows = [
      { label: 'Category', value: form.category },
      { label: 'Destination', value: form.destinationCity ? `${form.destinationCity}, ${form.destinationState}` : form.destinationInput || '—' },
      { label: 'Duration', value: `${form.durationDays} Days / ${form.durationNights} Nights` },
      { label: 'Max Group Size', value: form.maxGroupSize },
      { label: 'Base Price', value: `₹${(parseFloat(form.basePrice) || 0).toLocaleString('en-IN')}` },
      { label: 'Discount', value: parseFloat(form.discountPercent) > 0 ? `${form.discountPercent}%` : 'None' },
      { label: 'Display Price', value: `₹${finalPrice.toLocaleString('en-IN')}` },
      { label: isFood ? 'Tasting Stops' : isAdventure ? 'Activity Sessions' : isGuide ? 'Tour Highlights' : 'Itinerary Days', value: `${form.itinerary.length} item(s) planned` },
    ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
          Review & Submit {isFood ? 'Food Experience' : isAdventure ? 'Adventure Activity' : isGuide ? 'Guide Service' : 'Package'}
        </h2>

        {/* Cover & Gallery Preview */}
        {(form.imageUrl || form.images.length > 0) && (
          <div className="space-y-2">
            <div className="relative h-56 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.images[0] || form.imageUrl}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-md">
                ★ Primary Cover
              </span>
            </div>
            {form.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {form.images.slice(1).map((url, i) => (
                  <div key={i} className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Gallery ${i + 2}`} className="h-full w-full object-cover" />
                  </div>
                ))}
                <span className="text-xs text-slate-500 font-medium pl-1">
                  +{form.images.length - 1} gallery photo{form.images.length - 1 > 1 ? 's' : ''}
                </span>
              </div>
            )}
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
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setStep(3)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Back
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={submitting || savingDraft}
              isLoading={savingDraft}
              onClick={handleSaveDraft}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Save as Draft
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-8 w-full sm:w-auto"
              disabled={savingDraft}
              isLoading={submitting}
              onClick={handleSubmit}
            >
              {verificationStatus !== 'VERIFIED'
                ? 'Verification Required'
                : 'Submit for Approval'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {editId ? 'Edit Package Listing' : 'Create New Listing'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {editId
              ? 'Update package details, itinerary, pricing, and resubmit for moderation.'
              : 'Provide details for your tour, cab, villa, homestay, hostel, food experience, adventure or guide service.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={submitting || savingDraft}
            isLoading={savingDraft}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
          >
            Save as Draft
          </Button>
        </div>
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
      ) : isFood ? (
        <>
          {step === 1 && (
            <FoodStep1
              form={form}
              set={set}
              setForm={setForm}
              categoryStore={categoryStore}
              setImageError={setImageError}
              setError={setError}
              setStep={setStep}
            />
          )}
          {step === 2 && (
            <FoodStep2
              form={form}
              set={set}
              newFoodItem={newFoodItem}
              setNewFoodItem={setNewFoodItem}
              addFoodItem={addFoodItem}
              removeFoodItem={removeFoodItem}
              setError={setError}
              setStep={setStep}
            />
          )}
          {step === 3 && (
            <FoodStep3
              form={form}
              set={set}
              setError={setError}
              setStep={setStep}
            />
          )}
          {step === 4 && (
            <FoodStep4
              form={form}
              set={set}
              setStep={setStep}
              verificationStatus={verificationStatus}
              submitting={submitting}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              savingDraft={savingDraft}
              setError={setError}
            />
          )}
        </>
      ) : isAdventure ? (
        <>
          {step === 1 && (
            <AdventureStep1
              form={form}
              set={set}
              setForm={setForm}
              categoryStore={categoryStore}
              setImageError={setImageError}
              setError={setError}
              setStep={setStep}
            />
          )}
          {step === 2 && (
            <AdventureStep2
              form={form}
              set={set}
              setStep={setStep}
              setError={setError}
            />
          )}
          {step === 3 && (
            <AdventureStep3
              form={form}
              set={set}
              setStep={setStep}
            />
          )}
          {step === 4 && (
            <AdventureStep4
              form={form}
              set={set}
              setStep={setStep}
              verificationStatus={verificationStatus}
              submitting={submitting}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              savingDraft={savingDraft}
              setError={setError}
            />
          )}
        </>
      ) : isGuide ? (
        <>
          {step === 1 && (
            <GuideStep1
              form={form}
              set={set}
              setForm={setForm}
              categoryStore={categoryStore}
              setImageError={setImageError}
              setError={setError}
              setStep={setStep}
            />
          )}
          {step === 2 && (
            <GuideStep2
              form={form}
              set={set}
              setStep={setStep}
              setError={setError}
            />
          )}
          {step === 3 && (
            <GuideStep3
              form={form}
              set={set}
              newGuideStop={newGuideStop}
              setNewGuideStop={setNewGuideStop}
              addGuideStop={addGuideStop}
              removeGuideStop={removeGuideStop}
              setStep={setStep}
            />
          )}
          {step === 4 && (
            <GuideStep4
              form={form}
              set={set}
              setStep={setStep}
              verificationStatus={verificationStatus}
              submitting={submitting}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              savingDraft={savingDraft}
              setError={setError}
            />
          )}
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
