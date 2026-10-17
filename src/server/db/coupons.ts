import { prisma } from '@/lib/prisma';
import type { Coupon as PrismaCoupon } from '@prisma/client';
import { handleDbError } from './errors';
import { MOCK_COUPONS } from '@/lib/mock-data';
import type { Coupon } from '@/types';

function mapPrismaCouponToDomain(c: PrismaCoupon): Coupon {
  return {
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType.toLowerCase() as 'percentage' | 'fixed',
    discountValue: c.discountValue,
    minimumOrderAmount: c.minimumOrderAmount,
    maximumDiscountAmount: c.maximumDiscountAmount ?? undefined,
    usageLimit: c.usageLimit ?? 1000,
    usedCount: c.usedCount,
    isActive: c.isActive,
    expiresAt: c.expiresAt instanceof Date ? c.expiresAt.toISOString() : String(c.expiresAt),
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
  };
}

/**
 * Retrieves an active coupon by its code string.
 */
export async function getActiveCouponByCode(code: string): Promise<Coupon | null> {
  const normalizedCode = code.trim().toUpperCase();

  try {
    const record = await prisma.coupon.findFirst({
      where: {
        code: normalizedCode,
        isActive: true,
        expiresAt: { gte: new Date() },
      },
    });

    if (!record) return null;
    return mapPrismaCouponToDomain(record);
  } catch (error) {
    return handleDbError(error, `getActiveCouponByCode(${code})`, () => {
      const found = MOCK_COUPONS.find(
        (c) => c.code.toUpperCase() === normalizedCode && c.isActive
      );
      return found ?? null;
    });
  }
}

/**
 * Retrieves all available coupons.
 */
export async function getAllCoupons(): Promise<Coupon[]> {
  try {
    const records = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return records.map(mapPrismaCouponToDomain);
  } catch (error) {
    return handleDbError(error, 'getAllCoupons', () => {
      return MOCK_COUPONS;
    });
  }
}
