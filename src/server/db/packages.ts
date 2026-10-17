import { prisma } from '@/lib/prisma';
import { ListingStatus, ApprovalStatus, VerificationStatus, NotificationType, UserRole, Prisma } from '@prisma/client';
import type { Package, SortOption, SearchFilters } from '@/types';
import { mapPrismaPackageToDomain, FullPrismaPackage } from './mappers';
import { handleDbError } from './errors';
import { createNotificationInDb } from './notifications';
import { recordAuditLog } from './admin';
import { MOCK_PACKAGES } from '@/lib/mock-data';
import { slugify } from '@/lib/utils';

export interface GetPackagesOptions extends SearchFilters {
  q?: string;
  minDuration?: number;
  maxDuration?: number;
  duration?: number;
  isFeatured?: boolean;
  sort?: SortOption;
  skip?: number;
  take?: number;
}

const PACKAGE_DEFAULT_INCLUDES = {
  images: {
    orderBy: { sortOrder: 'asc' as const },
  },
  itinerary: {
    orderBy: { day: 'asc' as const },
  },
  inclusions: true,
  availability: {
    where: {
      isAvailable: true,
    },
    orderBy: { date: 'asc' as const },
  },
  destination: {
    select: {
      id: true,
      name: true,
      state: true,
      slug: true,
    },
  },
  category: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  provider: {
    select: {
      id: true,
      businessName: true,
      userId: true,
    },
  },
};

/**
 * Lean relations optimized for package cards and search listings.
 * Skips full itinerary days and inclusions to save 4 expensive round-trips.
 */
export const PACKAGE_CARD_INCLUDES = {
  images: {
    orderBy: { sortOrder: 'asc' as const },
    take: 3,
  },
  destination: {
    select: {
      id: true,
      name: true,
      state: true,
      slug: true,
    },
  },
  category: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  provider: {
    select: {
      id: true,
      businessName: true,
    },
  },
};

/**
 * Filter mock packages in memory for development fallback
 */
function filterMockPackages(options?: GetPackagesOptions): Package[] {
  let list = [...MOCK_PACKAGES];

  if (options?.q) {
    const q = options.q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.destinationName.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (options?.destination) {
    const q = options.destination.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.destinationName.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        p.name.toLowerCase().includes(q)
    );
  }

  if (options?.category) {
    const cat = options.category.toLowerCase();
    list = list.filter((p) => p.category.toLowerCase() === cat);
  }

  if (options?.minPrice !== undefined) {
    list = list.filter((p) => p.finalPrice >= options.minPrice!);
  }

  if (options?.maxPrice !== undefined) {
    list = list.filter((p) => p.finalPrice <= options.maxPrice!);
  }

  const minDuration = options?.minDuration ?? options?.minDays ?? options?.duration;
  const maxDuration = options?.maxDuration ?? options?.maxDays ?? options?.duration;
  if (minDuration !== undefined) {
    list = list.filter((p) => p.durationDays >= minDuration);
  }
  if (maxDuration !== undefined) {
    list = list.filter((p) => p.durationDays <= maxDuration);
  }

  if (options?.isFeatured !== undefined) {
    list = list.filter((p) => p.isFeatured === options.isFeatured);
  }

  if (options?.sort) {
    if (options.sort === 'price_asc') list.sort((a, b) => a.finalPrice - b.finalPrice);
    if (options.sort === 'price_desc') list.sort((a, b) => b.finalPrice - a.finalPrice);
    if (options.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (options.sort === 'popularity') list.sort((a, b) => b.bookingCount - a.bookingCount);
    if (options.sort === 'newest') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (options?.skip || options?.take) {
    const skip = options.skip || 0;
    const take = options.take ? skip + options.take : undefined;
    list = list.slice(skip, take);
  }

  return list;
}

/**
 * Builds the Prisma where filter for published marketplace listings.
 * Strictly respects marketplace moderation status: DRAFT, PENDING_REVIEW, REJECTED,
 * and ARCHIVED packages are NEVER matched for public shoppers.
 */
export function buildPublishedPackagesWhere(options?: GetPackagesOptions): Prisma.PackageWhereInput {
  const andConditions: Prisma.PackageWhereInput[] = [
    { status: ListingStatus.PUBLISHED },
    { approvalStatus: ApprovalStatus.APPROVED },
    { isActive: true },
    {
      provider: {
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      },
    },
  ];

  // Combined keyword search
  if (options?.q && options.q.trim()) {
    const q = options.q.trim();
    andConditions.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
        { destination: { name: { contains: q, mode: 'insensitive' } } },
        { destination: { state: { contains: q, mode: 'insensitive' } } },
        { tags: { has: q.toLowerCase() } },
      ],
    });
  }

  // Destination filter
  if (options?.destination && options.destination.trim()) {
    const dest = options.destination.trim();
    andConditions.push({
      OR: [
        { destination: { name: { contains: dest, mode: 'insensitive' } } },
        { destination: { state: { contains: dest, mode: 'insensitive' } } },
        { destination: { slug: { contains: dest, mode: 'insensitive' } } },
        { name: { contains: dest, mode: 'insensitive' } },
        { city: { contains: dest, mode: 'insensitive' } },
        { state: { contains: dest, mode: 'insensitive' } },
      ],
    });
  }

  // State filter
  if (options?.state && options.state.trim()) {
    andConditions.push({
      OR: [
        { state: { contains: options.state.trim(), mode: 'insensitive' } },
        { destination: { state: { contains: options.state.trim(), mode: 'insensitive' } } },
      ],
    });
  }

  // City filter
  if (options?.city && options.city.trim()) {
    andConditions.push({
      city: { contains: options.city.trim(), mode: 'insensitive' },
    });
  }

  // Category filter
  if (options?.category) {
    andConditions.push({
      category: {
        slug: { equals: options.category.toLowerCase(), mode: 'insensitive' },
      },
    });
  }

  // Price range filter
  if (options?.minPrice !== undefined || options?.maxPrice !== undefined) {
    const priceFilter: Prisma.IntFilter = {};
    if (options.minPrice !== undefined && !isNaN(options.minPrice)) priceFilter.gte = options.minPrice;
    if (options.maxPrice !== undefined && !isNaN(options.maxPrice)) priceFilter.lte = options.maxPrice;
    andConditions.push({ finalPrice: priceFilter });
  }

  // Duration filter (durationDays)
  const minDays = options?.minDuration ?? options?.minDays ?? (options?.duration !== undefined ? options.duration : undefined);
  const maxDays = options?.maxDuration ?? options?.maxDays ?? (options?.duration !== undefined ? options.duration : undefined);
  if (minDays !== undefined || maxDays !== undefined) {
    const durationFilter: Prisma.IntFilter = {};
    if (minDays !== undefined && !isNaN(minDays)) durationFilter.gte = minDays;
    if (maxDays !== undefined && !isNaN(maxDays)) durationFilter.lte = maxDays;
    andConditions.push({ durationDays: durationFilter });
  }

  // Minimum rating filter
  if (options?.minRating !== undefined && !isNaN(options.minRating)) {
    andConditions.push({
      rating: { gte: options.minRating },
    });
  }

  // Featured filter
  if (options?.isFeatured !== undefined) {
    andConditions.push({
      isFeatured: options.isFeatured,
    });
  }

  return { AND: andConditions };
}

