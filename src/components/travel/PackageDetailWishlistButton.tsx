'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import type { Package } from '@/types';
import { cn } from '@/lib/utils';

export function PackageDetailWishlistButton({
  packageData,
}: {
  packageData: Package;
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(packageData.id);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleToggle = () => {
    const nextState = toggleWishlist(packageData.id, packageData);
    setToastMessage(nextState ? 'Saved to Wishlist' : 'Removed from Wishlist');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'relative flex items-center justify-center rounded-full border p-2.5 transition-all duration-200 active:scale-90',
          wishlisted
            ? 'border-rose-300 bg-rose-50 text-rose-500 hover:bg-rose-100 ring-2 ring-rose-400/30'
            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-rose-500'
        )}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        title={wishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-all duration-200',
            wishlisted ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-600 hover:text-rose-500'
          )}
        />
      </button>

      {toastMessage && (
        <div className="absolute right-0 top-full mt-2 z-50 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
