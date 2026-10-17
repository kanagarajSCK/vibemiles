import React from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import type { WeatherErrorCode } from '@/types/weather';

const MESSAGES: Record<WeatherErrorCode, { title: string; desc: string }> = {
  CITY_NOT_FOUND: { title: 'Location not found', desc: 'We could not find weather data for this destination.' },
  GEOCODE_FAILED: { title: 'Location unavailable', desc: 'Unable to resolve destination coordinates.' },
  FORECAST_FAILED: { title: 'Forecast unavailable', desc: 'Weather data could not be fetched right now.' },
  NETWORK_ERROR:   { title: 'Service unavailable', desc: 'Weather service is temporarily unavailable. Please try again.' },
  UNKNOWN:         { title: 'Something went wrong', desc: 'Unable to load weather information.' },
};

interface WeatherErrorStateProps {
  code?: WeatherErrorCode;
  onRetry?: () => void;
  compact?: boolean;
}

export function WeatherErrorState({ code = 'UNKNOWN', onRetry, compact = false }: WeatherErrorStateProps) {
  const msg = MESSAGES[code];

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <CloudOff className="w-4 h-4 text-slate-400 shrink-0" />
        <span>{msg.title}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <CloudOff className="w-7 h-7 text-slate-400" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-slate-800">{msg.title}</p>
        <p className="text-sm text-slate-500">{msg.desc}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}
