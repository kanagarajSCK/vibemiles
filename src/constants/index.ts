// ─── Routes ───────────────────────────────────────────────────
export const ROUTES = {
  // Public
  HOME: '/',
  DEVOTIONAL_TRIPS: '/devotional-trips',
  DESTINATIONS: '/destinations',
  DESTINATION: (slug: string) => `/destinations/${slug}`,
  PACKAGES: '/packages',
  PACKAGE: (slug: string) => `/packages/${slug}`,
  STAYS: '/stays',
  STAY: (slug: string) => `/stays/${slug}`,
  FOREIGN_TRIPS: '/foreign-trips',
  ADVENTURES: '/adventures',
  ADVENTURE: (slug: string) => `/adventures/${slug}`,
  FOOD: '/food',
  FOOD_ITEM: (slug: string) => `/food/${slug}`,
  GUIDES: '/guides',
  CABS: '/cabs',
  SEARCH: '/search',
  BOOK: (packageId: string) => `/booking/${packageId}`,
  BOOK_SUCCESS: '/book/success',
  BOOK_FAILED: '/book/failed',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  REGISTRATION_SUCCESS: '/registration-success',

  // Customer Account
  ACCOUNT_DASHBOARD: '/account/dashboard',
  ACCOUNT_BOOKINGS: '/account/bookings',
  ACCOUNT_BOOKING: (id: string) => `/account/bookings/${id}`,
  ACCOUNT_UPCOMING: '/account/upcoming',
  ACCOUNT_COMPLETED: '/account/completed',
  ACCOUNT_CANCELLED: '/account/cancelled',
  ACCOUNT_WISHLIST: '/account/wishlist',
  ACCOUNT_SAVED_PROVIDERS: '/account/saved-providers',
  ACCOUNT_REWARDS: '/account/rewards',
  ACCOUNT_COUPONS: '/account/coupons',
  ACCOUNT_NOTIFICATIONS: '/account/notifications',
  ACCOUNT_PAYMENTS: '/account/payments',
  ACCOUNT_INVOICES: '/account/invoices',
  ACCOUNT_PROFILE: '/account/profile',
  ACCOUNT_SETTINGS: '/account/settings',
  ACCOUNT_SECURITY: '/account/security',

  // Provider
  PROVIDER_HOME: '/provider',
  PROVIDER_DASHBOARD: '/provider/dashboard',
  PROVIDER_ONBOARDING: '/provider/register',
  PROVIDER_PACKAGES: '/provider/packages',
  PROVIDER_PACKAGE_NEW: '/provider/packages/new',
  PROVIDER_PACKAGE: (id: string) => `/provider/packages/${id}`,
  PROVIDER_BOOKINGS: '/provider/bookings',
  PROVIDER_BOOKING: (id: string) => `/provider/bookings/${id}`,
  PROVIDER_CUSTOMERS: '/provider/customers',
  PROVIDER_EARNINGS: '/provider/earnings',
  PROVIDER_REVIEWS: '/provider/reviews',
  PROVIDER_SETTINGS: '/provider/settings',

  // Partner (public-facing alias for Provider)
  PARTNER_LOGIN: '/partner/login',
  PARTNER_REGISTER: '/provider/register',
  PARTNER_VERIFICATION: '/partner/verification',
  PARTNER_NOTIFICATIONS: '/provider/notifications',

  // Admin
  ADMIN_OVERVIEW: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_PROVIDERS: '/admin/providers',
  ADMIN_PACKAGES: '/admin/packages',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_SETTLEMENTS: '/admin/settlements',
  ADMIN_REFUNDS: '/admin/refunds',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_DISPUTES: '/admin/disputes',
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_SETTINGS: '/admin/settings',

  // Deals (public)
  DEALS: '/deals',

  // Provider Deals
  PROVIDER_DEALS: '/provider/deals',
} as const;

