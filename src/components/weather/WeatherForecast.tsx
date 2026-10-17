import React from 'react';
import { Droplets } from 'lucide-react';
import type { WeatherDay } from '@/types/weather';

interface WeatherForecastProps {
  days: WeatherDay[];
  compact?: boolean;
}

function ForecastDay({ day, compact }: { day: WeatherDay; compact?: boolean }) {
  const isToday = day.dayLabel === new Date().toLocaleDateString('en-IN', { weekday: 'short' });

  if (compact) {
    return (
      <div className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center min-w-[60px] border ${isToday ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-100'}`}>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${isToday ? 'text-teal-700' : 'text-slate-400'}`}>
          {isToday ? 'Today' : day.dayLabel}
        </span>
        <span className="text-xl" aria-hidden="true">{day.condition.emoji}</span>
        <span className="text-xs font-bold text-slate-800">{day.maxTempC}°</span>
        <span className="text-[9px] text-slate-400">{day.minTempC}°</span>
        {day.precipitationProbability > 20 && (
          <span className="flex items-center gap-0.5 text-[9px] text-sky-600 font-medium">
            <Droplets className="w-2.5 h-2.5" />{day.precipitationProbability}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center border transition-all hover:shadow-sm ${isToday ? 'bg-teal-50 border-teal-200 shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-teal-200'}`}>
      <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-teal-700' : 'text-slate-500'}`}>
        {isToday ? 'Today' : day.dayLabel}
      </span>
      <span className="text-3xl my-0.5" aria-hidden="true">{day.condition.emoji}</span>
      <span className="text-sm font-extrabold text-slate-900">{day.maxTempC}°</span>
      <span className="text-xs text-slate-400">{day.minTempC}°</span>
      {day.precipitationProbability > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] text-sky-600 font-semibold mt-0.5">
          <Droplets className="w-3 h-3" />{day.precipitationProbability}%
        </span>
      )}
    </div>
  );
}

export function WeatherForecast({ days, compact = false }: WeatherForecastProps) {
  const show = days.slice(0, compact ? 5 : 7);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className={`font-bold text-slate-800 ${compact ? 'text-xs uppercase tracking-wider text-slate-500' : 'text-sm'}`}>
          {compact ? '5-Day Forecast' : `${show.length}-Day Forecast`}
        </p>
        {!compact && (
          <p className="text-xs text-slate-400">Source: Open-Meteo</p>
        )}
      </div>
      <div className={`grid gap-2 ${compact ? 'grid-cols-5' : 'grid-cols-4 sm:grid-cols-7'}`}>
        {show.map((day) => (
          <ForecastDay key={day.date} day={day} compact={compact} />
        ))}
      </div>
    </div>
  );
}
