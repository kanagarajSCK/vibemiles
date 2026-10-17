import React from 'react';

function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function WeatherSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex items-end gap-3">
          <Shimmer className="h-10 w-16" />
          <Shimmer className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5 text-center">
              <Shimmer className="h-3 w-full" />
              <Shimmer className="h-6 w-6 rounded-full mx-auto" />
              <Shimmer className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
      {/* Current */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Shimmer className="h-5 w-32" />
          <Shimmer className="h-14 w-24" />
          <Shimmer className="h-4 w-40" />
        </div>
        <Shimmer className="h-16 w-16 rounded-2xl" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Shimmer key={i} className="h-14 rounded-xl" />)}
      </div>
      {/* Forecast */}
      <div className="space-y-2">
        <Shimmer className="h-4 w-28" />
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {[...Array(7)].map((_, i) => <Shimmer key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}