/**
 * Retrieves all published, approved, and active packages for public viewing.
 * Strictly respects marketplace moderation status: DRAFT, PENDING_REVIEW, and REJECTED
 * packages are NEVER returned to normal public shoppers.
 */
// ─── In-Memory TTL Cache for Published Packages & Catalogues ───
interface CachedPackageEntry {
  data: Package | null;
  timestamp: number;
}
interface CachedCatalogEntry<T = unknown> {
  data: T;
  timestamp: number;
}
const packageCache = new Map<string, CachedPackageEntry>();
const catalogCache = new Map<string, CachedCatalogEntry<unknown>>();
const PACKAGE_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function invalidatePackageCache(slugOrId?: string, secondaryKey?: string): void {
  if (slugOrId) {
    packageCache.delete(slugOrId.toLowerCase());
  }
  if (secondaryKey) {
    packageCache.delete(secondaryKey.toLowerCase());
  }
  if (!slugOrId && !secondaryKey) {
    packageCache.clear();
  }
  catalogCache.clear();

  if (typeof window === 'undefined') {
    try {
      // Dynamic require to prevent static client bundler errors
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nextCache = typeof require !== 'undefined' ? require('next/cache') : null;
      if (nextCache && typeof nextCache.revalidatePath === 'function') {
        nextCache.revalidatePath('/');
        nextCache.revalidatePath('/packages');
        nextCache.revalidatePath('/devotional-trips');
        nextCache.revalidatePath('/foreign-trips');
        if (slugOrId) {
          nextCache.revalidatePath(`/packages/${slugOrId}`);
        }
        if (secondaryKey) {
          nextCache.revalidatePath(`/packages/${secondaryKey}`);
        }
      }
    } catch {
      // Safely ignore when called outside Next.js request context (e.g. standalone test scripts)
    }
  }
}

/**
 * Retrieves all published, approved, and active packages for public viewing.
 * Strictly respects marketplace moderation status: DRAFT, PENDING_REVIEW, and REJECTED
 * packages are NEVER returned to normal public shoppers.
 */
