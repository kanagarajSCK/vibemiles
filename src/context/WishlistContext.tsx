'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { Package } from '@/types';

const WISHLIST_IDS_STORAGE_KEY = 'vibemiles_wishlist_ids';
const WISHLIST_PACKAGES_STORAGE_KEY = 'vibemiles_wishlist_packages';

export interface WishlistContextValue {
  wishlistIds: string[];
  wishlistCount: number;
  isWishlisted: (packageId: string) => boolean;
  toggleWishlist: (packageId: string, pkgDetails?: Package) => boolean;
  addToWishlist: (packageId: string, pkgDetails?: Package) => void;
  removeFromWishlist: (packageId: string) => void;
  savedPackages: Package[];
  clearWishlist: () => void;
  isLoaded: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [savedPackages, setSavedPackages] = useState<Package[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial hydration from localStorage
  useEffect(() => {
    try {
      const storedIds = localStorage.getItem(WISHLIST_IDS_STORAGE_KEY);
      if (storedIds) {
        const parsed = JSON.parse(storedIds);
        if (Array.isArray(parsed)) {
          setWishlistIds(parsed);
        }
      }

      const storedPkgs = localStorage.getItem(WISHLIST_PACKAGES_STORAGE_KEY);
      if (storedPkgs) {
        const parsedPkgs = JSON.parse(storedPkgs);
        if (Array.isArray(parsedPkgs)) {
          setSavedPackages(parsedPkgs);
        }
      }
    } catch {
      // Ignore localStorage read errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === WISHLIST_IDS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setWishlistIds(parsed);
        } catch {}
      }
      if (e.key === WISHLIST_PACKAGES_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setSavedPackages(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper to persist state to storage
  const persistState = useCallback((ids: string[], pkgs: Package[]) => {
    try {
      localStorage.setItem(WISHLIST_IDS_STORAGE_KEY, JSON.stringify(ids));
      localStorage.setItem(WISHLIST_PACKAGES_STORAGE_KEY, JSON.stringify(pkgs));
    } catch {}
  }, []);

  const isWishlisted = useCallback(
    (packageId: string) => {
      return wishlistIds.includes(packageId);
    },
    [wishlistIds]
  );

  const addToWishlist = useCallback(
    (packageId: string, pkgDetails?: Package) => {
      setWishlistIds((prevIds) => {
        if (prevIds.includes(packageId)) return prevIds;
        const nextIds = [...prevIds, packageId];

        setSavedPackages((prevPkgs) => {
          let nextPkgs = prevPkgs;
          if (pkgDetails && !prevPkgs.some((p) => p.id === packageId)) {
            nextPkgs = [pkgDetails, ...prevPkgs];
          }
          persistState(nextIds, nextPkgs);
          return nextPkgs;
        });

        return nextIds;
      });
    },
    [persistState]
  );

  const removeFromWishlist = useCallback(
    (packageId: string) => {
      setWishlistIds((prevIds) => {
        const nextIds = prevIds.filter((id) => id !== packageId);
        setSavedPackages((prevPkgs) => {
          const nextPkgs = prevPkgs.filter((p) => p.id !== packageId);
          persistState(nextIds, nextPkgs);
          return nextPkgs;
        });
        return nextIds;
      });
    },
    [persistState]
  );

  const toggleWishlist = useCallback(
    (packageId: string, pkgDetails?: Package) => {
      const currentlySaved = wishlistIds.includes(packageId);
      if (currentlySaved) {
        removeFromWishlist(packageId);
        return false;
      } else {
        addToWishlist(packageId, pkgDetails);
        return true;
      }
    },
    [wishlistIds, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(() => {
    setWishlistIds([]);
    setSavedPackages([]);
    try {
      localStorage.removeItem(WISHLIST_IDS_STORAGE_KEY);
      localStorage.removeItem(WISHLIST_PACKAGES_STORAGE_KEY);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      wishlistIds,
      wishlistCount: wishlistIds.length,
      isWishlisted,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      savedPackages,
      clearWishlist,
      isLoaded,
    }),
    [
      wishlistIds,
      isWishlisted,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      savedPackages,
      clearWishlist,
      isLoaded,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      wishlistIds: [],
      wishlistCount: 0,
      isWishlisted: () => false,
      toggleWishlist: () => false,
      addToWishlist: () => {},
      removeFromWishlist: () => {},
      savedPackages: [],
      clearWishlist: () => {},
      isLoaded: true,
    };
  }
  return ctx;
}
