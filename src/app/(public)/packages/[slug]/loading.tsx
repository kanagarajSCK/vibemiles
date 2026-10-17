import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function PackageDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 py-5 pb-16 sm:space-y-8 sm:px-6 sm:py-8 sm:pb-20 lg:px-8">
      {/* Breadcrumbs & Header Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-96 max-w-full rounded-lg" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-20 rounded-full" />
          </div>
        </div>
      </div>

      {/* Image Gallery Grid Skeleton */}
      <div className="grid grid-cols-1 gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:grid-cols-3 sm:gap-3 sm:rounded-3xl">
        <div className="sm:col-span-2 aspect-16/10">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
          <div className="aspect-16/10">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
          <div className="aspect-16/10">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
        </div>
      </div>

      {/* Quick Highlights Bar Skeleton */}
      <div className="grid grid-cols-2 gap-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-4 sm:gap-4 sm:divide-y-0 sm:divide-x sm:p-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid (Left Details + Right Booking Widget) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-6 pl-6 border-l-2 border-slate-100">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Booking Widget */}
        <aside className="lg:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-6">
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-36" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </aside>
      </div>
    </div>
  );
}