export async function getPublishedPackages(options?: GetPackagesOptions): Promise<Package[]> {
  const cacheKey = `pub:${JSON.stringify(options || {})}`;
  const cached = catalogCache.get(cacheKey) as CachedCatalogEntry<Package[]> | undefined;
  if (cached && Date.now() - cached.timestamp < PACKAGE_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const where = buildPublishedPackagesWhere(options);

    // Determine sorting
    let orderBy: Prisma.PackageOrderByWithRelationInput | Prisma.PackageOrderByWithRelationInput[] = [
      { isFeatured: 'desc' },
      { rating: 'desc' },
    ];

    if (options?.sort === 'price_asc') {
      orderBy = { finalPrice: 'asc' };
    } else if (options?.sort === 'price_desc') {
      orderBy = { finalPrice: 'desc' };
    } else if (options?.sort === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (options?.sort === 'popularity') {
      orderBy = { bookingCount: 'desc' };
    } else if (options?.sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const records = await prisma.package.findMany({
      where,
      orderBy,
      skip: options?.skip,
      take: options?.take,
      include: PACKAGE_CARD_INCLUDES,
    });

    const result = records.map((r) => mapPrismaPackageToDomain(r as unknown as FullPrismaPackage));
    catalogCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    return handleDbError(error, 'getPublishedPackages', () => filterMockPackages(options));
  }
}

/**
 * Returns total count of published, approved, and active packages matching the filter options.
 */
export async function countPublishedPackages(options?: GetPackagesOptions): Promise<number> {
  const cacheKey = `count:${JSON.stringify(options || {})}`;
  const cached = catalogCache.get(cacheKey) as CachedCatalogEntry<number> | undefined;
  if (cached && Date.now() - cached.timestamp < PACKAGE_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const where = buildPublishedPackagesWhere(options);
    const count = await prisma.package.count({ where });
    catalogCache.set(cacheKey, { data: count, timestamp: Date.now() });
    return count;
  } catch (error) {
    return handleDbError(error, 'countPublishedPackages', () => filterMockPackages(options).length);
  }
}

/**
 * Retrieves published packages and total count for paginated marketplace browsing.
 */
export async function getPublishedPackagesWithCount(
  options?: GetPackagesOptions
): Promise<{ packages: Package[]; total: number }> {
  const [packages, total] = await Promise.all([
    getPublishedPackages(options),
    countPublishedPackages(options),
  ]);
  return { packages, total };
}

/**
 * Retrieves a single package by its slug or ID.
 */
export async function getPackageBySlug(
  slug: string,
  options?: {
    requirePublished?: boolean;
    allowPreviewForUser?: { id: string; role?: string };
  }
): Promise<Package | null> {
  const isPrivilegedRole = options?.allowPreviewForUser?.role?.toLowerCase() === 'admin';
  const requirePublished = isPrivilegedRole ? false : (options?.requirePublished ?? true);
  const cacheKey = slug.toLowerCase();

  if (requirePublished) {
    const cached = packageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < PACKAGE_CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const where: Prisma.PackageWhereInput = {
      OR: [{ slug }, { id: slug }],
    };

    if (requirePublished) {
      where.status = ListingStatus.PUBLISHED;
      where.approvalStatus = ApprovalStatus.APPROVED;
      where.isActive = true;
      where.provider = {
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      };
    }

    const record = await prisma.package.findFirst({
      where,
      include: PACKAGE_DEFAULT_INCLUDES,
    });

    if (!record) {
      if (requirePublished) {
        packageCache.set(cacheKey, { data: null, timestamp: Date.now() });
      }
      return null;
    }

    // If requirePublished was false (e.g. preview requested), check if user is allowed to preview
    if (!requirePublished && !isPrivilegedRole) {
      const isOwner =
        options?.allowPreviewForUser?.id &&
        (record.providerId === options.allowPreviewForUser.id ||
         record.provider.id === options.allowPreviewForUser.id ||
         record.provider.userId === options.allowPreviewForUser.id);

      const isPubliclyLive =
        record.status === ListingStatus.PUBLISHED &&
        record.approvalStatus === ApprovalStatus.APPROVED &&
        record.isActive;

      if (!isOwner && !isPubliclyLive) {
        return null;
      }
    }

    const domainPackage = mapPrismaPackageToDomain(record as unknown as FullPrismaPackage);
    if (requirePublished) {
      packageCache.set(cacheKey, { data: domainPackage, timestamp: Date.now() });
      packageCache.set(domainPackage.id.toLowerCase(), { data: domainPackage, timestamp: Date.now() });
      packageCache.set(domainPackage.slug.toLowerCase(), { data: domainPackage, timestamp: Date.now() });
    }
    return domainPackage;
  } catch (error) {
    return handleDbError(error, `getPackageBySlug(${slug})`, () => {
      const found = MOCK_PACKAGES.find((p) => p.slug === slug || p.id === slug);
      return found ?? null;
    });
  }
}

/**
 * Retrieves featured packages for homepage or highlighted placements.
 */
export async function getFeaturedPackages(limit = 6): Promise<Package[]> {
  const cacheKey = `feat:${limit}`;
  const cached = catalogCache.get(cacheKey) as CachedCatalogEntry<Package[]> | undefined;
  if (cached && Date.now() - cached.timestamp < PACKAGE_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const records = await prisma.package.findMany({
      where: {
        isFeatured: true,
        status: ListingStatus.PUBLISHED,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        provider: {
          verificationStatus: VerificationStatus.VERIFIED,
          isActive: true,
        },
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: PACKAGE_CARD_INCLUDES,
    });

    const result = records.map((r) => mapPrismaPackageToDomain(r as unknown as FullPrismaPackage));
    catalogCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    return handleDbError(error, 'getFeaturedPackages', () => {
      return MOCK_PACKAGES.filter((p) => p.isFeatured).slice(0, limit);
    });
  }
}

/**
 * Retrieves packages for a specific destination by destination slug or name.
 */
export async function getPackagesByDestination(
  destinationSlugOrName: string,
  limit?: number
): Promise<Package[]> {
  try {
    const records = await prisma.package.findMany({
      where: {
        OR: [
          { destination: { slug: destinationSlugOrName } },
          { destination: { name: { equals: destinationSlugOrName, mode: 'insensitive' } } },
        ],
        status: ListingStatus.PUBLISHED,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        provider: {
          verificationStatus: VerificationStatus.VERIFIED,
          isActive: true,
        },
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: PACKAGE_CARD_INCLUDES,
    });

    return records.map((r) => mapPrismaPackageToDomain(r as unknown as FullPrismaPackage));
  } catch (error) {
    return handleDbError(error, `getPackagesByDestination(${destinationSlugOrName})`, () => {
      const q = destinationSlugOrName.toLowerCase();
      return MOCK_PACKAGES.filter(
        (p) =>
          p.destinationName.toLowerCase() === q ||
          p.destinationId.toLowerCase() === q ||
          p.state.toLowerCase() === q
      ).slice(0, limit);
    });
  }
}

/**
 * Retrieves packages for a category by category slug.
 */
export async function getPackagesByCategory(categorySlug: string, limit?: number): Promise<Package[]> {
  try {
    const records = await prisma.package.findMany({
      where: {
        category: { slug: categorySlug.toLowerCase() },
        status: ListingStatus.PUBLISHED,
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
        provider: {
          verificationStatus: VerificationStatus.VERIFIED,
          isActive: true,
        },
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: PACKAGE_CARD_INCLUDES,
    });

    return records.map((r) => mapPrismaPackageToDomain(r as unknown as FullPrismaPackage));
  } catch (error) {
    return handleDbError(error, `getPackagesByCategory(${categorySlug})`, () => {
      const cat = categorySlug.toLowerCase();
      return MOCK_PACKAGES.filter((p) => p.category.toLowerCase() === cat).slice(0, limit);
    });
  }
}

/**
 * Search packages across titles, descriptions, tags, cities, and destinations.
 */
export async function searchPackages(query: string, limit = 20): Promise<Package[]> {
  const q = query.trim();
  return getPublishedPackages({ q: q || undefined, take: limit });
}

/**
 * Retrieves all packages belonging to a provider (all moderation statuses).
 */
export async function getPackagesForProvider(providerId: string): Promise<Package[]> {
  try {
    const records = await prisma.package.findMany({
      where: {
        OR: [{ providerId }, { provider: { userId: providerId } }],
      },
      orderBy: { createdAt: 'desc' },
      include: PACKAGE_DEFAULT_INCLUDES,
    });

    return records.map((r) => mapPrismaPackageToDomain(r as unknown as FullPrismaPackage));
  } catch (error) {
    return handleDbError(error, `getPackagesForProvider(${providerId})`, () => {
      return MOCK_PACKAGES.filter((p) => p.providerId === providerId);
    });
  }
}

export interface CreatePackageInput {
  name: string;
  description: string;
  categoryId?: string;
  categorySlug?: string;
  destinationId?: string;
  destinationName?: string;
  state?: string;
  city?: string;
  durationDays?: number;
  durationNights?: number;
  maxGroupSize?: number;
  basePrice: number;
  discountPercent?: number;
  currency?: string;
  images?: string[];
  videoUrl?: string;
  itinerary?: {
    day: number;
    title: string;
    description?: string;
    activities?: string[];
    meals?: string[];
    accommodation?: string;
    location?: string;
  }[];
  inclusions?: string[];
  exclusions?: string[];
  availableDates?: {
    date: string | Date;
    price: number;
    capacity: number;
  }[];
  cancellationPolicy?: string;
  highlights?: string[];
  tags?: string[];
  status?: 'DRAFT' | 'PENDING_REVIEW';
}

export interface UpdatePackageInput extends Partial<CreatePackageInput> {
  submitForReview?: boolean;
  unarchive?: boolean;
}

/**
 * Resolves a provider profile using either provider profile id or user id.
 */
async function resolveProvider(providerIdentifier: string) {
  const provider = await prisma.providerProfile.findFirst({
    where: {
      OR: [{ id: providerIdentifier }, { userId: providerIdentifier }],
    },
  });
  if (!provider) {
    throw new Error('Provider profile not found');
  }
  return provider;
}

/**
 * Resolves or creates a Destination record based on name or ID.
 */
async function resolveDestination(input: {
  destinationId?: string;
  destinationName?: string;
  city?: string;
  state?: string;
}) {
  if (input.destinationId) {
    const dest = await prisma.destination.findUnique({ where: { id: input.destinationId } });
    if (dest) return dest;
  }

  const name = (input.destinationName || input.city || 'India').trim();
  const destByName = await prisma.destination.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: 'insensitive' } },
        { slug: { equals: slugify(name), mode: 'insensitive' } },
      ],
    },
  });
  if (destByName) return destByName;

  const firstDest = await prisma.destination.findFirst();
  if (firstDest && !input.destinationName && !input.city) {
    return firstDest;
  }

  const slug = `${slugify(name) || 'dest'}-${Math.random().toString(36).substring(2, 6)}`;
  return prisma.destination.create({
    data: {
      name,
      slug,
      state: input.state || 'India',
      country: 'India',
      description: `Explore the vibrant beauty of ${name}.`,
      heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'],
      bestTimeToVisit: 'October to March',
      topActivities: ['Sightseeing', 'Cultural Tours', 'Local Cuisine'],
    },
  });
}

