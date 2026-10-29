'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Compass, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { PackageCard } from '@/components/cards/PackageCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';
import type { Package } from '@/types';

export default function AccountWishlistPage() {
  const { wishlistIds, savedPackages, clearWishlist, isLoaded } = useWishlist();
  const [packages, setPackages] = useState<Package[]>(savedPackages);
  const [loading, setLoading] = useState(false);

  // Sync / fetch fresh data from database whenever wishlistIds change
  useEffect(() => {
    if (!isLoaded) return;

    if (wishlistIds.length === 0) {
      setPackages([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/api/packages?ids=${wishlistIds.map((id) => encodeURIComponent(id)).join(',')}&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.packages) && data.packages.length > 0) {
          setPackages(data.packages);
        } else {
          // If server query returns empty or failed (e.g. offline or newly saved), fallback to cached savedPackages
          setPackages((prev) => {
            const cachedMatches = savedPackages.filter((p) => wishlistIds.includes(p.id));
            return cachedMatches.length > 0 ? cachedMatches : prev.filter((p) => wishlistIds.includes(p.id));
          });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setPackages(savedPackages.filter((p) => wishlistIds.includes(p.id)));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [wishlistIds, isLoaded, savedPackages]);

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const count = wishlistIds.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span>Saved Wishlist</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your saved tour packages, stays, food trails, and adventure activities.
          </p>
        </div>

        {count > 0 && (
          <div className="flex items-center gap-2.5">
            <Badge variant="brand">
              {count} {count === 1 ? 'Saved Trip' : 'Saved Trips'}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearWishlist}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs px-2.5"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Grid or Empty State */}
      {count > 0 && packages.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              packageData={pkg}
              isWishlisted={true}
            />
          ))}
        </div>
      ) : count > 0 && loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500 shadow-xs">
            <Heart className="h-8 w-8 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Your Wishlist is Empty</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              You haven&apos;t saved any trips yet. Explore our marketplace, click the heart icon on any tour or stay, and save your favorites here.
            </p>
          </div>
          <div className="pt-2">
            <Link href={ROUTES.EXPLORE}>
              <Button
                variant="primary"
                size="md"
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 shadow-sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Marketplace
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