// ─── Navigation ───────────────────────────────────────────────
export const PUBLIC_NAV = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Devotional Trips', href: ROUTES.DEVOTIONAL_TRIPS },
  { label: 'Packages', href: ROUTES.PACKAGES },
  { label: 'Stays', href: ROUTES.STAYS },
  { label: 'Foreign Trips', href: ROUTES.FOREIGN_TRIPS },
  { label: 'Deals', href: ROUTES.DEALS },
];

export const ACCOUNT_NAV = [
  { label: 'Dashboard', href: ROUTES.ACCOUNT_DASHBOARD, icon: 'LayoutDashboard' },
  { label: 'Bookings', href: ROUTES.ACCOUNT_BOOKINGS, icon: 'CalendarCheck' },
  { label: 'Upcoming Trips', href: ROUTES.ACCOUNT_UPCOMING, icon: 'MapPin' },
  { label: 'Completed Trips', href: ROUTES.ACCOUNT_COMPLETED, icon: 'CheckCircle' },
  { label: 'Cancelled', href: ROUTES.ACCOUNT_CANCELLED, icon: 'XCircle' },
  { label: 'Wishlist', href: ROUTES.ACCOUNT_WISHLIST, icon: 'Heart' },
  { label: 'Saved Providers', href: ROUTES.ACCOUNT_SAVED_PROVIDERS, icon: 'Star' },
  { label: 'Rewards', href: ROUTES.ACCOUNT_REWARDS, icon: 'Gift' },
  { label: 'Coupons', href: ROUTES.ACCOUNT_COUPONS, icon: 'Tag' },
  { label: 'Notifications', href: ROUTES.ACCOUNT_NOTIFICATIONS, icon: 'Bell' },
  { label: 'Payments', href: ROUTES.ACCOUNT_PAYMENTS, icon: 'CreditCard' },
  { label: 'Profile', href: ROUTES.ACCOUNT_PROFILE, icon: 'User' },
  { label: 'Settings', href: ROUTES.ACCOUNT_SETTINGS, icon: 'Settings' },
  { label: 'Security', href: ROUTES.ACCOUNT_SECURITY, icon: 'Shield' },
];

export const PROVIDER_NAV = [
  { label: 'Dashboard', href: ROUTES.PROVIDER_DASHBOARD, icon: 'LayoutDashboard' },
  { label: 'Packages', href: ROUTES.PROVIDER_PACKAGES, icon: 'Package' },
  { label: 'Bookings', href: ROUTES.PROVIDER_BOOKINGS, icon: 'CalendarCheck' },
  { label: 'Customers', href: ROUTES.PROVIDER_CUSTOMERS, icon: 'Users' },
  { label: 'Earnings', href: ROUTES.PROVIDER_EARNINGS, icon: 'TrendingUp' },
  { label: 'Reviews', href: ROUTES.PROVIDER_REVIEWS, icon: 'Star' },
  { label: 'Settings', href: ROUTES.PROVIDER_SETTINGS, icon: 'Settings' },
];

export const ADMIN_NAV = [
  { label: 'Dashboard', href: ROUTES.ADMIN_DASHBOARD, icon: 'LayoutDashboard' },
  { label: 'Customers', href: ROUTES.ADMIN_CUSTOMERS, icon: 'Users' },
  { label: 'Providers', href: ROUTES.ADMIN_PROVIDERS, icon: 'Building2' },
  { label: 'Packages', href: ROUTES.ADMIN_PACKAGES, icon: 'Package' },
  { label: 'Bookings', href: ROUTES.ADMIN_BOOKINGS, icon: 'CalendarCheck' },
  { label: 'Payments', href: ROUTES.ADMIN_PAYMENTS, icon: 'CreditCard' },
  { label: 'Refunds', href: ROUTES.ADMIN_REFUNDS, icon: 'RotateCcw' },
  { label: 'Disputes', href: ROUTES.ADMIN_DISPUTES, icon: 'AlertTriangle' },
  { label: 'Coupons', href: ROUTES.ADMIN_COUPONS, icon: 'Tag' },
  { label: 'Notifications', href: ROUTES.ADMIN_NOTIFICATIONS, icon: 'Bell' },
  { label: 'Categories', href: ROUTES.ADMIN_CATEGORIES, icon: 'Grid3X3' },
  { label: 'Reports', href: ROUTES.ADMIN_REPORTS, icon: 'BarChart2' },
  { label: 'Settings', href: ROUTES.ADMIN_SETTINGS, icon: 'Settings' },
];