/**
 * Resolves a Category record based on id or slug.
 */
async function resolveCategory(categoryId?: string, categorySlug?: string) {
  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (cat) return cat;
  }

  const slug = (categorySlug || 'tour').toLowerCase().trim();
  const catBySlug = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: { equals: slug, mode: 'insensitive' } },
        { name: { equals: slug, mode: 'insensitive' } },
      ],
    },
  });
  if (catBySlug) return catBySlug;

  const firstCat = await prisma.category.findFirst();
  if (firstCat) return firstCat;

  return prisma.category.create({
    data: {
      slug: 'tour',
      name: 'Tours & Treks',
      description: 'Exciting tours and treks across India.',
    },
  });
}

/**
 * Retrieves a single package belonging to a provider (all moderation statuses).
 * IDOR safe: returns null if package does not belong to provider.
 */
export async function getPackageByIdForProvider(
  packageId: string,
  providerIdentifier: string
): Promise<Package | null> {
  try {
    const record = await prisma.package.findFirst({
      where: {
        id: packageId,
        OR: [{ providerId: providerIdentifier }, { provider: { userId: providerIdentifier } }],
      },
      include: PACKAGE_DEFAULT_INCLUDES,
    });

    if (!record) return null;
    return mapPrismaPackageToDomain(record as unknown as FullPrismaPackage);
  } catch (error) {
    return handleDbError(error, `getPackageByIdForProvider(${packageId})`, () => null);
  }
}

/**
 * Creates a new package listing for a provider in PostgreSQL.
 * Starts in DRAFT status (or PENDING_REVIEW if requested).
 */
