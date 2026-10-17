// ============================================================
// WEATHER TYPES — Vibe Miles
// Powered by Open-Meteo (open-meteo.com)
// ============================================================

export type WeatherConditionCode = number;

/** WMO Weather Interpretation Codes → human-readable label & emoji */
export interface WeatherCondition {
  label: string;
  emoji: string;
  icon: string; // lucide icon name hint
}

export interface WeatherCurrent {
  temperatureC: number;
  feelsLikeC: number;
  conditionCode: WeatherConditionCode;
  condition: WeatherCondition;
  humidity: number;       // %
  windSpeedKmh: number;   // km/h
  uvIndex: number;
  isDay: boolean;
}

export interface WeatherDay {
  date: string;           // ISO date string YYYY-MM-DD
  dayLabel: string;       // 'Mon', 'Tue', etc.
  conditionCode: WeatherConditionCode;
  condition: WeatherCondition;
  maxTempC: number;
  minTempC: number;
  precipitationProbability: number; // %
  precipitationMm: number;
  uvIndexMax: number;
  windSpeedMaxKmh: number;
}

export interface WeatherForecast {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  timezone: string;
  current: WeatherCurrent;
  daily: WeatherDay[];    // 7 days
  fetchedAt: string;      // ISO timestamp
}

export type WeatherErrorCode =
  | 'GEOCODE_FAILED'
  | 'FORECAST_FAILED'
  | 'CITY_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface WeatherError {
  error: true;
  code: WeatherErrorCode;
  message: string;
}

export type WeatherResult = WeatherForecast | WeatherError;

export function isWeatherError(r: WeatherResult): r is WeatherError {
  return (r as WeatherError).error === true;
}
