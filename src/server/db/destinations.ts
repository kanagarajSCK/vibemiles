import { prisma } from '@/lib/prisma';
import type { Destination } from '@/types';
import { mapPrismaDestinationToDomain } from './mappers';
import { handleDbError } from './errors';
import { MOCK_DESTINATIONS } from '@/lib/mock-data';

export interface GetDestinationsOptions {
  isPopular?: boolean;
  isTrending?: boolean;
  skip?: number;
  take?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
let destinationsCache: CacheEntry<Destination[]> | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function invalidateDestinationsCache() {
  destinationsCache = null;
}

/**
 * Retrieves all travel destinations, ordered alphabetically by name.
 * Uses a safe 60s in-memory cache for default listing queries.
 */
export async function getDestinations(options?: GetDestinationsOptions): Promise<Destination[]> {
  const isDefaultQuery = !options || Object.keys(options).length === 0;
  const now = Date.now();

  if (isDefaultQuery && destinationsCache && now - destinationsCache.timestamp < CACHE_TTL_MS) {
    return destinationsCache.data;
  }

  // If popular-only query and default cache exists, filter from cache
  if (options?.isPopular === true && !options.isTrending && !options.skip && !options.take) {
    if (destinationsCache && now - destinationsCache.timestamp < CACHE_TTL_MS) {
      return destinationsCache.data.filter((d) => d.isPopular);
    }
  }

  try {
    const where: { isPopular?: boolean; isTrending?: boolean } = {};
    if (options?.isPopular !== undefined) where.isPopular = options.isPopular;
    if (options?.isTrending !== undefined) where.isTrending = options.isTrending;

    const records = await prisma.destination.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: options?.skip,
      take: options?.take,
    });

    const result = records.map(mapPrismaDestinationToDomain);
    if (isDefaultQuery) {
      destinationsCache = { data: result, timestamp: now };
    }
    return result;
  } catch (error) {
    return handleDbError(error, 'getDestinations', () => {
      let list = [...MOCK_DESTINATIONS];
      if (options?.isPopular !== undefined) list = list.filter((d) => d.isPopular === options.isPopular);
      if (options?.isTrending !== undefined) list = list.filter((d) => d.isTrending === options.isTrending);
      if (options?.skip || options?.take) {
        const skip = options.skip || 0;
        const take = options.take ? skip + options.take : undefined;
        list = list.slice(skip, take);
      }
      return list;
    });
  }
}

/**
 * Retrieves a single destination by slug or ID.
 */
export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  try {
    const record = await prisma.destination.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug },
          { slug: { startsWith: `${slug}-` } },
          { name: { equals: slug, mode: 'insensitive' } },
        ],
      },
    });

    if (!record) return null;
    return mapPrismaDestinationToDomain(record);
  } catch (error) {
    return handleDbError(error, `getDestinationBySlug(${slug})`, () => {
      const found = MOCK_DESTINATIONS.find(
        (d) =>
          d.slug === slug ||
          d.id === slug ||
          d.slug.startsWith(`${slug}-`) ||
          d.name.toLowerCase() === slug.toLowerCase()
      );
      return found ?? null;
    });
  }
}

/**
 * Retrieves popular destinations for homepage and highlighted widgets.
 */
export async function getPopularDestinations(limit = 8): Promise<Destination[]> {
  try {
    const records = await prisma.destination.findMany({
      where: { isPopular: true },
      take: limit,
      orderBy: { rating: 'desc' },
    });

    return records.map(mapPrismaDestinationToDomain);
  } catch (error) {
    return handleDbError(error, 'getPopularDestinations', () => {
      return MOCK_DESTINATIONS.filter((d) => d.isPopular).slice(0, limit);
    });
  }
}

/**
 * Retrieves trending destinations.
 */
export async function getTrendingDestinations(limit = 8): Promise<Destination[]> {
  try {
    const records = await prisma.destination.findMany({
      where: { isTrending: true },
      take: limit,
      orderBy: { packageCount: 'desc' },
    });

    return records.map(mapPrismaDestinationToDomain);
  } catch (error) {
    return handleDbError(error, 'getTrendingDestinations', () => {
      return MOCK_DESTINATIONS.filter((d) => d.isTrending).slice(0, limit);
    });
  }
}
