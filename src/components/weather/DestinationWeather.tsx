'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CloudSun } from 'lucide-react';
import type { WeatherForecast, WeatherError, WeatherErrorCode } from '@/types/weather';
import { WeatherCard } from './WeatherCard';
import { WeatherForecast as WeatherForecastComp } from './WeatherForecast';
import { WeatherSkeleton } from './WeatherSkeleton';
import { WeatherErrorState } from './WeatherErrorState';

interface DestinationWeatherProps {
  city: string;
  state: string;
  compact?: boolean;
}

export function DestinationWeather({ city, state, compact = false }: DestinationWeatherProps) {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [error, setError] = useState<WeatherError | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = useCallback(async () => {
    try {
      const params = new URLSearchParams({ city, state });
      const res = await fetch(`/api/weather?${params}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data as WeatherError);
      } else {
        setForecast(data as WeatherForecast);
        setError(null);
      }
    } catch {
      setError({ error: true, code: 'NETWORK_ERROR' as WeatherErrorCode, message: 'Failed to load weather' });
    } finally {
      setLoading(false);
    }
  }, [city, state]);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const params = new URLSearchParams({ city, state });
        const res = await fetch(`/api/weather?${params}`);
        const data = await res.json();
        if (!ignore) {
          if (!res.ok || data.error) {
            setError(data as WeatherError);
          } else {
            setForecast(data as WeatherForecast);
            setError(null);
          }
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          setError({ error: true, code: 'NETWORK_ERROR' as WeatherErrorCode, message: 'Failed to load weather' });
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, [city, state]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchWeather();
  }, [fetchWeather]);

  if (loading) return <WeatherSkeleton compact={compact} />;
  if (error || !forecast) return <WeatherErrorState code={error?.code} onRetry={handleRetry} compact={compact} />;

  if (compact) {
    return (
      <div className="space-y-3">
        <WeatherCard data={forecast} compact />
        <WeatherForecastComp days={forecast.daily} compact />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-0">
      {/* Section header */}
      <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center gap-2">
        <CloudSun className="w-5 h-5 text-teal-600" />
        <h2 className="text-lg font-bold text-slate-900">Current Weather &amp; Forecast</h2>
      </div>
      <div className="p-6 space-y-6">
        <WeatherCard data={forecast} />
        <WeatherForecastComp days={forecast.daily} />
      </div>
    </div>
  );
}
