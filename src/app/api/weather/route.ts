import { NextRequest, NextResponse } from 'next/server';
import { findDistrict, getHkoWeatherIcon, psrToPercent } from '@/lib/weather';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/weather?lat=22.3193&lng=114.1694
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '22.3193');
    const lng = parseFloat(searchParams.get('lng') || '114.1694');

    // Fetch main HKO weather data
    const [hkoRes, radarRes] = await Promise.all([
      fetch('https://www.hko.gov.hk/wxinfo/json/one_json.xml', {
        next: { revalidate: 0 },
        headers: { 'Accept': 'application/json' },
      }),
      fetch('https://www.hko.gov.hk/wxinfo/radars/nradar_img.json', {
        next: { revalidate: 0 },
        headers: { 'Accept': 'application/json' },
      }).catch(() => null),
    ]);

    if (!hkoRes.ok) {
      throw new Error('HKO API returned ' + hkoRes.status);
    }

    const hkoData = await hkoRes.json();
    let radarData = null;
    if (radarRes && radarRes.ok) {
      radarData = await radarRes.json();
    }

    const hko = hkoData.hko || {};
    const currwx = hkoData.currwx || {};
    const f9d = hkoData.F9D || {};
    const fuv = hkoData.FUV || {};
    const flw = hkoData.FLW || {};
    const cmn = hkoData.CMN || {};
    const forecastDays = f9d.WeatherForecast || [];

    const currentTemp = parseFloat(currwx.temp || hko.Temperature || '0');
    const currentHumidity = parseFloat(currwx.rh || hko.RH || '0');
    const bulletinTime = hko.BulletinTime || currwx.btime || '';
    const updateTime = bulletinTime.length >= 12
      ? bulletinTime.substring(0,4) + '-' + bulletinTime.substring(4,6) + '-' + bulletinTime.substring(6,8) + 'T' + bulletinTime.substring(8,10) + ':' + bulletinTime.substring(10,12) + ':00'
      : new Date().toISOString();

    // Get weather code from HKO icon
    const todayIcon = forecastDays[0]?.ForecastIcon || '';
    const weatherCode = getHkoWeatherIcon(todayIcon);

    // Rain probability from PSR
    const psrRating = forecastDays[0]?.PSR || 'Low';
    const psrProb = psrToPercent(psrRating);
    const currentHour = new Date().getHours();
    const next3Hours = [];
    for (let i = 0; i < 3; i++) {
      const h = (currentHour + i) % 24;
      next3Hours.push({
        time: h.toString().padStart(2, '0') + ':00',
        prob: psrProb,
      });
    }

    // Extract wind from text
    const windSpeed = extractWindSpeed(forecastDays[0]?.ForecastWind || '');
    const windDirection = extractWindDirection(forecastDays[0]?.ForecastWind || '');

    // Build daily forecast
    const dailyForecast = forecastDays.slice(0, 7).map((day: any) => ({
      date: day.ForecastDate,
      tempMax: parseFloat(day.ForecastMaxtemp),
      tempMin: parseFloat(day.ForecastMintemp),
      weatherCode: getHkoWeatherIcon(day.ForecastIcon),
      weatherIcon: day.ForecastIcon,
      weatherDesc: day.IconDesc,
      rainProb: psrToPercent(day.PSR),
      psrRating: day.PSR,
      wind: day.ForecastWind,
      humidity: {
        max: parseFloat(day.ForecastMaxrh),
        min: parseFloat(day.ForecastMinrh),
      },
      weatherText: day.ForecastWeather,
    }));

    const district = findDistrict(lat, lng);

    // Build radar image URLs
    const radarImages = [];
    if (radarData?.radar?.range0?.image) {
      const images = radarData.radar.range0.image;
      const lastEntry = images[images.length - 1] || '';
      const match = lastEntry.match(/"([^"]+)"/);
      if (match) {
        radarImages.push('https://www.hko.gov.hk/wxinfo/radars/' + match[1]);
      }
      // Also get a few more recent frames
      for (let i = Math.max(0, images.length - 5); i < images.length; i++) {
        const m = images[i].match(/"([^"]+)"/);
        if (m) {
          radarImages.push('https://www.hko.gov.hk/wxinfo/radars/' + m[1]);
        }
      }
    }

    // Lightning info
    const lightningInfo = (hkoData.lightning_info || []).map((l: any) => ({
      date: l.date,
      time: l.time,
      color: l.color,
    }));

    // UV index
    const uvIndex = parseFloat(fuv.ForecastTimeInfoMaxUV || '0');

    // Build hourly forecast from daily data
    const hourlyForecast: Record<string, unknown>[] = [];
    if (forecastDays.length > 0) {
      const today = forecastDays[0];
      const todayDate = today.ForecastDate;
      const maxTemp = parseFloat(today.ForecastMaxtemp);
      const minTemp = parseFloat(today.ForecastMintemp);
      const maxRh = parseFloat(today.ForecastMaxrh);
      const minRh = parseFloat(today.ForecastMinrh);

      for (let h = 0; h < 24; h++) {
        let temp: number;
        if (h >= 6 && h <= 18) {
          const progress = (h - 6) / 12;
          temp = minTemp + (maxTemp - minTemp) * (0.5 + 0.5 * Math.sin(progress * Math.PI));
        } else if (h < 6) {
          temp = minTemp + (maxTemp - minTemp) * 0.2 * (h / 6);
        } else {
          temp = minTemp + (maxTemp - minTemp) * 0.2 * ((24 - h) / 6);
        }

        const humProgress = Math.sin(((h - 6) / 12) * Math.PI);
        const humidity = h >= 6 && h <= 18
          ? Math.round(maxRh - (maxRh - minRh) * (0.5 + 0.5 * humProgress))
          : maxRh;

        hourlyForecast.push({
          time: h.toString().padStart(2, '0') + ':00',
          date: todayDate,
          temp: Math.round(temp * 10) / 10,
          feelsLike: Math.round(temp * 10) / 10,
          rainProb: psrProb,
          weatherCode: getHkoWeatherIcon(today.ForecastIcon),
          windSpeed: windSpeed,
          humidity: humidity,
          uvIndex: h >= 8 && h <= 16 ? uvIndex : 0,
        });
      }
    }

    // Sunrise/sunset
    const sunrise = cmn.sunriseTime || '';
    const sunset = cmn.sunsetTime || '';

    return NextResponse.json({
      success: true,
      data: {
        location: {
          district,
          lat,
          lng,
        },
        current: {
          temperature: currentTemp,
          feelsLike: currentTemp,
          humidity: currentHumidity,
          weatherCode,
          windSpeed,
          windDirection,
          pressure: 1013,
          cloudCover: currentHumidity > 80 ? 80 : currentHumidity > 60 ? 60 : 40,
          uvIndex,
          updateTime,
        },
        next3Hours,
        hourly: hourlyForecast,
        daily: dailyForecast,
        forecast: {
          generalSituation: flw.GeneralSituation || '',
          forecastDesc: flw.ForecastDesc || '',
          forecastPeriod: flw.ForecastPeriod || '',
          outlook: flw.OutlookContent || '',
          tcInfo: flw.TCInfo || null,
        },
        lightning: lightningInfo,
        radar: {
          images: radarImages,
          baseUrl: 'https://www.hko.gov.hk/wxinfo/radars/',
        },
        source: '香港天文台',
      },
    });
  } catch (error) {
    console.error('获取天气失败:', error);
    return NextResponse.json(
      { success: false, error: '获取天气数据失败，请稍后重试' },
      { status: 500 }
    );
  }
}

function extractWindSpeed(windText: string): number {
  const match = windText.match(/force\s*(\d+)/i);
  if (match) {
    return parseInt(match[1]) * 10;
  }
  return 15;
}

function extractWindDirection(windText: string): number {
  const dirMap: Record<string, number> = {
    north: 0, n: 0,
    northeast: 45, ne: 45,
    east: 90, e: 90,
    southeast: 135, se: 135,
    south: 180, s: 180,
    southwest: 225, sw: 225,
    west: 270, w: 270,
    northwest: 315, nw: 315,
  };
  const lower = windText.toLowerCase();
  for (const [key, deg] of Object.entries(dirMap)) {
    if (lower.includes(key)) return deg;
  }
  return 0;
}
