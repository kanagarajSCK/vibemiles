// ============================================================
// WEATHER SERVICE — Open-Meteo (free, no API key required)
// https://open-meteo.com | https://geocoding-api.open-meteo.com
// ============================================================

import type { WeatherForecast, WeatherError, WeatherResult, WeatherCondition } from '@/types/weather';

const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';

// ── WMO Weather Code → condition map ─────────────────────────
function wmoCondition(code: number, isDay: boolean): WeatherCondition {
  if (code === 0) return { label: 'Clear Sky', emoji: isDay ? '☀️' : '🌙', icon: 'sun' };
  if (code === 1) return { label: 'Mainly Clear', emoji: isDay ? '🌤️' : '🌙', icon: 'sun' };
  if (code === 2) return { label: 'Partly Cloudy', emoji: '⛅', icon: 'cloud-sun' };
  if (code === 3) return { label: 'Overcast', emoji: '☁️', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Foggy', emoji: '🌫️', icon: 'cloud-fog' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', emoji: '🌦️', icon: 'cloud-drizzle' };
  if (code >= 61 && code <= 67) return { label: 'Rain', emoji: '🌧️', icon: 'cloud-rain' };
  if (code >= 71 && code <= 77) return { label: 'Snow', emoji: '❄️', icon: 'cloud-snow' };
  if (code >= 80 && code <= 82) return { label: 'Rain Showers', emoji: '🌦️', icon: 'cloud-rain' };
  if (code === 85 || code === 86) return { label: 'Snow Showers', emoji: '🌨️', icon: 'cloud-snow' };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', emoji: '⛈️', icon: 'cloud-lightning' };
  return { label: 'Unknown', emoji: '🌡️', icon: 'thermometer' };
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

// ── Geocode city + state ──────────────────────────────────────
async function geocode(city: string, state: string): Promise<{ lat: number; lon: number; timezone: string } | null> {
  const url = `${GEO_BASE}?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;
  const res = await fetch(url, { next: { revalidate: 86400 } }); // 24h cache
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.results?.length) return null;

  // Prefer result in the same state (country = India)
  const match =
    data.results.find((r: { admin1?: string; country_code?: string; latitude: number; longitude: number; timezone: string }) =>
      r.country_code === 'IN' && r.admin1?.toLowerCase().includes(state.toLowerCase().slice(0, 5))
    ) || data.results.find((r: { country_code?: string; latitude: number; longitude: number; timezone: string }) => r.country_code === 'IN') || data.results[0];

  return { lat: match.latitude, lon: match.longitude, timezone: match.timezone };
}

// ── Main weather fetch ────────────────────────────────────────
export async function fetchWeather(city: string, state: string): Promise<WeatherResult> {
  try {
    const geo = await geocode(city, state);
    if (!geo) {
      return { error: true, code: 'CITY_NOT_FOUND', message: `Could not locate "${city}, ${state}"` } satisfies WeatherError;
    }

    const params = new URLSearchParams({
      latitude: geo.lat.toString(),
      longitude: geo.lon.toString(),
      current: [
        'temperature_2m',
        'apparent_temperature',
        'relative_humidity_2m',
        'wind_speed_10m',
        'uv_index',
        'weather_code',
        'is_day',
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
        'precipitation_sum',
        'uv_index_max',
        'wind_speed_10m_max',
      ].join(','),
      timezone: geo.timezone,
      forecast_days: '7',
      wind_speed_unit: 'kmh',
    });

    const res = await fetch(`${WEATHER_BASE}?${params}`, { next: { revalidate: 1800 } }); // 30min cache
    if (!res.ok) {
      return { error: true, code: 'FORECAST_FAILED', message: 'Failed to fetch forecast data' } satisfies WeatherError;
    }

    const d = await res.json();
    const c = d.current;
    const isDay = c.is_day === 1;

    const current = {
      temperatureC: Math.round(c.temperature_2m),
      feelsLikeC: Math.round(c.apparent_temperature),
      conditionCode: c.weather_code,
      condition: wmoCondition(c.weather_code, isDay),
      humidity: Math.round(c.relative_humidity_2m),
      windSpeedKmh: Math.round(c.wind_speed_10m),
      uvIndex: Math.round(c.uv_index ?? 0),
      isDay,
    };

    const daily = (d.daily.time as string[]).map((date: string, i: number) => ({
      date,
      dayLabel: dayLabel(date),
      conditionCode: d.daily.weather_code[i],
      condition: wmoCondition(d.daily.weather_code[i], true),
      maxTempC: Math.round(d.daily.temperature_2m_max[i]),
      minTempC: Math.round(d.daily.temperature_2m_min[i]),
      precipitationProbability: Math.round(d.daily.precipitation_probability_max[i] ?? 0),
      precipitationMm: parseFloat((d.daily.precipitation_sum[i] ?? 0).toFixed(1)),
      uvIndexMax: Math.round(d.daily.uv_index_max[i] ?? 0),
      windSpeedMaxKmh: Math.round(d.daily.wind_speed_10m_max[i] ?? 0),
    }));

    return {
      city,
      state,
      latitude: geo.lat,
      longitude: geo.lon,
      timezone: geo.timezone,
      current,
      daily,
      fetchedAt: new Date().toISOString(),
    } satisfies WeatherForecast;
  } catch {
    return { error: true, code: 'NETWORK_ERROR', message: 'Weather service unavailable' } satisfies WeatherError;
  }
}
