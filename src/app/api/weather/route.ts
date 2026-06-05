import { NextRequest, NextResponse } from 'next/server';
import { findDistrict } from '@/lib/weather';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/weather?lat=22.3193&lng=114.1694
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '22.3193');
    const lng = parseFloat(searchParams.get('lng') || '114.1694');

    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?' +
      `latitude=${lat}&longitude=${lng}&` +
      'current=temperature_2m,relative_humidity_2m,apparent_temperature,weathercode,' +
      'wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,uv_index&' +
      'hourly=temperature_2m,precipitation_probability,weathercode,wind_speed_10m,' +
      'relative_humidity_2m,uv_index,apparent_temperature&' +
      'daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,' +
      'wind_speed_10m_max,wind_direction_10m_dominant,uv_index_max,sunrise,sunset&' +
      'timezone=Asia/Shanghai&forecast_days=7',
      { next: { revalidate: 0 } }
    );

    if (!res.ok) {
      throw new Error(`Open-Meteo returned ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};

    const district = findDistrict(lat, lng);
    const now = new Date();
    const currentHour = now.getHours();

    // Build next 3 hours rain probability
    const next3Hours: { time: string; prob: number }[] = [];
    const hourlyTimes: string[] = hourly.time || [];
    for (let i = 0; i < hourlyTimes.length; i++) {
      const h = new Date(hourlyTimes[i]).getHours();
      if (h >= currentHour && h < currentHour + 3 && next3Hours.length < 3) {
        next3Hours.push({
          time: `${h.toString().padStart(2, '0')}:00`,
          prob: (hourly.precipitation_probability?.[i] as number) || 0,
        });
      }
    }

    // Build hourly forecast for today + tomorrow
    const hourlyForecast: Record<string, unknown>[] = [];
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    for (let i = 0; i < (hourlyTimes?.length || 0); i++) {
      const t = hourlyTimes[i];
      if (t.startsWith(today) || t.startsWith(tomorrow)) {
        const h = new Date(t).getHours();
        hourlyForecast.push({
          time: `${h.toString().padStart(2, '0')}:00`,
          date: t.split('T')[0],
          temp: hourly.temperature_2m?.[i],
          feelsLike: hourly.apparent_temperature?.[i],
          rainProb: hourly.precipitation_probability?.[i],
          weatherCode: hourly.weathercode?.[i],
          windSpeed: hourly.wind_speed_10m?.[i],
          humidity: hourly.relative_humidity_2m?.[i],
          uvIndex: hourly.uv_index?.[i],
        });
      }
    }

    // Build daily forecast
    const dailyForecast: Record<string, unknown>[] = [];
    for (let i = 0; i < (daily.time?.length || 0); i++) {
      dailyForecast.push({
        date: daily.time[i],
        tempMax: daily.temperature_2m_max[i],
        tempMin: daily.temperature_2m_min[i],
        weatherCode: daily.weathercode[i],
        rainProb: daily.precipitation_probability_max[i],
        windSpeed: daily.wind_speed_10m_max[i],
        windDir: daily.wind_direction_10m_dominant[i],
        uvIndex: daily.uv_index_max[i],
        sunrise: daily.sunrise[i],
        sunset: daily.sunset[i],
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        location: {
          district,
          lat,
          lng,
          elevation: data.elevation,
        },
        current: {
          temperature: current.temperature_2m,
          feelsLike: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          weatherCode: current.weathercode,
          windSpeed: current.wind_speed_10m,
          windGusts: current.wind_gusts_10m,
          windDirection: current.wind_direction_10m,
          pressure: current.pressure_msl,
          cloudCover: current.cloud_cover,
          uvIndex: current.uv_index,
          updateTime: current.time,
        },
        next3Hours,
        hourly: hourlyForecast,
        daily: dailyForecast,
        source: 'Open-Meteo',
      },
    });
  } catch (error) {
    console.error('获取天气失败:', error);
    return NextResponse.json(
      { success: false, error: '获取天气数据失败' },
      { status: 500 }
    );
  }
}