export async function createPackage(
  providerIdentifier: string,
  input: CreatePackageInput
): Promise<Package> {
  const provider = await resolveProvider(providerIdentifier);

  if (provider.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new Error('KYC verification required: You must complete document verification and receive admin approval before creating services.');
  }
  if (!provider.isActive) {
    throw new Error('Your provider account is currently inactive or suspended.');
  }

  if (!input.name || input.name.trim().length < 3) {
    throw new Error('Package name must be at least 3 characters');
  }
  if (!input.description || input.description.trim().length < 10) {
    throw new Error('Package description must be at least 10 characters');
  }

  const category = await resolveCategory(input.categoryId, input.categorySlug);
  const destination = await resolveDestination({
    destinationId: input.destinationId,
    destinationName: input.destinationName,
    city: input.city,
    state: input.state,
  });

  const basePrice = Math.max(0, Number(input.basePrice) || 0);
  const discountPercent = Math.min(100, Math.max(0, Number(input.discountPercent) || 0));
  const finalPrice = Math.round(basePrice - (basePrice * discountPercent) / 100);

  const durationDays = Math.max(1, Number(input.durationDays) || 1);
  const durationNights = Math.max(0, Number(input.durationNights) ?? Math.max(0, durationDays - 1));
  const maxGroupSize = Math.max(1, Number(input.maxGroupSize) || 10);

  let baseSlug = slugify(input.name.trim());
  if (!baseSlug) baseSlug = 'package';
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

  // Filter valid image URLs (must be valid http/https URLs)
  const validImages = (input.images || []).filter(
    (u) => typeof u === 'string' && /^https?:\/\//i.test(u.trim())
  );
  const imageUrls =
    validImages.length > 0
      ? validImages
      : ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'];

  const initialStatus =
    input.status === 'PENDING_REVIEW' ? ListingStatus.PENDING_REVIEW : ListingStatus.DRAFT;

  const result = await prisma.$transaction(async (tx) => {
    const pkg = await tx.package.create({
      data: {
        slug,
        providerId: provider.id,
        categoryId: category.id,
        destinationId: destination.id,
        name: input.name.trim(),
        description: input.description.trim(),
        highlights: input.highlights || [],
        state: input.state || destination.state || 'India',
        city: input.city || destination.name || null,
        durationDays,
        durationNights,
        maxGroupSize,
        basePrice,
        discountPercent,
        finalPrice,
        currency: input.currency || 'INR',
        videoUrl: input.videoUrl || null,
        cancellationPolicy: input.cancellationPolicy || null,
        status: initialStatus,
        approvalStatus: ApprovalStatus.PENDING,
        isActive: true,
        isFeatured: false,
        tags: input.tags || [],
        rejectionReason: null,
      },
    });

    // Create PackageImage records
    await tx.packageImage.createMany({
      data: imageUrls.map((url, idx) => ({
        packageId: pkg.id,
        url,
        sortOrder: idx,
        isCover: idx === 0,
      })),
    });

    // Create ItineraryDay records
    const itinerary =
      input.itinerary && input.itinerary.length > 0
        ? input.itinerary
        : [
            {
              day: 1,
              title: 'Arrival & Welcome',
              description: 'Arrive at destination and complete check-in.',
              activities: ['Arrival', 'Check-in', 'Welcome Orientation'],
            },
          ];

    await tx.itineraryDay.createMany({
      data: itinerary.map((d, idx) => ({
        packageId: pkg.id,
        day: d.day || idx + 1,
        title: d.title || `Day ${idx + 1}`,
        description: d.description || '',
        activities: d.activities || [],
        meals: d.meals || [],
        accommodation: d.accommodation || null,
        location: d.location || null,
      })),
    });

    // Create Inclusions and Exclusions
    const inclusionsData: Prisma.PackageInclusionCreateManyInput[] = [];
    if (input.inclusions) {
      for (const text of input.inclusions) {
        if (text && text.trim()) {
          inclusionsData.push({ packageId: pkg.id, text: text.trim(), isIncluded: true });
        }
      }
    }
    if (input.exclusions) {
      for (const text of input.exclusions) {
        if (text && text.trim()) {
          inclusionsData.push({ packageId: pkg.id, text: text.trim(), isIncluded: false });
        }
      }
    }
    if (inclusionsData.length > 0) {
      await tx.packageInclusion.createMany({ data: inclusionsData });
    }

    // Create Availability dates
    if (input.availableDates && input.availableDates.length > 0) {
      await tx.packageAvailability.createMany({
        data: input.availableDates.map((avail) => ({
          packageId: pkg.id,
          date: new Date(avail.date),
          price: avail.price || finalPrice,
          capacity: avail.capacity || maxGroupSize,
          isAvailable: true,
        })),
      });
    } else {
      // Auto-generate 3 sample upcoming availability dates (7, 14, 21 days from now)
      const now = new Date();
      const defaultAvailabilities = [7, 14, 21].map((daysAhead) => {
        const d = new Date(now);
        d.setDate(d.getDate() + daysAhead);
        d.setHours(0, 0, 0, 0);
        return {
          packageId: pkg.id,
          date: d,
          price: finalPrice,
          capacity: maxGroupSize,
          isAvailable: true,
        };
      });
      await tx.packageAvailability.createMany({ data: defaultAvailabilities });
    }

    // Increment provider's total packages counter
    await tx.providerProfile.update({
      where: { id: provider.id },
      data: { totalPackages: { increment: 1 } },
    });

    return pkg;
  });

  const full = await prisma.package.findUnique({
    where: { id: result.id },
    include: PACKAGE_DEFAULT_INCLUDES,
  });

  invalidatePackageCache(result.id);
  return mapPrismaPackageToDomain(full as unknown as FullPrismaPackage);
}

/**
 * Updates an existing package.
 * IDOR Protected: throws error if package does not belong to provider.
 * Moderation Protected: if an APPROVED or PUBLISHED package is edited,
 * it is automatically reset to PENDING_REVIEW and approvalStatus to PENDING.
 */
