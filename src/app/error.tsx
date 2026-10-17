'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error on client console without exposing internals to UI
    console.error('Application Error caught by RootError boundary:', error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto max-w-md space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-600">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Service Temporarily Unavailable
          </h2>
          <p className="text-sm text-slate-600">
            We encountered an unexpected issue while loading travel catalog data. Please try refreshing or return to the homepage.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Try Again
          </Button>

          <Link href={ROUTES.HOME} className="w-full sm:w-auto">
            <Button variant="primary" className="w-full inline-flex items-center gap-2">
              <Home className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
