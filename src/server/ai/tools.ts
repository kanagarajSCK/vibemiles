// ============================================================
// VIBEMILES — AI ASSISTANT DATABASE-GROUNDED TOOLS
// ============================================================

import { prisma } from '@/lib/prisma';
import { getPublishedPackages, getPackageBySlug } from '@/server/db/packages';
import type { Package } from '@/types';
import type {
  SearchPackagesToolInput,
  GetPackageDetailsToolInput,
  CheckAvailabilityToolInput,
  ComparePackagesToolInput,
  PackageAvailabilityResult,
  PackageComparisonResult,
  PackageComparisonItem,
  AvailabilitySlotInfo,
} from './types';

/**
 * Sanitizes search input to prevent SQL injection or regex anomalies.
 */
function sanitizeText(str?: string): string | undefined {
  if (!str) return undefined;
  const cleaned = str.trim().slice(0, 100);
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Tool 1: Search published, approved, and active packages in PostgreSQL.
 * Strictly guarantees draft, pending, rejected, and archived packages are excluded.
 */
export async function searchPublishedPackagesTool(
  input: SearchPackagesToolInput
): Promise<{ packages: Package[]; totalCount: number; message: string }> {
  const query = sanitizeText(input.query);
  const destination = sanitizeText(input.destination);
  const state = sanitizeText(input.state);
  const category = sanitizeText(input.category);

  // Validate and sanitize numeric ranges
  const minPrice = typeof input.minPrice === 'number' && !isNaN(input.minPrice) && input.minPrice >= 0
    ? Math.floor(input.minPrice)
    : undefined;
  const maxPrice = typeof input.maxPrice === 'number' && !isNaN(input.maxPrice) && input.maxPrice >= 0
    ? Math.floor(input.maxPrice)
    : undefined;

  const minDuration = typeof input.minDurationDays === 'number' && !isNaN(input.minDurationDays) && input.minDurationDays > 0
    ? Math.floor(input.minDurationDays)
    : undefined;
  const maxDuration = typeof input.maxDurationDays === 'number' && !isNaN(input.maxDurationDays) && input.maxDurationDays > 0
    ? Math.floor(input.maxDurationDays)
    : undefined;

  const minRating = typeof input.minRating === 'number' && !isNaN(input.minRating) && input.minRating >= 0 && input.minRating <= 5
    ? input.minRating
    : undefined;

  const limit = typeof input.limit === 'number' && !isNaN(input.limit)
    ? Math.min(Math.max(1, Math.floor(input.limit)), 20)
    : 8;

  const validCategories = ['tour', 'devotional', 'foreign', 'villa', 'homestay', 'hotel', 'hostel', 'camping', 'food', 'adventure', 'guide', 'cab'];
  const validatedCategory = category && validCategories.includes(category.toLowerCase())
    ? (category.toLowerCase() as import('@/types').PackageCategory)
    : undefined;

  const packages = await getPublishedPackages({
    q: query,
    destination,
    state,
    category: validatedCategory,
    minPrice,
    maxPrice,
    minDuration,
    maxDuration,
    minRating,
    sort: input.sort || 'recommended',
    take: limit,
  });

  const message = packages.length > 0
    ? `Found ${packages.length} published travel packages matching the criteria.`
    : 'No published travel packages match your specified filters in our live catalog.';

  return {
    packages,
    totalCount: packages.length,
    message,
  };
}

/**
 * Tool 2: Retrieve complete verified listing details for a specific published package.
 */
export async function getPackageDetailsTool(
  input: GetPackageDetailsToolInput
): Promise<{ package: Package | null; message: string }> {
  const identifier = sanitizeText(input.packageSlugOrId);
  if (!identifier) {
    return { package: null, message: 'Invalid or missing package identifier.' };
  }

  const pkg = await getPackageBySlug(identifier, { requirePublished: true });
  if (!pkg) {
    return {
      package: null,
      message: `Travel package "${identifier}" was not found or is not currently published on VibeMiles.`,
    };
  }

  return {
    package: pkg,
    message: `Retrieved complete listing details for "${pkg.name}".`,
  };
}

/**
 * Tool 3: Check real database availability dates and capacity for a published package.
 */
export async function checkPackageAvailabilityTool(
  input: CheckAvailabilityToolInput
): Promise<PackageAvailabilityResult> {
  const identifier = sanitizeText(input.packageSlugOrId);
  if (!identifier) {
    return {
      packageId: '',
      packageSlug: '',
      packageName: 'Unknown',
      finalPrice: 0,
      availableSlots: [],
      totalAvailableSlots: 0,
      message: 'Package identifier is required to check availability.',
    };
  }

  const pkg = await getPackageBySlug(identifier, { requirePublished: true });
  if (!pkg) {
    return {
      packageId: '',
      packageSlug: identifier,
      packageName: 'Not Found',
      finalPrice: 0,
      availableSlots: [],
      totalAvailableSlots: 0,
      message: `Package "${identifier}" is not found or not published.`,
    };
  }

  const whereClause: {
    packageId: string;
    isAvailable: boolean;
    date?: { gte?: Date; lte?: Date };
  } = {
    packageId: pkg.id,
    isAvailable: true,
  };

  const now = new Date();
  // Filter for future dates by default
  const dateFilter: { gte?: Date; lte?: Date } = { gte: now };

  if (input.startDate) {
    const sDate = new Date(input.startDate);
    if (!isNaN(sDate.getTime())) {
      dateFilter.gte = sDate >= now ? sDate : now;
    }
  }

  if (input.endDate) {
    const eDate = new Date(input.endDate);
    if (!isNaN(eDate.getTime())) {
      dateFilter.lte = eDate;
    }
  }

  whereClause.date = dateFilter;

  const records = await prisma.packageAvailability.findMany({
    where: whereClause,
    orderBy: { date: 'asc' },
    take: 30,
  });

  const slots: AvailabilitySlotInfo[] = records
    .map((r) => {
      const remaining = Math.max(0, r.capacity - r.bookedCount);
      return {
        date: r.date.toISOString().split('T')[0],
        price: r.price,
        capacity: r.capacity,
        bookedCount: r.bookedCount,
        remainingCapacity: remaining,
        isAvailable: r.isAvailable && remaining > 0,
      };
    })
    .filter((s) => s.isAvailable);

  const message = slots.length > 0
    ? `There are ${slots.length} upcoming available departure dates for "${pkg.name}".`
    : `No upcoming departure dates with open capacity were found for "${pkg.name}".`;

  return {
    packageId: pkg.id,
    packageSlug: pkg.slug,
    packageName: pkg.name,
    finalPrice: pkg.finalPrice,
    availableSlots: slots,
    totalAvailableSlots: slots.length,
    message,
  };
}

/**
 * Tool 4: Compare two or more published packages side by side.
 */
export async function comparePackagesTool(
  input: ComparePackagesToolInput
): Promise<PackageComparisonResult> {
  const idsOrSlugs = (input.packageSlugsOrIds || [])
    .map(sanitizeText)
    .filter((s): s is string => Boolean(s))
    .slice(0, 4);

  if (idsOrSlugs.length < 2) {
    return {
      packages: [],
      summary: 'Please specify at least two package names or slugs to perform a comparison.',
    };
  }

  const fetched = await Promise.all(
    idsOrSlugs.map((id) => getPackageBySlug(id, { requirePublished: true }))
  );

  const validPackages = fetched.filter((p): p is Package => p !== null);

  if (validPackages.length === 0) {
    return {
      packages: [],
      summary: 'None of the requested packages could be found in the published VibeMiles catalogue.',
    };
  }

  const comparisonItems: PackageComparisonItem[] = validPackages.map((p) => {
    const availableSlots = p.availableDates?.filter((d) => d.isAvailable && d.capacity > d.bookedCount) || [];
    const nextSlot = availableSlots[0]?.date;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      destination: p.destinationName,
      state: p.state,
      category: p.category,
      duration: `${p.durationDays}D / ${p.durationNights}N`,
      finalPrice: p.finalPrice,
      basePrice: p.basePrice,
      discountPercent: p.discountPercent,
      rating: p.rating,
      reviewCount: p.reviewCount,
      maxGroupSize: p.maxGroupSize,
      providerName: p.providerName,
      inclusionsCount: p.inclusions?.length || 0,
      topInclusions: (p.inclusions || []).slice(0, 5),
      topExclusions: (p.exclusions || []).slice(0, 4),
      highlights: (p.highlights || []).slice(0, 4),
      cancellationPolicy: typeof p.cancellationPolicy === 'string' ? p.cancellationPolicy : 'Standard Policy',
      availableDatesCount: availableSlots.length,
      nextAvailableDate: nextSlot,
    };
  });

  const summary = `Compared ${validPackages.length} packages: ${validPackages
    .map((p) => `"${p.name}" (₹${p.finalPrice.toLocaleString('en-IN')})`)
    .join(' vs ')}.`;

  return {
    packages: comparisonItems,
    summary,
  };
}

/**
 * Tool 5: Retrieve active destinations for recommendation discovery.
 */
export async function getDestinationsTool(limit = 12) {
  const destinations = await prisma.destination.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      state: true,
      description: true,
      isPopular: true,
      isTrending: true,
      packageCount: true,
      rating: true,
    },
    orderBy: [{ isPopular: 'desc' }, { packageCount: 'desc' }],
    take: limit,
  });

  return destinations;
}

/**
 * Tool 6: Retrieve active travel categories.
 */
export async function getCategoriesTool() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
    },
    orderBy: { name: 'asc' },
  });

  return categories;
}
