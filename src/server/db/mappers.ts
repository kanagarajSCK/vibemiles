import type {
  Package as PrismaPackage,
  PackageImage as PrismaPackageImage,
  ItineraryDay as PrismaItineraryDay,
  PackageInclusion as PrismaPackageInclusion,
  PackageAvailability as PrismaPackageAvailability,
  Destination as PrismaDestination,
  Category as PrismaCategory,
  ProviderProfile as PrismaProviderProfile,
  Review as PrismaReview,
} from '@prisma/client';
import type {
  Package,
  Destination,
  Review,
  PackageCategory,
  ApprovalStatus,
  ListingStatus,
  CancellationPolicy,
  ItineraryDay,
  AvailableDate,
} from '@/types';
import { getCategoryDefaultCoverImage } from '@/constants';

export interface FullPrismaPackage extends PrismaPackage {
  images: PrismaPackageImage[];
  itinerary: PrismaItineraryDay[];
  inclusions: PrismaPackageInclusion[];
  availability: PrismaPackageAvailability[];
  destination?: Pick<PrismaDestination, 'id' | 'name' | 'state' | 'slug'> | null;
  category?: Pick<PrismaCategory, 'id' | 'slug' | 'name'> | null;
  provider?: Pick<PrismaProviderProfile, 'id' | 'businessName' | 'userId'> | null;
}

export function parseCancellationPolicy(raw: string | null): CancellationPolicy {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          freeCancellationDays: typeof parsed.freeCancellationDays === 'number' ? parsed.freeCancellationDays : 7,
          refundTiers: Array.isArray(parsed.refundTiers) ? parsed.refundTiers : [],
          isNonRefundable: Boolean(parsed.isNonRefundable),
          notes: parsed.notes ?? raw,
        };
      }
    } catch {
      return {
        freeCancellationDays: 7,
        refundTiers: [],
        isNonRefundable: false,
        notes: raw,
      };
    }
  }

  return {
    freeCancellationDays: 7,
    refundTiers: [
      { daysBeforeTravel: 15, refundPercent: 100, description: '100% refund up to 15 days before travel' },
      { daysBeforeTravel: 7, refundPercent: 50, description: '50% refund up to 7 days before travel' },
      { daysBeforeTravel: 0, refundPercent: 0, description: 'Non-refundable within 7 days of departure' },
    ],
    isNonRefundable: false,
    notes: 'Cancel up to 7 days before departure for a 50% refund. 100% refund if cancelled 15+ days prior.',
  };
}

/**
 * Maps a full Prisma Package relation object into the frontend Package domain type.
 */
export function mapPrismaPackageToDomain(pkg: FullPrismaPackage): Package {
  // Sort and extract image URLs
  const sortedImages = [...(pkg.images || [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => img.url);

  // Split inclusions and exclusions
  const inclusions = (pkg.inclusions || [])
    .filter((inc) => inc.isIncluded)
    .map((inc) => inc.text);

  const exclusions = (pkg.inclusions || [])
    .filter((inc) => !inc.isIncluded)
    .map((inc) => inc.text);

  // Map itinerary days
  const itinerary: ItineraryDay[] = [...(pkg.itinerary || [])]
    .sort((a, b) => a.day - b.day)
    .map((day) => ({
      day: day.day,
      title: day.title,
      description: day.description,
      activities: day.activities || [],
      meals: day.meals || [],
      accommodation: day.accommodation ?? undefined,
      location: day.location ?? undefined,
    }));

  // Map availability dates
  const availableDates: AvailableDate[] = (pkg.availability || [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((avail) => ({
      id: avail.id,
      date: avail.date instanceof Date ? avail.date.toISOString().split('T')[0] : String(avail.date).split('T')[0],
      price: avail.price,
      capacity: avail.capacity,
      bookedCount: avail.bookedCount,
      isAvailable: avail.isAvailable,
    }));

  return {
    id: pkg.id,
    slug: pkg.slug,
    providerId: pkg.providerId,
    providerName: pkg.provider?.businessName || 'Verified Host',
    name: pkg.name,
    category: (pkg.category?.slug || 'tour') as PackageCategory,
    description: pkg.description,
    highlights: pkg.highlights || [],
    destinationId: pkg.destinationId,
    destinationName: pkg.destination?.name || pkg.city || 'India',
    state: pkg.state || pkg.destination?.state || 'India',
    city: pkg.city ?? undefined,
    durationDays: pkg.durationDays,
    durationNights: pkg.durationNights,
    maxGroupSize: pkg.maxGroupSize,
    basePrice: pkg.basePrice,
    discountPercent: pkg.discountPercent,
    finalPrice: pkg.finalPrice,
    currency: pkg.currency || 'INR',
    images: sortedImages.length > 0 ? sortedImages : [getCategoryDefaultCoverImage(pkg.category?.slug)],
    videoUrl: pkg.videoUrl ?? undefined,
    itinerary,
    inclusions,
    exclusions,
    availableDates,
    cancellationPolicy: parseCancellationPolicy(pkg.cancellationPolicy),
    rating: pkg.rating,
    reviewCount: pkg.reviewCount,
    bookingCount: pkg.bookingCount,
    approvalStatus: pkg.approvalStatus.toLowerCase() as ApprovalStatus,
    status: pkg.status as unknown as ListingStatus,
    rejectionReason: pkg.rejectionReason ?? undefined,
    isActive: pkg.isActive,
    isFeatured: pkg.isFeatured,
    createdAt: pkg.createdAt instanceof Date ? pkg.createdAt.toISOString() : String(pkg.createdAt),
    updatedAt: pkg.updatedAt instanceof Date ? pkg.updatedAt.toISOString() : String(pkg.updatedAt),
    tags: pkg.tags || [],
    metadata: (pkg.metadata as Record<string, any>) ?? undefined,
  };
}

/**
 * Maps a Prisma Destination record to the frontend Destination domain type.
 */
export function mapPrismaDestinationToDomain(d: PrismaDestination): Destination {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    state: d.state,
    country: d.country,
    description: d.description,
    heroImage: d.heroImage,
    images: d.images || [],
    bestTimeToVisit: d.bestTimeToVisit,
    averageTemperature: d.averageTemperature ?? undefined,
    topActivities: d.topActivities || [],
    isPopular: d.isPopular,
    isTrending: d.isTrending,
    packageCount: d.packageCount,
    rating: d.rating,
    reviewCount: d.reviewCount,
    tags: d.tags || [],
  };
}

/**
 * Maps a Prisma Review record with customer profile to frontend Review domain type.
 */
export function mapPrismaReviewToDomain(
  r: PrismaReview & { customer?: { fullName: string; avatar: string | null } | null }
): Review {
  return {
    id: r.id,
    packageId: r.packageId,
    bookingId: r.bookingId || '',
    customerId: r.customerId,
    customerName: r.customer?.fullName || 'Verified Traveler',
    customerAvatar: r.customer?.avatar ?? undefined,
    rating: r.rating,
    title: r.title || '',
    content: r.comment,
    images: [],
    isVerifiedBooking: Boolean(r.bookingId),
    status: r.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    moderationNote: r.moderationNote ?? undefined,
    providerReply: r.providerReply ?? undefined,
    providerReplyAt: r.providerReplyAt ? r.providerReplyAt.toISOString() : undefined,
    helpfulCount: 0,
    isReported: false,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}