export async function updatePackage(
  packageId: string,
  providerIdentifier: string,
  input: UpdatePackageInput
): Promise<Package> {
  const provider = await resolveProvider(providerIdentifier);

  const existing = await prisma.package.findFirst({
    where: {
      id: packageId,
      providerId: provider.id,
    },
    include: { destination: true, category: true },
  });

  if (!existing) {
    throw new Error('Package not found or access denied');
  }

  if (existing.status === ListingStatus.ARCHIVED && !input.unarchive) {
    throw new Error('Cannot edit an archived package');
  }

  // Calculate pricing
  const basePrice =
    input.basePrice !== undefined ? Math.max(0, Number(input.basePrice) || 0) : existing.basePrice;
  const discountPercent =
    input.discountPercent !== undefined
      ? Math.min(100, Math.max(0, Number(input.discountPercent) || 0))
      : existing.discountPercent;
  const finalPrice = Math.round(basePrice - (basePrice * discountPercent) / 100);

  // Moderation status transition logic
  let newStatus: ListingStatus = existing.status;
  let newApprovalStatus: ApprovalStatus = existing.approvalStatus;
  let newRejectionReason: string | null = existing.rejectionReason;

  if (
    existing.status === ListingStatus.PUBLISHED ||
    existing.status === ListingStatus.APPROVED ||
    existing.approvalStatus === ApprovalStatus.APPROVED
  ) {
    // Crucial rule: edits to approved/published listings must undergo re-moderation
    newStatus = ListingStatus.PENDING_REVIEW;
    newApprovalStatus = ApprovalStatus.PENDING;
    newRejectionReason = null;
  } else if (input.submitForReview) {
    newStatus = ListingStatus.PENDING_REVIEW;
    newApprovalStatus = ApprovalStatus.PENDING;
    newRejectionReason = null;
  } else if (input.unarchive) {
    newStatus = ListingStatus.DRAFT;
    newApprovalStatus = ApprovalStatus.PENDING;
    newRejectionReason = null;
  }

  // Category and Destination resolution
  let categoryId = existing.categoryId;
  if (input.categoryId || input.categorySlug) {
    const cat = await resolveCategory(input.categoryId, input.categorySlug);
    categoryId = cat.id;
  }

  let destinationId = existing.destinationId;
  if (input.destinationId || input.destinationName) {
    const dest = await resolveDestination({
      destinationId: input.destinationId,
      destinationName: input.destinationName,
      city: input.city || existing.city || undefined,
      state: input.state || existing.state,
    });
    destinationId = dest.id;
  }

  await prisma.$transaction(async (tx) => {
    await tx.package.update({
      where: { id: packageId },
      data: {
        name: input.name ? input.name.trim() : existing.name,
        description: input.description ? input.description.trim() : existing.description,
        categoryId,
        destinationId,
        state: input.state || existing.state,
        city: input.city !== undefined ? input.city : existing.city,
        durationDays: input.durationDays ? Math.max(1, Number(input.durationDays)) : existing.durationDays,
        durationNights:
          input.durationNights !== undefined
            ? Math.max(0, Number(input.durationNights))
            : existing.durationNights,
        maxGroupSize: input.maxGroupSize ? Math.max(1, Number(input.maxGroupSize)) : existing.maxGroupSize,
        basePrice,
        discountPercent,
        finalPrice,
        currency: input.currency || existing.currency,
        videoUrl: input.videoUrl !== undefined ? input.videoUrl : existing.videoUrl,
        cancellationPolicy:
          input.cancellationPolicy !== undefined ? input.cancellationPolicy : existing.cancellationPolicy,
        highlights: input.highlights || existing.highlights,
        tags: input.tags || existing.tags,
        status: newStatus,
        approvalStatus: newApprovalStatus,
        rejectionReason: newRejectionReason,
      },
    });

    // Update images if provided
    if (input.images !== undefined) {
      const validImages = (input.images || []).filter(
        (u) => typeof u === 'string' && /^https?:\/\//i.test(u.trim())
      );
      const imageUrls =
        validImages.length > 0
          ? validImages
          : ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'];

      await tx.packageImage.deleteMany({ where: { packageId } });
      await tx.packageImage.createMany({
        data: imageUrls.map((url, idx) => ({
          packageId,
          url,
          sortOrder: idx,
          isCover: idx === 0,
        })),
      });
    }

    // Update itinerary if provided
    if (input.itinerary !== undefined) {
      await tx.itineraryDay.deleteMany({ where: { packageId } });
      if (input.itinerary.length > 0) {
        await tx.itineraryDay.createMany({
          data: input.itinerary.map((d, idx) => ({
            packageId,
            day: d.day || idx + 1,
            title: d.title || `Day ${idx + 1}`,
            description: d.description || '',
            activities: d.activities || [],
            meals: d.meals || [],
            accommodation: d.accommodation || null,
            location: d.location || null,
          })),
        });
      }
    }

    // Update inclusions / exclusions if provided
    if (input.inclusions !== undefined || input.exclusions !== undefined) {
      await tx.packageInclusion.deleteMany({ where: { packageId } });
      const inclusionsData: Prisma.PackageInclusionCreateManyInput[] = [];
      if (input.inclusions) {
        for (const text of input.inclusions) {
          if (text && text.trim()) {
            inclusionsData.push({ packageId, text: text.trim(), isIncluded: true });
          }
        }
      }
      if (input.exclusions) {
        for (const text of input.exclusions) {
          if (text && text.trim()) {
            inclusionsData.push({ packageId, text: text.trim(), isIncluded: false });
          }
        }
      }
      if (inclusionsData.length > 0) {
        await tx.packageInclusion.createMany({ data: inclusionsData });
      }
    }

    // Update available dates if provided
    if (input.availableDates !== undefined) {
      await tx.packageAvailability.deleteMany({ where: { packageId } });
      if (input.availableDates.length > 0) {
        await tx.packageAvailability.createMany({
          data: input.availableDates.map((avail) => ({
            packageId,
            date: new Date(avail.date),
            price: avail.price || finalPrice,
            capacity: avail.capacity || existing.maxGroupSize,
            isAvailable: true,
          })),
        });
      }
    }
  });

  invalidatePackageCache(packageId);

  const full = await prisma.package.findUnique({
    where: { id: packageId },
    include: PACKAGE_DEFAULT_INCLUDES,
  });

  return mapPrismaPackageToDomain(full as unknown as FullPrismaPackage);
}

/**
 * Submits a draft or rejected package for admin moderation review.
 */
export async function submitPackageForReview(
  packageId: string,
  providerIdentifier: string
): Promise<Package> {
  const provider = await resolveProvider(providerIdentifier);

  if (provider.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new Error('KYC verification required: You must complete document verification and receive admin approval before submitting services for moderation.');
  }
  if (!provider.isActive) {
    throw new Error('Your provider account is currently inactive or suspended.');
  }

  const existing = await prisma.package.findFirst({
    where: {
      id: packageId,
      providerId: provider.id,
    },
  });

  if (!existing) {
    throw new Error('Package not found or access denied');
  }

  if (existing.status === ListingStatus.ARCHIVED) {
    throw new Error('Archived packages cannot be submitted for review');
  }

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: {
      status: ListingStatus.PENDING_REVIEW,
      approvalStatus: ApprovalStatus.PENDING,
      rejectionReason: null,
    },
    include: PACKAGE_DEFAULT_INCLUDES,
  });

  invalidatePackageCache(packageId);
  return mapPrismaPackageToDomain(updated as unknown as FullPrismaPackage);
}

/**
 * Archives a package listing so it is hidden from the marketplace.
 */
export async function archivePackage(
  packageId: string,
  providerIdentifier: string
): Promise<Package> {
  const provider = await resolveProvider(providerIdentifier);

  const existing = await prisma.package.findFirst({
    where: {
      id: packageId,
      providerId: provider.id,
    },
  });

  if (!existing) {
    throw new Error('Package not found or access denied');
  }

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: {
      status: ListingStatus.ARCHIVED,
      isActive: false,
    },
    include: PACKAGE_DEFAULT_INCLUDES,
  });

  invalidatePackageCache(packageId);
  return mapPrismaPackageToDomain(updated as unknown as FullPrismaPackage);
}

/**
 * Admin action: approves a listing, publishing it to the public marketplace.
 */
