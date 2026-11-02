import React from 'react';
import Image from 'next/image';
import {
  Utensils,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Languages,
  Sparkles,
  Mountain,
  Compass,
  Footprints,
  Calendar,
  ExternalLink,
  HelpCircle,
  Headphones,
  Check,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import type { Package } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface CategoryDetailSectionsProps {
  pkg: Package;
  meta: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────
// 1. FOOD EXPERIENCES DETAIL SECTIONS
// ─────────────────────────────────────────────────────────────
export const FoodDetailSections: React.FC<CategoryDetailSectionsProps> = ({ pkg, meta }) => {
  const restaurantName = meta.foodRestaurantName || pkg.name;
  const businessType = meta.foodBusinessType || '';
  const address = meta.foodAddress || '';
  const googleMapsUrl = meta.foodGoogleMapsUrl || '';
  const meetingLandmark = meta.foodMeetingLandmark || '';
  const walkingDistance = meta.foodWalkingDistance || '';
  const cuisines = Array.isArray(meta.foodCuisines) ? meta.foodCuisines : (meta.foodCuisines ? [meta.foodCuisines] : []);
  const dietaryOptions = Array.isArray(meta.foodDietaryOptions) ? meta.foodDietaryOptions : (meta.foodDietaryOptions ? [meta.foodDietaryOptions] : []);
  const menuItems = Array.isArray(meta.foodMenuItems) ? meta.foodMenuItems : [];
  const tastingCount = meta.foodTastingCount || '';
  const beveragesIncluded = Boolean(meta.foodBeveragesIncluded);
  const alcoholPolicy = meta.foodAlcoholPolicy || '';
  const menuTimings = meta.foodMenuTimings || '';
  const specialRequests = meta.foodSpecialRequests || '';
  const reservationDuration = meta.foodReservationDuration || '';
  const fssaiCompliance = Boolean(meta.foodFssaiCompliance);
  const fssaiNumber = meta.foodFssaiNumber || '';
  const hygieneInfo = meta.foodHygieneInfo || '';
  const cancellationPolicy = meta.foodCancellationPolicy || '';
  const refundPolicy = meta.foodRefundPolicy || '';
  const lateArrivalPolicy = meta.foodLateArrivalPolicy || '';
  const noShowPolicy = meta.foodNoShowPolicy || '';

  // Group menu items by category
  const menuByCategory: Record<string, any[]> = {};
  menuItems.forEach((item) => {
    const cat = item.category || 'Specialties & Signatures';
    if (!menuByCategory[cat]) menuByCategory[cat] = [];
    menuByCategory[cat].push(item);
  });

  return (
    <div className="space-y-8">
      {/* Cuisines & Dietary Badges */}
      {(cuisines.length > 0 || dietaryOptions.length > 0) && (
        <section className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-700" /> Cuisines:
            </span>
            {cuisines.map((c: string, i: number) => (
              <span
                key={i}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 border border-amber-200 shadow-xs"
              >
                {c}
              </span>
            ))}
          </div>

          {dietaryOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Dietary Accommodations:
              </span>
              {dietaryOptions.map((d: string, i: number) => (
                <span
                  key={i}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900 border border-emerald-200"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Restaurant / Host Overview & Location */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">About the Culinary Experience</h2>
            {businessType && (
              <p className="text-xs text-amber-800 font-semibold mt-0.5">{businessType}</p>
            )}
          </div>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> View on Google Maps <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}
        </div>

        <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
          {pkg.description}
        </p>

        {(address || meetingLandmark || walkingDistance) && (
          <div className="rounded-xl bg-slate-50 p-4 text-xs space-y-2 text-slate-700 border border-slate-100">
            {address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Full Address:</strong> {address}
                </span>
              </div>
            )}
            {meetingLandmark && (
              <div className="flex items-start gap-2">
                <Compass className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Meeting Landmark:</strong> {meetingLandmark}
                </span>
              </div>
            )}
            {walkingDistance && (
              <div className="flex items-start gap-2">
                <Footprints className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Walking Distance:</strong> {walkingDistance}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Structured Food Menu */}
      {menuItems.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-6 sm:p-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" /> Curated Menu & Tasting Items
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic dishes prepared fresh for this culinary experience
              </p>
            </div>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
              {menuItems.length} {menuItems.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          <div className="space-y-6">
            {Object.entries(menuByCategory).map(([categoryName, items]) => (
              <div key={categoryName} className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {categoryName}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((item, idx) => {
                    const isVeg = item.foodType === 'veg';
                    const isVegan = item.foodType === 'vegan';
                    return (
                      <div
                        key={item.id || idx}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Veg / Non-Veg dot symbol */}
                            <span
                              className={`inline-flex items-center justify-center w-3.5 h-3.5 border ${
                                isVegan
                                  ? 'border-emerald-600'
                                  : isVeg
                                  ? 'border-green-600'
                                  : 'border-rose-600'
                              } bg-white rounded-xs p-0.5`}
                              title={item.foodType}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isVegan
                                    ? 'bg-emerald-600'
                                    : isVeg
                                    ? 'bg-green-600'
                                    : 'bg-rose-600'
                                }`}
                              />
                            </span>

                            <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>

                            {item.isBestseller && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                                ⭐ Bestseller
                              </span>
                            )}
                            {item.isSpecial && (
                              <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-800">
                                ✨ Chef Special
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          <div className="text-xs font-bold text-teal-800 pt-0.5">
                            {formatCurrency(Number(item.price) || 0)}
                          </div>
                        </div>

                        {item.imageUrl && (
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200 border border-slate-200">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="64px"
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tasting & Dining Logistics */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Dining Logistics & Service Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
          {tastingCount && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1">
              <span className="text-slate-400 font-semibold block">Tasting Course Count</span>
              <span className="font-bold text-slate-900 text-sm">{tastingCount} Courses</span>
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-3 space-y-1">
            <span className="text-slate-400 font-semibold block">Beverages</span>
            <span className="font-bold text-slate-900 text-sm">
              {beveragesIncluded ? '✓ Regional beverages included' : 'Beverages on separate order'}
            </span>
          </div>

          {alcoholPolicy && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1">
              <span className="text-slate-400 font-semibold block">Alcohol Policy</span>
              <span className="font-bold text-slate-900 text-sm">{alcoholPolicy}</span>
            </div>
          )}

          {menuTimings && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1">
              <span className="text-slate-400 font-semibold block">Menu Availability Hours</span>
              <span className="font-bold text-slate-900 text-sm">{menuTimings}</span>
            </div>
          )}

          {reservationDuration && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1">
              <span className="text-slate-400 font-semibold block">Table Reservation Duration</span>
              <span className="font-bold text-slate-900 text-sm">{reservationDuration}</span>
            </div>
          )}

          {specialRequests && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1 sm:col-span-2">
              <span className="text-slate-400 font-semibold block">Special Dietary / Seating Requests</span>
              <span className="font-medium text-slate-800">{specialRequests}</span>
            </div>
          )}
        </div>
      </section>

      {/* Hygiene & Verification (Only genuine verified details!) */}
      {(fssaiCompliance || hygieneInfo) && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs space-y-3 sm:p-6">
          <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" /> Food Safety & Kitchen Hygiene
          </h2>

          {fssaiCompliance && fssaiNumber && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 bg-white/80 rounded-xl px-3.5 py-2 border border-emerald-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>FSSAI License / Registration No: <strong>{fssaiNumber}</strong></span>
            </div>
          )}

          {hygieneInfo && (
            <p className="text-xs text-emerald-900/90 leading-relaxed">
              <strong>Hygiene Measures:</strong> {hygieneInfo}
            </p>
          )}
        </section>
      )}

      {/* Reservation Policies */}
      {(cancellationPolicy || refundPolicy || lateArrivalPolicy || noShowPolicy) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Reservation Policies</h2>
          <div className="space-y-3 text-xs text-slate-600">
            {cancellationPolicy && (
              <p>
                <strong className="text-slate-900">Cancellation Policy:</strong> {cancellationPolicy}
              </p>
            )}
            {refundPolicy && (
              <p>
                <strong className="text-slate-900">Refund Policy:</strong> {refundPolicy}
              </p>
            )}
            {lateArrivalPolicy && (
              <p>
                <strong className="text-slate-900">Late Arrival:</strong> {lateArrivalPolicy}
              </p>
            )}
            {noShowPolicy && (
              <p>
                <strong className="text-slate-900">No-Show Policy:</strong> {noShowPolicy}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 2. ADVENTURE ACTIVITIES DETAIL SECTIONS
// ─────────────────────────────────────────────────────────────
export const AdventureDetailSections: React.FC<CategoryDetailSectionsProps> = ({ pkg, meta }) => {
  const activityCategory = meta.advCategory || 'Adventure Activity';
  const difficulty = meta.advDifficulty || 'Moderate';
  const minAge = meta.advMinAge || '';
  const maxParticipants = meta.advMaxParticipants || pkg.maxGroupSize || '';
  const locationName = meta.advLocationName || '';
  const startPoint = meta.advStartPoint || '';
  const googleMapsUrl = meta.advGoogleMapsUrl || '';
  const checkinTime = meta.advCheckinTime || '';
  const startTime = meta.advStartTime || '';
  const completionTime = meta.advCompletionTime || '';
  const equipmentIncluded = Array.isArray(meta.advEquipmentIncluded)
    ? meta.advEquipmentIncluded
    : (meta.advEquipmentIncluded ? [meta.advEquipmentIncluded] : []);
  const equipmentList = meta.advEquipmentList || '';
  const mandatoryGear = Boolean(meta.advMandatoryGear);
  const instructorRatio = meta.advInstructorRatio || '';
  const instructorCertifications = meta.advInstructorCertifications || '';
  const safetyInstructions = meta.advSafetyInstructions || '';
  const whatToBring = meta.advWhatToBring || '';
  const dressCode = meta.advDressCode || '';
  const weatherRestrictions = meta.advWeatherRestrictions || '';
  const badWeatherPolicy = meta.advBadWeatherPolicy || '';
  const medicalRestrictions = Array.isArray(meta.advMedicalRestrictions)
    ? meta.advMedicalRestrictions
    : (meta.advMedicalRestrictions ? [meta.advMedicalRestrictions] : []);
  const swimmingRequirement = meta.advSwimmingRequirement || '';
  const weightRestrictions = meta.advWeightRestrictions || '';
  const fitnessPrerequisites = meta.advFitnessPrerequisites || '';
  const cancellationPolicy = meta.advCancellationPolicy || '';
  const refundPolicy = meta.advRefundPolicy || '';
  const reschedulingPolicy = meta.advReschedulingPolicy || '';
  const firstAid = Boolean(meta.advFirstAidFacility);
  const locker = Boolean(meta.advLockerFacility);
  const changingRoom = Boolean(meta.advChangingRoom);
  const emergencyContact = meta.advEmergencyContact || '';

  return (
    <div className="space-y-8">
      {/* Activity Overview & Base Camp */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Activity Overview & Base Camp</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
                {activityCategory}
              </span>
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 uppercase">
                {difficulty} Difficulty
              </span>
            </div>
          </div>
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Base Camp Map <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}
        </div>

        <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
          {pkg.description}
        </p>

        {(locationName || startPoint || checkinTime || startTime) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-700 border border-slate-100">
            {locationName && (
              <div>
                <span className="text-slate-400 font-semibold block">Base Camp / Location</span>
                <span className="font-bold text-slate-900 text-sm">{locationName}</span>
              </div>
            )}
            {startPoint && (
              <div>
                <span className="text-slate-400 font-semibold block">Start / Meeting Point</span>
                <span className="font-bold text-slate-900 text-sm">{startPoint}</span>
              </div>
            )}
            {checkinTime && (
              <div>
                <span className="text-slate-400 font-semibold block">Reporting & Check-in Time</span>
                <span className="font-semibold text-slate-900">{checkinTime}</span>
              </div>
            )}
            {startTime && (
              <div>
                <span className="text-slate-400 font-semibold block">Activity Start Time</span>
                <span className="font-semibold text-slate-900">{startTime} {completionTime ? `(Ends ~${completionTime})` : ''}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Difficulty, Fitness & Participant Requirements */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Safety & Fitness Prerequisites</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {minAge && (
            <div className="rounded-xl bg-slate-50 p-3.5 space-y-1">
              <span className="text-slate-400 font-semibold block">Minimum Age</span>
              <span className="font-bold text-slate-900 text-sm">{minAge} Years</span>
            </div>
          )}
          {swimmingRequirement && (
            <div className="rounded-xl bg-slate-50 p-3.5 space-y-1">
              <span className="text-slate-400 font-semibold block">Swimming Ability</span>
              <span className="font-bold text-slate-900 text-sm">{swimmingRequirement}</span>
            </div>
          )}
          {weightRestrictions && (
            <div className="rounded-xl bg-slate-50 p-3.5 space-y-1">
              <span className="text-slate-400 font-semibold block">Weight Limits</span>
              <span className="font-bold text-slate-900 text-sm">{weightRestrictions}</span>
            </div>
          )}
        </div>

        {fitnessPrerequisites && (
          <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
            <span className="text-slate-400 font-semibold block">Fitness Expectations</span>
            <p className="text-slate-700 leading-relaxed">{fitnessPrerequisites}</p>
          </div>
        )}

        {medicalRestrictions.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 text-xs space-y-1.5">
            <span className="font-bold text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Medical Restrictions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {medicalRestrictions.map((med: string, i: number) => (
                <span key={i} className="rounded-md bg-white px-2.5 py-1 font-medium text-rose-800 border border-rose-200">
                  {med}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Equipment, Safety Gear & On-site Facilities */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Equipment, Gear & Base Facilities</h2>

        {equipmentIncluded.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
              Provided Safety Equipment & Gear:
            </span>
            <div className="flex flex-wrap gap-2">
              {equipmentIncluded.map((gear: string, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900 border border-teal-200"
                >
                  <Check className="w-3 h-3 text-teal-600" /> {gear}
                </span>
              ))}
            </div>
          </div>
        )}

        {equipmentList && (
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Equipment Details:</strong> {equipmentList}
          </p>
        )}

        {/* Facilities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
          <div className={`p-2.5 rounded-xl border ${firstAid ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            {firstAid ? '✓ First Aid On-Site' : '✕ First Aid NA'}
          </div>
          <div className={`p-2.5 rounded-xl border ${locker ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            {locker ? '✓ Locker Storage' : '✕ No Lockers'}
          </div>
          <div className={`p-2.5 rounded-xl border ${changingRoom ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            {changingRoom ? '✓ Changing Rooms' : '✕ No Changing Rooms'}
          </div>
          <div className={`p-2.5 rounded-xl border ${mandatoryGear ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            {mandatoryGear ? '✓ Inspected Gear' : 'Gear on request'}
          </div>
        </div>

        {(whatToBring || dressCode) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            {whatToBring && (
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="font-bold text-slate-800">What to Bring</span>
                <p className="text-slate-600">{whatToBring}</p>
              </div>
            )}
            {dressCode && (
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="font-bold text-slate-800">Recommended Attire</span>
                <p className="text-slate-600">{dressCode}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Instructors & Safety Team (Genuine data only!) */}
      {(instructorRatio || instructorCertifications || safetyInstructions || emergencyContact) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Certified Instructors & Safety Protocol</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {instructorRatio && (
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="text-slate-400 font-semibold block">Instructor Ratio</span>
                <span className="font-bold text-slate-900 text-sm">{instructorRatio}</span>
              </div>
            )}
            {instructorCertifications && (
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="text-slate-400 font-semibold block">Instructor Certifications</span>
                <span className="font-bold text-teal-800 text-sm">{instructorCertifications}</span>
              </div>
            )}
            {emergencyContact && (
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="text-slate-400 font-semibold block">Emergency Contact</span>
                <span className="font-bold text-slate-900 text-sm">{emergencyContact}</span>
              </div>
            )}
          </div>

          {safetyInstructions && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              <strong>Safety Protocols:</strong> {safetyInstructions}
            </p>
          )}
        </section>
      )}

      {/* Weather & Booking Policies */}
      {(weatherRestrictions || badWeatherPolicy || cancellationPolicy || reschedulingPolicy) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Weather & Booking Policies</h2>
          <div className="space-y-3 text-xs text-slate-600">
            {weatherRestrictions && (
              <p>
                <strong className="text-slate-900">Weather Dependency:</strong> {weatherRestrictions}
              </p>
            )}
            {badWeatherPolicy && (
              <p>
                <strong className="text-slate-900">Bad Weather Rescheduling Policy:</strong> {badWeatherPolicy}
              </p>
            )}
            {cancellationPolicy && (
              <p>
                <strong className="text-slate-900">Cancellation Policy:</strong> {cancellationPolicy}
              </p>
            )}
            {refundPolicy && (
              <p>
                <strong className="text-slate-900">Refund Policy:</strong> {refundPolicy}
              </p>
            )}
            {reschedulingPolicy && (
              <p>
                <strong className="text-slate-900">Rescheduling:</strong> {reschedulingPolicy}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. LOCAL GUIDES DETAIL SECTIONS
// ─────────────────────────────────────────────────────────────
export const GuideDetailSections: React.FC<CategoryDetailSectionsProps> = ({ pkg, meta }) => {
  const guideName = meta.guideFullName || pkg.providerName;
  const guideType = meta.guideType || '';
  const specialization = meta.guideSpecialization || meta.guideServiceCategory || '';
  const experienceYears = meta.guideExperienceYears || '';
  const languages = Array.isArray(meta.guideLanguages)
    ? meta.guideLanguages
    : (meta.guideLanguages ? [meta.guideLanguages] : []);
  const serviceAreas = meta.guideServiceAreas || '';
  const tourFormat = meta.guideTourFormat || '';
  const licenseId = meta.guideLicenseId || '';
  const certificationType = meta.guideCertificationType || '';
  const stops = Array.isArray(meta.guideStops) ? meta.guideStops : [];
  const audioWhisperHeadsets = Boolean(meta.guideAudioWhisperHeadsets);
  const ticketQueueAssistance = Boolean(meta.guideTicketQueueAssistance);
  const tourStartingPoint = meta.guideTourStartingPoint || meta.guideMeetingPoint || '';
  const tourEndingPoint = meta.guideTourEndingPoint || '';
  const walkingDistance = meta.guideWalkingDistance || '';
  const keyMonuments = meta.guideKeyMonuments || '';
  const topics = meta.guideTopics || '';
  const whatToBring = meta.guideWhatToBring || '';
  const specialInstructions = meta.guideSpecialInstructions || '';
  const pricePerHour = meta.guidePricePerHour || '';
  const halfDayPrice = meta.guideHalfDayPrice || '';
  const fullDayPrice = meta.guideFullDayPrice || '';
  const groupPrice = meta.guideGroupPrice || '';
  const additionalPersonCharge = meta.guideAdditionalPersonCharge || '';
  const cancellationPolicy = meta.guideCancellationPolicy || '';
  const refundPolicy = meta.guideRefundPolicy || '';
  const reschedulingPolicy = meta.guideReschedulingPolicy || '';

  return (
    <div className="space-y-8">
      {/* Guide Profile & Credentials */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{guideName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {specialization && (
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-800 border border-indigo-200">
                  {specialization}
                </span>
              )}
              {experienceYears && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {experienceYears} Years Experience
                </span>
              )}
              {tourFormat && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {tourFormat}
                </span>
              )}
            </div>
          </div>

          {/* Only genuine verified license if explicitly provided */}
          {licenseId && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs text-indigo-900 font-semibold">
              License ID: {licenseId} {certificationType ? `(${certificationType})` : ''}
            </div>
          )}
        </div>

        <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
          {pkg.description}
        </p>

        {/* Languages & Areas */}
        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
          {languages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-indigo-600" /> Fluent Languages:
              </span>
              {languages.map((lang: string, i: number) => (
                <span
                  key={i}
                  className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-900 border border-indigo-200"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}

          {serviceAreas && (
            <div className="text-slate-600 pt-1">
              <strong>Covered Service Areas:</strong> {serviceAreas}
            </div>
          )}
        </div>
      </section>

      {/* Ordered Tour Stops Route Timeline */}
      {stops.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-6 sm:p-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" /> Guided Tour Itinerary & Stops
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sequential narrative route planned by this local guide
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-800">
              {stops.length} {stops.length === 1 ? 'Stop' : 'Stops'}
            </span>
          </div>

          <div className="relative border-l-2 border-indigo-500/30 pl-6 space-y-6 ml-3">
            {stops.map((stop, idx) => (
              <div key={idx} className="relative group space-y-1">
                {/* Numbered node circle */}
                <div className="absolute -left-7.75 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-700 text-white text-xs font-bold shadow-md">
                  {stop.stopNumber || idx + 1}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-base font-bold text-slate-900">
                    {stop.name || `Stop ${idx + 1}`}
                  </h3>
                  {stop.durationMinutes && (
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 self-start sm:self-auto">
                      ⏱️ {stop.durationMinutes} Minutes
                    </span>
                  )}
                </div>

                {(stop.landmark || stop.address) && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    {[stop.landmark, stop.address].filter(Boolean).join(', ')}
                  </p>
                )}

                {stop.description && (
                  <p className="text-sm text-slate-600 leading-relaxed pt-1">
                    {stop.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tour Logistics & Features */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900">Tour Logistics & Inclusions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          {tourStartingPoint && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1">
              <span className="text-slate-400 font-semibold block">Meeting / Starting Point</span>
              <span className="font-bold text-slate-900 text-sm">{tourStartingPoint}</span>
            </div>
          )}
          {tourEndingPoint && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1">
              <span className="text-slate-400 font-semibold block">Tour Ending Point</span>
              <span className="font-bold text-slate-900 text-sm">{tourEndingPoint}</span>
            </div>
          )}
          {walkingDistance && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1">
              <span className="text-slate-400 font-semibold block">Total Walking Distance</span>
              <span className="font-bold text-slate-900 text-sm">{walkingDistance}</span>
            </div>
          )}
          <div className="rounded-xl bg-slate-50 p-3 space-y-1">
            <span className="text-slate-400 font-semibold block">Equipment Provided</span>
            <span className="font-bold text-slate-900 text-sm">
              {audioWhisperHeadsets ? '✓ Audio Whisper Headsets Provided' : 'Standard In-Person Narration'}
            </span>
          </div>
          {ticketQueueAssistance && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1 sm:col-span-2">
              <span className="text-slate-400 font-semibold block">Ticket Assistance</span>
              <span className="font-bold text-emerald-800 text-sm">✓ Monument Ticket Queue Assistance Included</span>
            </div>
          )}
          {keyMonuments && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1 sm:col-span-2">
              <span className="text-slate-400 font-semibold block">Key Monuments Covered</span>
              <span className="font-medium text-slate-800">{keyMonuments}</span>
            </div>
          )}
          {topics && (
            <div className="rounded-xl bg-slate-50 p-3 space-y-1 sm:col-span-2">
              <span className="text-slate-400 font-semibold block">Discussion Topics</span>
              <span className="font-medium text-slate-800">{topics}</span>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Breakdown Tiers */}
      {(pricePerHour || halfDayPrice || fullDayPrice || groupPrice) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Guide Pricing Tiers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {pricePerHour && (
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="text-slate-400 font-semibold block">Hourly Rate</span>
                <span className="font-bold text-indigo-900 text-base">{formatCurrency(Number(pricePerHour))} / hr</span>
              </div>
            )}
            {halfDayPrice && (
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="text-slate-400 font-semibold block">Half-Day (4h)</span>
                <span className="font-bold text-indigo-900 text-base">{formatCurrency(Number(halfDayPrice))}</span>
              </div>
            )}
            {fullDayPrice && (
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="text-slate-400 font-semibold block">Full-Day (8h)</span>
                <span className="font-bold text-indigo-900 text-base">{formatCurrency(Number(fullDayPrice))}</span>
              </div>
            )}
            {groupPrice && (
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="text-slate-400 font-semibold block">Group Rate</span>
                <span className="font-bold text-indigo-900 text-base">{formatCurrency(Number(groupPrice))}</span>
              </div>
            )}
          </div>
          {additionalPersonCharge && (
            <p className="text-xs text-slate-500">
              * Additional person charge: {formatCurrency(Number(additionalPersonCharge))} per extra guest.
            </p>
          )}
        </section>
      )}

      {/* Policies */}
      {(cancellationPolicy || refundPolicy || reschedulingPolicy) && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Guide Policies</h2>
          <div className="space-y-3 text-xs text-slate-600">
            {cancellationPolicy && (
              <p>
                <strong className="text-slate-900">Cancellation Policy:</strong> {cancellationPolicy}
              </p>
            )}
            {refundPolicy && (
              <p>
                <strong className="text-slate-900">Refund Policy:</strong> {refundPolicy}
              </p>
            )}
            {reschedulingPolicy && (
              <p>
                <strong className="text-slate-900">Rescheduling:</strong> {reschedulingPolicy}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