// ─── Package Categories ────────────────────────────────────────
export const PACKAGE_CATEGORIES = [
  { value: 'tour', label: 'Tour Packages', icon: '🗺️' },
  { value: 'devotional', label: 'Devotional Trips', icon: '🛕' },
  { value: 'foreign', label: 'Foreign Trips', icon: '✈️' },
  { value: 'villa', label: 'Villas', icon: '🏡' },
  { value: 'homestay', label: 'Homestays', icon: '🏠' },
  { value: 'hotel', label: 'Hotels', icon: '🏨' },
  { value: 'hostel', label: 'Hostels', icon: '🛏️' },
  { value: 'camping', label: 'Camping', icon: '⛺' },
  { value: 'food', label: 'Food Experiences', icon: '🍽️' },
  { value: 'adventure', label: 'Adventures', icon: '🧗' },
  { value: 'guide', label: 'Local Guides', icon: '🧭' },
  { value: 'cab', label: 'Cab Services', icon: '🚗' },
] as const;

// ─── Sort Options ─────────────────────────────────────────────
export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
] as const;

// ─── Deal Types (filter chips on /deals page) ──────────────────
export const DEAL_TYPES = [
  { value: '', label: 'All Deals', emoji: '🔥' },
  { value: 'flash', label: 'Flash Deals', emoji: '⚡' },
  { value: 'limited_time', label: 'Limited Time', emoji: '⏳' },
  { value: 'early_bird', label: 'Early Bird', emoji: '🐦' },
  { value: 'last_minute', label: 'Last Minute', emoji: '🚀' },
  { value: 'weekend', label: 'Weekend Deals', emoji: '🌅' },
  { value: 'family', label: 'Family Deals', emoji: '👨‍👩‍👧‍👦' },
  { value: 'couple', label: 'Couple Deals', emoji: '💑' },
  { value: 'group', label: 'Group Deals', emoji: '🎒' },
  { value: 'seasonal', label: 'Seasonal', emoji: '🍂' },
  { value: 'budget', label: 'Budget Deals', emoji: '💰' },
] as const;


// ─── App Config ───────────────────────────────────────────────
export const APP_CONFIG = {
  name: 'Vibe Miles',
  tagline: 'Explore. Connect. Experience.',
  description: 'India\'s premier travel marketplace for authentic experiences',
  currency: 'INR',
  commissionRate: 15, // %
  taxRate: 5, // GST %
  rewardPointsRate: 10, // points per ₹100 spent
  rewardPointsValue: 0.5, // ₹ per point
  supportEmail: 'founder@vibemiles.com',
  supportPhone: '+91 8056648496',
} as const;

// ─── Booking Steps ────────────────────────────────────────────
export const BOOKING_STEPS = [
  { id: 1, label: 'Select Date' },
  { id: 2, label: 'Travelers' },
  { id: 3, label: 'Add-ons' },
  { id: 4, label: 'Details' },
  { id: 5, label: 'Summary' },
  { id: 6, label: 'Payment' },
] as const;

// ─── Provider Onboarding Steps ────────────────────────────────
export const PROVIDER_ONBOARDING_STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Business Details' },
  { id: 3, label: 'Category' },
  { id: 4, label: 'Address' },
  { id: 5, label: 'Verification' },
  { id: 6, label: 'Review' },
] as const;

// ─── Package Creation Steps ───────────────────────────────────
export const PACKAGE_CREATION_STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Pricing' },
  { id: 3, label: 'Media' },
  { id: 4, label: 'Availability' },
  { id: 5, label: 'Itinerary' },
  { id: 6, label: 'Inclusions' },
  { id: 7, label: 'Policies' },
  { id: 8, label: 'Preview' },
] as const;

// ─── Indian States ────────────────────────────────────────────
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
] as const;