export async function adminApprovePackage(packageId: string): Promise<Package> {
  const existing = await prisma.package.findUnique({
    where: { id: packageId },
    include: { provider: true },
  });

  if (!existing) {
    throw new Error('Package not found');
  }

  if (existing.provider.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new Error('Cannot approve package: Provider has not completed KYC document verification.');
  }
  if (!existing.provider.isActive) {
    throw new Error('Cannot approve package: Provider account is inactive or suspended.');
  }

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: {
      approvalStatus: ApprovalStatus.APPROVED,
      status: ListingStatus.PUBLISHED,
      isActive: true,
      rejectionReason: null,
    },
    include: PACKAGE_DEFAULT_INCLUDES,
  });

  // Dispatch In-App Notification to Provider (Asynchronous, Non-blocking, Idempotent)
  (async () => {
    try {
      const provider = await prisma.providerProfile.findUnique({
        where: { id: existing.providerId },
        select: { userId: true },
      });
      if (provider?.userId) {
        await createNotificationInDb({
          userId: provider.userId,
          type: NotificationType.LISTING_APPROVED,
          title: 'Listing Approved & Published',
          message: `Your package "${existing.name}" has been approved by admin and is now live on the marketplace.`,
          link: `/packages/${existing.slug}`,
          dedupKey: `notif:pkg_appr:${existing.id}`,
        });
      }
    } catch (notifErr) {
      console.error('[Notification] Error dispatching package approval notification:', notifErr);
    }
  })();

  invalidatePackageCache(existing.id, existing.slug);
  return mapPrismaPackageToDomain(updated as unknown as FullPrismaPackage);
}

/**
 * Admin action: rejects a listing with detailed feedback for the provider.
 */
export async function adminRejectPackage(packageId: string, reason: string): Promise<Package> {
  const trimmedReason = reason?.trim();
  if (!trimmedReason || trimmedReason.length < 5) {
    throw new Error('Rejection reason must be at least 5 characters long');
  }

  const existing = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!existing) {
    throw new Error('Package not found');
  }

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: {
      approvalStatus: ApprovalStatus.REJECTED,
      status: ListingStatus.REJECTED,
      rejectionReason: trimmedReason,
    },
    include: PACKAGE_DEFAULT_INCLUDES,
  });

  // Dispatch In-App Notification to Provider (Asynchronous, Non-blocking, Idempotent)
  (async () => {
    try {
      const provider = await prisma.providerProfile.findUnique({
        where: { id: existing.providerId },
        select: { userId: true },
      });
      if (provider?.userId) {
        await createNotificationInDb({
          userId: provider.userId,
          type: NotificationType.LISTING_REJECTED,
          title: 'Listing Requires Modification',
          message: `Your listing "${existing.name}" was rejected during moderation: "${trimmedReason}". Please revise and resubmit.`,
          link: '/provider/packages',
          dedupKey: `notif:pkg_rej:${existing.id}:${Date.now()}`,
        });
      }
    } catch (notifErr) {
      console.error('[Notification] Error dispatching package rejection notification:', notifErr);
    }
  })();

  invalidatePackageCache(existing.id, existing.slug);
  return mapPrismaPackageToDomain(updated as unknown as FullPrismaPackage);
}

/**
 * Admin action: suspends an active/published listing for compliance review.
 */
export async function adminSuspendPackage(packageId: string, reason?: string): Promise<Package> {
  const trimmedReason = reason?.trim() || 'Suspended by platform administrator for compliance review.';
  const existing = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!existing) {
    throw new Error('Package not found');
  }

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: {
      status: ListingStatus.ARCHIVED,
      approvalStatus: ApprovalStatus.REJECTED,
      isActive: false,
      rejectionReason: trimmedReason,
    },
    include: PACKAGE_DEFAULT_INCLUDES,
  });

  // Dispatch In-App Notification to Provider (Asynchronous, Non-blocking, Idempotent)
  (async () => {
    try {
      const provider = await prisma.providerProfile.findUnique({
        where: { id: existing.providerId },
        select: { userId: true },
      });
      if (provider?.userId) {
        await createNotificationInDb({
          userId: provider.userId,
          type: NotificationType.LISTING_REJECTED,
          title: 'Listing Suspended by Admin',
          message: `Your package "${existing.name}" has been suspended: "${trimmedReason}".`,
          link: '/provider/packages',
          dedupKey: `notif:pkg_susp:${existing.id}:${Date.now()}`,
        });
      }
    } catch (notifErr) {
      console.error('[Notification] Error dispatching package suspension notification:', notifErr);
    }
  })();

  invalidatePackageCache(existing.id, existing.slug);
  return mapPrismaPackageToDomain(updated as unknown as FullPrismaPackage);
}

/**
 * Admin query: retrieves all packages in the marketplace for moderation.
 */
export async function getAllPackagesForAdmin(options?: {
  status?: string;
  approvalStatus?: string;
  search?: string;
  providerId?: string;
  categoryId?: string;
  destinationId?: string;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}): Promise<Package[]> {
  try {
    const where: Prisma.PackageWhereInput = {};

    if (options?.status) {
      const s = options.status.toUpperCase();
      if (Object.values(ListingStatus).includes(s as ListingStatus)) {
        where.status = s as ListingStatus;
      }
    }

    if (options?.approvalStatus) {
      const a = options.approvalStatus.toUpperCase();
      if (Object.values(ApprovalStatus).includes(a as ApprovalStatus)) {
        where.approvalStatus = a as ApprovalStatus;
      }
    }

    if (options?.providerId) {
      where.providerId = options.providerId;
    }

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.destinationId) {
      where.destinationId = options.destinationId;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {
        ...(options.startDate ? { gte: options.startDate } : {}),
        ...(options.endDate ? { lte: options.endDate } : {}),
      };
    }

    if (options?.search) {
      const q = options.search.trim();
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { provider: { businessName: { contains: q, mode: 'insensitive' } } },
        { destination: { name: { contains: q, mode: 'insensitive' } } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const records = await prisma.package.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
      include: PACKAGE_DEFAULT_INCLUDES,
    });

    return records.map((r) => mapPrismaPackageToDomain(r as unknown as FullPrismaPackage));
  } catch (error) {
    // Return empty array on DB error, NEVER return mock packages in production admin
    console.error('[AdminPackages] Error retrieving packages for admin:', error);
    return [];
  }
}

/**
 * Admin action: Delete a package listing.
 * Enforces financial retention: if package has bookings, permanently deleting is prohibited;
 * instead, it is archived/soft-deleted to preserve transaction integrity.
 * If 0 bookings exist, it is safely permanently purged.
 */
