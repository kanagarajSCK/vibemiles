// ============================================================
// CORE TYPES — Travel Marketplace + SaaS Platform
// ============================================================

// ─── User & Auth ────────────────────────────────────────────
export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Customer extends User {
  role: 'customer';
  fullName: string;
  avatar?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  city?: string;
  state?: string;
  country?: string;
  emergencyContact?: string;
  preferredLanguage?: string;
  rewardPoints: number;
  isVerified: boolean;
  isBlocked: boolean;
}

export interface Provider extends User {
  role: 'provider';
  businessName: string;
  ownerName: string;
  businessCategory: BusinessCategory;
  description?: string;
  logo?: string;
  gallery?: string[];
  address: Address;
  panNumber?: string;
  gstNumber?: string;
  bankDetails?: BankDetails;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  totalPackages: number;
  joinedAt: string;
}

export interface Admin extends User {
  role: 'admin';
  fullName: string;
  permissions: string[];
}

// ─── Destination ─────────────────────────────────────────────
export interface Destination {
  id: string;
  slug: string;
  name: string;
  state: string;
  country: string;
  description: string;
  heroImage: string;
  images: string[];
  bestTimeToVisit: string;
  averageTemperature?: string;
  topActivities: string[];
  isPopular: boolean;
  isTrending: boolean;
  packageCount: number;
  rating: number;
  reviewCount: number;
  tags: string[];
}

// ─── Package ─────────────────────────────────────────────────
export type PackageCategory =
  | 'tour'
  | 'villa'
  | 'homestay'
  | 'hotel'
  | 'hostel'
  | 'camping'
  | 'food'
  | 'adventure'
  | 'guide'
  | 'cab'
  | 'devotional'
  | 'foreign';

export type BusinessCategory =
  | 'Tour Organizer'
  | 'Villa'
  | 'Homestay'
  | 'Hotel'
  | 'Camping'
  | 'Food Provider'
  | 'Local Guide'
  | 'Adventure Activity'
  | 'Cab Service'
  | 'Devotional Tour Operator'
  | 'International Tour Operator';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals?: string[];
  accommodation?: string;
  location?: string;
}

export interface AvailableDate {
  id?: string;
  date: string;
  price: number;
  capacity: number;
  bookedCount: number;
  isAvailable: boolean;
}

export interface Package {
  id: string;
  slug: string;
  providerId: string;
  providerName: string;
  name: string;
  category: PackageCategory;
  description: string;
  highlights: string[];
  destinationId: string;
  destinationName: string;
  state: string;
  city?: string;
  durationDays: number;
  durationNights: number;
  maxGroupSize: number;
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
  currency: string;
  images: string[];
  videoUrl?: string;
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  availableDates: AvailableDate[];
  cancellationPolicy: CancellationPolicy;
  rating: number;
  reviewCount: number;
  bookingCount: number;
  approvalStatus: ApprovalStatus;
  status?: ListingStatus;
  rejectionReason?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata?: Record<string, any>;
}

// ─── Booking ──────────────────────────────────────────────────
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'refunded'
  | 'partially_refunded'
  | 'failed';

export interface TravelerDetail {
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  idType?: 'aadhaar' | 'passport' | 'driving_license';
  idNumber?: string;
}

export interface OptionalService {
  id: string;
  name: string;
  description: string;
  price: number;
  isSelected: boolean;
}

