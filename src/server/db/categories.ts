import { prisma } from '@/lib/prisma';
import { handleDbError } from './errors';
import { PACKAGE_CATEGORIES } from '@/constants';

export interface CategoryResult {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  isActive: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
let categoriesCache: CacheEntry<CategoryResult[]> | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function invalidateCategoriesCache() {
  categoriesCache = null;
}

/**
 * Retrieves all active categories from PostgreSQL or fallback.
 * Uses a safe 60s in-memory cache.
 */
export async function getCategories(): Promise<CategoryResult[]> {
  const now = Date.now();
  if (categoriesCache && now - categoriesCache.timestamp < CACHE_TTL_MS) {
    return categoriesCache.data;
  }

  try {
    const records = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const result = records.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      icon: c.icon,
      description: c.description,
      isActive: c.isActive,
    }));

    categoriesCache = { data: result, timestamp: now };
    return result;
  } catch (error) {
    return handleDbError(error, 'getCategories', () => {
      return PACKAGE_CATEGORIES.map((c, idx) => ({
        id: `cat-${idx + 1}`,
        slug: c.value,
        name: c.label,
        icon: c.icon,
        description: `Authentic ${c.label} across extraordinary Indian destinations.`,
        isActive: true,
      }));
    });
  }
}

/**
 * Retrieves a single category by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryResult | null> {
  try {
    const record = await prisma.category.findFirst({
      where: {
        OR: [{ slug: slug.toLowerCase() }, { id: slug }],
      },
    });

    if (!record) return null;
    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      icon: record.icon,
      description: record.description,
      isActive: record.isActive,
    };
  } catch (error) {
    return handleDbError(error, `getCategoryBySlug(${slug})`, () => {
      const found = PACKAGE_CATEGORIES.find((c) => c.value === slug.toLowerCase());
      if (!found) return null;
      return {
        id: `cat-${found.value}`,
        slug: found.value,
        name: found.label,
        icon: found.icon,
        description: `Authentic ${found.label} across extraordinary Indian destinations.`,
        isActive: true,
      };
    });
  }
}

export {
  getAdminCategories,
  createCategoryInDb,
  updateCategoryInDb,
  archiveOrDeleteCategoryInDb,
} from './admin';
