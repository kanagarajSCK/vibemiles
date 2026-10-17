import React from 'react';
import { Droplets, Wind, Thermometer, Eye, MapPin } from 'lucide-react';
import type { WeatherForecast } from '@/types/weather';

interface WeatherCardProps {
  data: WeatherForecast;
  compact?: boolean;
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
      <div className="text-teal-600">{icon}</div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}

export function WeatherCard({ data, compact = false }: WeatherCardProps) {
  const { current, daily, city, state } = data;
  const today = daily[0];

  if (compact) {
    return (
      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-sky-50 to-teal-50 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <MapPin className="w-3 h-3 text-teal-600" />
            <span>{city}, {state}</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Live Weather</span>
        </div>

        {/* Current temp + condition */}
        <div className="flex items-center justify-between">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-slate-900 leading-none">{current.temperatureC}°</span>
            <div className="pb-1 text-sm">
              <p className="font-semibold text-slate-700">{current.condition.label}</p>
              <p className="text-xs text-slate-400">Feels like {current.feelsLikeC}°C</p>
            </div>
          </div>
          <span className="text-4xl" aria-hidden="true">{current.condition.emoji}</span>
        </div>

        {/* Hi/Lo + rain */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span>↑ {today.maxTempC}° ↓ {today.minTempC}°</span>
          {today.precipitationProbability > 0 && (
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-sky-500" />
              {today.precipitationProbability}% rain
            </span>
          )}
          <span className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-slate-400" />
            {current.windSpeedKmh} km/h
          </span>
        </div>

        {/* Disclaimer */}
        <p className="text-[9px] text-slate-400 leading-relaxed border-t border-slate-200/80 pt-2">
          ⚠️ Weather forecasts are estimates and may change. Check closer to your travel date.
        </p>
      </div>
    );
  }

  // Full card
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-teal-900 via-sky-900 to-slate-900 px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-300">
              <MapPin className="w-3.5 h-3.5" />
              <span>{city}, {state}</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-6xl font-extrabold leading-none tracking-tight">{current.temperatureC}°C</span>
              <div className="pb-1">
                <p className="text-lg font-semibold text-white">{current.condition.label}</p>
                <p className="text-sm text-slate-300">Feels like {current.feelsLikeC}°C</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 font-medium">
              ↑ {today.maxTempC}° &nbsp;↓ {today.minTempC}° &nbsp;·&nbsp; {today.precipitationProbability}% chance of rain
            </p>
          </div>
          <span className="text-7xl drop-shadow-lg" aria-hidden="true">{current.condition.emoji}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill
            icon={<Droplets className="w-4 h-4" />}
            label="Humidity"
            value={`${current.humidity}%`}
          />
          <StatPill
            icon={<Wind className="w-4 h-4" />}
            label="Wind"
            value={`${current.windSpeedKmh} km/h`}
          />
          <StatPill
            icon={<Eye className="w-4 h-4" />}
            label="UV Index"
            value={current.uvIndex.toString()}
          />
          <StatPill
            icon={<Thermometer className="w-4 h-4" />}
            label="Rain %"
            value={`${today.precipitationProbability}%`}
          />
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-start gap-2">
          <span className="text-amber-500 text-base shrink-0 mt-0.5">⚠️</span>
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Forecast disclaimer:</strong> These are estimated conditions and may change. Always verify weather closer to your travel date. Dates shown reflect forecast windows, not guaranteed travel conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
