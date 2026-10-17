'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';

/**
 * PartnerLandingHeader
 *
 * Used exclusively on public-facing Partner/Provider entry-point pages:
 *   - /provider  (Partner Landing Page)
 *
 * Does NOT include customer marketplace navigation (Home, Destinations,
 * Packages, Stays, Wishlist, Sign In, etc.). Those belong to PublicHeader.
 *
 * Authenticated provider dashboard uses ProviderHeader (inside layout.tsx).
 */
export const PartnerLandingHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/40 bg-emerald-950 shadow-md">
      <div className="mx-auto flex h-16 w-full max-w-[1700px] items-center justify-end gap-4 px-4 sm:px-6 lg:px-8">

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Back to Marketplace — subtle text link */}
          <Link
            href={ROUTES.HOME}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-400/80 hover:text-emerald-300 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Marketplace
          </Link>

          <div className="hidden sm:block h-4 w-px bg-emerald-800" />

          {/* Already a Partner — primary CTA */}
          <Link href={ROUTES.PARTNER_LOGIN}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Building2 className="w-3.5 h-3.5 text-emerald-400" />}
              className="border-emerald-700 text-emerald-300 hover:bg-emerald-900 hover:text-emerald-200 whitespace-nowrap text-xs px-3 h-8"
            >
              Partner Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