export async function adminDeletePackage(params: {
  adminUser: { id: string; email: string };
  packageId: string;
  permanent: boolean;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, packageId, permanent, reason, ipAddress, userAgent } = params;

  if (!reason || reason.trim().length === 0) {
    throw new Error('A descriptive reason is strictly required for deleting or archiving a package listing.');
  }

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    select: { id: true, name: true, slug: true, status: true, providerId: true },
  });

  if (!pkg) {
    throw new Error('Package listing not found.');
  }

  const bookingsCount = await prisma.booking.count({
    where: { packageId },
  });

  if (bookingsCount > 0) {
    // Cannot permanently hard delete if historical bookings exist! Must archive
    const updated = await prisma.package.update({
      where: { id: packageId },
      data: {
        status: ListingStatus.ARCHIVED,
        approvalStatus: ApprovalStatus.REJECTED,
        isActive: false,
        rejectionReason: `Archived by Admin: ${reason.trim()}`,
      },
    });

    invalidatePackageCache(packageId, pkg.slug);

    await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: UserRole.ADMIN,
      action: 'PACKAGE_ARCHIVE',
      targetType: 'PACKAGE',
      targetId: packageId,
      reason: reason.trim(),
      metadata: {
        packageName: pkg.name,
        bookingsCount,
        enforcedArchiveDueToFinancialRecords: true,
      },
      ipAddress,
      userAgent,
    });

    return {
      action: 'ARCHIVED' as const,
      message: `Package has ${bookingsCount} historical booking/payment records required for financial & audit compliance. Listing was archived and removed from the marketplace.`,
      package: updated,
    };
  }

  // Zero historical bookings:
  if (permanent) {
    await prisma.$transaction(async (tx) => {
      await tx.packageAvailability.deleteMany({ where: { packageId } });
      await tx.itineraryDay.deleteMany({ where: { packageId } });
      await tx.packageInclusion.deleteMany({ where: { packageId } });
      await tx.packageImage.deleteMany({ where: { packageId } });
      await tx.review.deleteMany({ where: { packageId } });
      await tx.package.delete({ where: { id: packageId } });
    });

    invalidatePackageCache(packageId, pkg.slug);

    await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: UserRole.ADMIN,
      action: 'PACKAGE_PERMANENT_DELETE',
      targetType: 'PACKAGE',
      targetId: packageId,
      reason: reason.trim(),
      metadata: { packageName: pkg.name, slug: pkg.slug },
      ipAddress,
      userAgent,
    });

    return {
      action: 'PERMANENTLY_DELETED' as const,
      message: 'Package had zero booking history and was permanently purged from the database.',
    };
  } else {
    // Soft delete / archive
    const updated = await prisma.package.update({
      where: { id: packageId },
      data: {
        status: ListingStatus.ARCHIVED,
        approvalStatus: ApprovalStatus.REJECTED,
        isActive: false,
        rejectionReason: `Archived by Admin: ${reason.trim()}`,
      },
    });

    invalidatePackageCache(packageId, pkg.slug);

    await recordAuditLog({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: UserRole.ADMIN,
      action: 'PACKAGE_ARCHIVE',
      targetType: 'PACKAGE',
      targetId: packageId,
      reason: reason.trim(),
      metadata: { packageName: pkg.name },
      ipAddress,
      userAgent,
    });

    return {
      action: 'ARCHIVED' as const,
      message: 'Package listing archived successfully.',
      package: updated,
    };
  }
}

/**
 * Admin action: Reactivate an archived or suspended listing.
 * Strictly verifies provider KYC status before restoring live status.
 */
export async function adminReactivatePackage(params: {
  adminUser: { id: string; email: string };
  packageId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, packageId, reason, ipAddress, userAgent } = params;

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: { provider: true },
  });

  if (!pkg) {
    throw new Error('Package not found.');
  }

  if (pkg.provider.verificationStatus !== VerificationStatus.VERIFIED || !pkg.provider.isActive) {
    throw new Error('Cannot reactivate listing: Service provider KYC verification is incomplete or provider is suspended.');
  }

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: {
      status: ListingStatus.PUBLISHED,
      approvalStatus: ApprovalStatus.APPROVED,
      isActive: true,
      rejectionReason: null,
    },
  });

  invalidatePackageCache(packageId, pkg.slug);

  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: UserRole.ADMIN,
    action: 'PACKAGE_REACTIVATE',
    targetType: 'PACKAGE',
    targetId: packageId,
    reason: reason || 'Listing reactivated by administrator',
    metadata: { packageName: pkg.name, providerId: pkg.providerId },
    ipAddress,
    userAgent,
  });

  return updated;
}

/**
 * Admin action: Update permitted listing fields (e.g. featured badge, pricing, tags, cancellation).
 */
export async function adminUpdatePackage(params: {
  adminUser: { id: string; email: string };
  packageId: string;
  data: {
    isFeatured?: boolean;
    basePrice?: number;
    discountPercent?: number;
    cancellationPolicy?: string;
    tags?: string[];
    highlights?: string[];
  };
  ipAddress?: string;
  userAgent?: string;
}) {
  const { adminUser, packageId, data, ipAddress, userAgent } = params;

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) throw new Error('Package not found.');

  const discountPercent = data.discountPercent !== undefined ? data.discountPercent : pkg.discountPercent;
  const basePrice = data.basePrice !== undefined ? data.basePrice : pkg.basePrice;
  const finalPrice = Math.round(basePrice * (1 - discountPercent / 100));

  const updated = await prisma.package.update({
    where: { id: packageId },
    data: {
      ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
      ...(data.basePrice !== undefined ? { basePrice: data.basePrice, finalPrice } : {}),
      ...(data.discountPercent !== undefined && data.basePrice === undefined
        ? { discountPercent: data.discountPercent, finalPrice }
        : {}),
      ...(data.cancellationPolicy !== undefined ? { cancellationPolicy: data.cancellationPolicy } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.highlights !== undefined ? { highlights: data.highlights } : {}),
    },
  });

  invalidatePackageCache(packageId, pkg.slug);

  await recordAuditLog({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    actorRole: UserRole.ADMIN,
    action: 'PACKAGE_UPDATE',
    targetType: 'PACKAGE',
    targetId: packageId,
    reason: 'Listing attributes updated by administrator',
    metadata: data,
    ipAddress,
    userAgent,
  });

  return updated;
}

