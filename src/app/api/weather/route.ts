import { NextRequest, NextResponse } from 'next/server';
import { fetchWeather } from '@/services/weather.service';

export const runtime = 'nodejs';
export const revalidate = 1800; // 30 min

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city')?.trim();
  const state = searchParams.get('state')?.trim() ?? '';

  if (!city) {
    return NextResponse.json(
      { error: true, code: 'CITY_NOT_FOUND', message: 'city query parameter is required' },
      { status: 400 }
    );
  }

  const result = await fetchWeather(city, state);

  if ('error' in result && result.error) {
    const status = result.code === 'CITY_NOT_FOUND' ? 404 : 502;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
