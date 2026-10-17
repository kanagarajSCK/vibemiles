import { MOCK_COUPONS } from '@/lib/mock-data';
import { Coupon } from '@/types';
import { sleep } from '@/lib/utils';

class CouponService {
  async getCoupons(): Promise<Coupon[]> {
    await sleep(200);
    return MOCK_COUPONS;
  }

  async validateCoupon(code: string, orderAmount: number): Promise<Coupon | null> {
    await sleep(300);
    const coupon = MOCK_COUPONS.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!coupon) return null;
    if (orderAmount < coupon.minimumOrderAmount) return null;
    return coupon;
  }
}

export const couponService = new CouponService();
