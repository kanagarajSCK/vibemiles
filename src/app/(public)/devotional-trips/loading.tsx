import React from 'react';

export default function DevotionalTripsLoading() {
  return (
    <div className="space-y-8 pb-12 sm:space-y-12 sm:pb-16 bg-slate-50 min-h-screen animate-pulse">
      {/* Hero Skeleton */}
      <section className="bg-slate-900 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="h-6 w-48 rounded-full bg-slate-800" />
          <div className="h-10 w-96 rounded-xl bg-slate-800" />
          <div className="h-5 w-full max-w-xl rounded-lg bg-slate-800" />
        </div>
      </section>

      {/* Content Skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="h-20 w-full rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-white border border-slate-200 p-4 space-y-4">
              <div className="h-48 rounded-xl bg-slate-200" />
              <div className="h-6 w-3/4 rounded-md bg-slate-200" />
              <div className="h-4 w-1/2 rounded-md bg-slate-200" />
              <div className="h-8 w-1/3 rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