export interface Booking {
  id: string;
  bookingRef: string;
  packageId: string;
  packageName: string;
  packageImage: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  providerId: string;
  providerName: string;
  travelDate: string;
  travelers: {
    adults: number;
    children: number;
  };
  travelerDetails: TravelerDetail[];
  optionalServices: OptionalService[];
  pickup?: string;
  baseAmount: number;
  optionalServicesAmount: number;
  discountAmount: number;
  couponCode?: string;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  availabilityId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  commissionRate?: number;
  commissionAmount?: number;
  providerAmount?: number;
  isCapacityRestored?: boolean;
  idempotencyKey?: string;
  cancelledAt?: string;
  expiresAt?: string;
  bookingStatus: BookingStatus;
  cancellationReason?: string;
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// ─── Payment & Invoice ───────────────────────────────────────
export interface Payment {
  id: string;
  bookingId: string;
  bookingRef: string;
  customerId: string;
  customerName: string;
  providerId: string;
  amount: number;
  commission: number;
  netAmount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  gateway: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  booking: Booking;
  customer: Pick<Customer, 'fullName' | 'email' | 'phone' | 'city' | 'state'>;
  provider: Pick<Provider, 'businessName' | 'address'>;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  issuedAt: string;
  dueAt?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ─── Review ───────────────────────────────────────────────────
export interface Review {
  id: string;
  packageId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  isVerifiedBooking: boolean;
  providerReply?: string;
  providerReplyAt?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationNote?: string;
  helpfulCount: number;
  isReported: boolean;
  createdAt: string;
}

// ─── Rewards & Coupons ────────────────────────────────────────
export interface RewardTransaction {
  id: string;
  customerId: string;
  points: number;
  type: 'earned' | 'redeemed' | 'expired';
  description: string;
  bookingRef?: string;
  expiresAt?: string;
  createdAt: string;
}

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  applicableCategories?: PackageCategory[];
}

export interface CustomerCoupon {
  coupon: Coupon;
  isUsed: boolean;
  usedAt?: string;
  savedAt: string;
}

// ─── Notification ─────────────────────────────────────────────
export type NotificationType = 'booking' | 'payment' | 'review' | 'system' | 'promo';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Earnings / Payouts ───────────────────────────────────────
export interface ProviderEarning {
  id: string;
  providerId: string;
  bookingId: string;
  bookingRef: string;
  grossAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'paid';
  settledAt?: string;
  createdAt: string;
}

// ─── Address & Supporting ─────────────────────────────────────
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
}

export interface CancellationPolicy {
  freeCancellationDays: number;
  refundTiers: RefundTier[];
  isNonRefundable: boolean;
  notes?: string;
}

export interface RefundTier {
  daysBeforeTravel: number;
  refundPercent: number;
  description: string;
}

// ─── Search & Filter ──────────────────────────────────────────
export interface SearchFilters {
  q?: string;
  destination?: string;
  destinationId?: string;
  destinationSlug?: string;
  state?: string;
  city?: string;
  category?: PackageCategory;
  minPrice?: number;
  maxPrice?: number;
  travelDate?: string;
  travelType?: string;
  vibe?: string;
  minDays?: number;
  maxDays?: number;
  minDuration?: number;
  maxDuration?: number;
  duration?: number;
  adults?: number;
  children?: number;
  minRating?: number;
  stayType?: string;
  experienceType?: string;
  isFeatured?: boolean;
}

export type SortOption =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'popularity'
  | 'newest';

// ─── Dispute ──────────────────────────────────────────────────
export interface Dispute {
  id: string;
  bookingId: string;
  bookingRef: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  subject: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Admin Analytics ──────────────────────────────────────────
export interface PlatformAnalytics {
  totalCustomers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApprovals: number;
  activePackages: number;
  revenueGrowth: number;
  bookingGrowth: number;
  monthlyRevenue: MonthlyRevenue[];
  topDestinations: { name: string; count: number }[];
  bookingsByCategory: { category: string; count: number }[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

// ─── Deals ─────────────────────────────────────────────────────
export type DealType =
  | 'flash'
  | 'limited_time'
  | 'early_bird'
  | 'last_minute'
  | 'weekend'
  | 'family'
  | 'couple'
  | 'group'
  | 'seasonal'
  | 'budget';

export type DealStatus = 'active' | 'paused' | 'expired' | 'scheduled';

export interface Deal {
  id: string;
  providerId: string;
  providerName: string;
  packageId: string;
  packageSlug: string;
  packageName: string;
  packageImage: string;
  destinationName: string;
  state: string;
  durationDays: number;
  durationNights: number;
  dealType: DealType;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;          // percentage or fixed amount
  originalPrice: number;
  finalPrice: number;
  savingsAmount: number;
  rating: number;
  reviewCount: number;
  startDate: string;
  endDate: string;
  status: DealStatus;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
}
