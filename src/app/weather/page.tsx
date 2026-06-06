'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { WMO_CODES, WMO_ICONS, getWindDirection, getUVLevel } from '@/lib/weather';
import { getHkoIconEmoji, getHkoWeatherDesc } from '@/lib/weather';
import WeatherRadar from '@/components/WeatherRadar';

interface HourlyItem {
  time: string;
  date: string;
  temp: number;
  feelsLike: number;
  rainProb: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  uvIndex: number;
}

interface DailyItem {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  weatherIcon: string;
  weatherDesc: string;
  weatherText: string;
  rainProb: number;
  psrRating: string;
  wind: string;
  humidity: { max: number; min: number };
}

interface WeatherData {
  location: { district: string; lat: number; lng: number };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    cloudCover: number;
    uvIndex: number;
    updateTime: string;
  };
  next3Hours: { time: string; prob: number }[];
  hourly: HourlyItem[];
  daily: DailyItem[];
  forecast: {
    generalSituation: string;
    forecastDesc: string;
    forecastPeriod: string;
    outlook: string;
    tcInfo: string | null;
  };
  lightning: { date: string; time: string; color: string }[];
  radar: { images: string[]; baseUrl: string };
  source: string;
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const fetchWeather = useCallback(async (lat?: number, lng?: number) => {
    try {
      const params = new URLSearchParams();
      if (lat !== undefined && lng !== undefined) {
        params.set('lat', String(lat));
        params.set('lng', String(lng));
      }
      const res = await fetch('/api/weather?' + params.toString());
      const json = await res.json();
      if (json.success) {
        setWeather(json.data);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => fetchWeather(),
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      fetchWeather();
    }
  }, [fetchWeather]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWeather(userLat ?? undefined, userLng ?? undefined);
  };

  const formatTime = (iso: string) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const getDayName = (dateStr: string) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const d = new Date(dateStr.substring(0,4) + '-' + dateStr.substring(4,6) + '-' + dateStr.substring(6,8));
    const today = new Date();
    const todayStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    const tomorrow = new Date(today.getTime() + 86400000);
    const tomorrowStr = tomorrow.getFullYear().toString() +
      (tomorrow.getMonth() + 1).toString().padStart(2, '0') +
      tomorrow.getDate().toString().padStart(2, '0');
    if (dateStr === todayStr) return '今天';
    if (dateStr === tomorrowStr) return '明天';
    return days[d.getDay()];
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">天气数据暂不可用</p>
          <button onClick={handleRefresh} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm min-h-[44px]">
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const { current, location, next3Hours, hourly, daily, forecast, lightning, source } = weather;
  const todayHourly = hourly.filter((h) => h.date === (daily[0]?.date || ''));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">香港天气</h1>
          <p className="text-sm text-gray-500 mt-0.5">{location.district} · 📡 {source}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <svg className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
          <Link
            href="/"
            className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </Link>
        </div>
      </div>

      {/* Current Weather Card */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">{location.district}</p>
            <p className="text-5xl sm:text-6xl font-bold mt-2">
              {current.temperature !== undefined ? Math.round(current.temperature) + '°' : '--'}
            </p>
            <p className="text-blue-100 text-lg mt-1">
              {WMO_ICONS[current.weatherCode]} {WMO_CODES[current.weatherCode] || ''}
            </p>
            <p className="text-blue-200 text-sm mt-1">体感 {Math.round(current.feelsLike)}°C</p>
          </div>
          <div className="text-6xl sm:text-7xl">
            {WMO_ICONS[current.weatherCode]}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/15 rounded-xl px-3 py-2.5 backdrop-blur">
            <p className="text-blue-200 text-xs">湿度</p>
            <p className="font-semibold text-lg">{current.humidity}%</p>
          </div>
          <div className="bg-white/15 rounded-xl px-3 py-2.5 backdrop-blur">
            <p className="text-blue-200 text-xs">風速</p>
            <p className="font-semibold text-lg">{current.windSpeed} km/h</p>
          </div>
          <div className="bg-white/15 rounded-xl px-3 py-2.5 backdrop-blur">
            <p className="text-blue-200 text-xs">紫外线</p>
            <p className="font-semibold text-lg">{current.uvIndex.toFixed(1)}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-3 py-2.5 backdrop-blur">
            <p className="text-blue-200 text-xs">更新</p>
            <p className="font-semibold text-lg">{formatTime(current.updateTime)}</p>
          </div>
        </div>
      </div>

      {/* Next 3 Hours Rain Probability */}
      {next3Hours && next3Hours.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">近3小时降雨概率</h2>
          <div className="flex gap-4 justify-around">
            {next3Hours.map((h, i) => (
              <div key={i} className="text-center">
                <p className="text-sm text-gray-400">{h.time}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: h.prob > 50 ? '#f59e0b' : h.prob > 30 ? '#3b82f6' : '#6b7280' }}>
                  {h.prob}%
                </p>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2 w-20 mx-auto">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: h.prob + '%',
                      backgroundColor: h.prob > 70 ? '#ef4444' : h.prob > 50 ? '#f59e0b' : h.prob > 30 ? '#3b82f6' : '#9ca3af'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9-Day Forecast */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">9日天气预测</h2>
        <div className="space-y-1">
          {daily.map((d, i) => (
            <div
              key={i}
              className={'flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 rounded-xl transition-colors cursor-pointer ' +
                (activeDay === i ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50')}
              onClick={() => setActiveDay(i)}
            >
              <div className="w-10 sm:w-12 text-xs sm:text-sm font-medium text-gray-700">
                {getDayName(d.date)}
              </div>
              <div className="text-xl sm:text-2xl w-8 sm:w-10 text-center">
                {getHkoIconEmoji(d.weatherIcon)}
              </div>
              <div className="hidden sm:block flex-1 text-xs sm:text-sm text-gray-500 truncate">
                {d.weatherDesc || ''}
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-gray-800">{Math.round(d.tempMax)}°</span>
                <span className="text-gray-400 mx-0.5">/</span>
                <span className="text-gray-400">{Math.round(d.tempMin)}°</span>
              </div>
              <div className="w-10 sm:w-14 text-right text-xs sm:text-sm text-blue-500">{d.rainProb}%</div>
            </div>
          ))}
        </div>

        {daily[activeDay] && (
          <div className="mt-3 p-3 sm:p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-700 font-medium mb-2">
              {getHkoIconEmoji(daily[activeDay].weatherIcon)} {getDayName(daily[activeDay].date)} 天气
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">{daily[activeDay].weatherText}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div>
                <p className="text-gray-500 text-xs">温度范围</p>
                <p className="font-semibold text-sm">{Math.round(daily[activeDay].tempMin)}°C ~ {Math.round(daily[activeDay].tempMax)}°C</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">湿度</p>
                <p className="font-semibold text-sm">{daily[activeDay].humidity.min}% ~ {daily[activeDay].humidity.max}%</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">降雨概率</p>
                <p className="font-semibold text-sm">{daily[activeDay].rainProb}% ({daily[activeDay].psrRating})</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">风向风力</p>
                <p className="font-semibold text-sm">{daily[activeDay].wind}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hourly Forecast for Today */}
      {todayHourly.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">今日逐时预报</h2>
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <div className="flex gap-1 sm:gap-2 px-4 sm:px-6 min-w-full">
              {todayHourly.map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-1 py-2 sm:py-3 px-1.5 sm:px-2 min-w-[52px] sm:min-w-[60px] rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                  <span className="text-[10px] sm:text-xs text-gray-400">{h.time}</span>
                  <span className="text-base sm:text-lg">{WMO_ICONS[h.weatherCode] || '🌤️'}</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800">{Math.round(h.temp)}°</span>
                  <span className="text-[10px] sm:text-xs text-blue-500">{h.rainProb}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* General Situation & Forecast Description from HKO */}
      {forecast && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">天气概况</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{forecast.generalSituation}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">天气预报</h2>
            <p className="text-sm text-gray-600">{forecast.forecastPeriod}</p>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{forecast.forecastDesc}</p>
          </div>
          {forecast.outlook && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">展望</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{forecast.outlook}</p>
            </div>
          )}
          {forecast.tcInfo && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 sm:p-6 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-amber-800 mb-2">🌀 热带气旋信息</h2>
              <p className="text-sm text-amber-700 leading-relaxed">{forecast.tcInfo}</p>
            </div>
          )}
        </>
      )}

      {/* Lightning Info */}
      {lightning && lightning.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">⚡ 闪电监测</h2>
          <div className="flex flex-wrap gap-2">
            {lightning.map((l, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                <span>{l.date} {l.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">详细天气数据</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
          {[
            { label: '温度', value: current.temperature + '°C' },
            { label: '体感温度', value: current.feelsLike + '°C' },
            { label: '湿度', value: current.humidity + '%' },
            { label: '风速', value: current.windSpeed + ' km/h' },
            { label: '风向', value: getWindDirection(current.windDirection) + ' (' + current.windDirection + '°)' },
            { label: '云量', value: current.cloudCover + '%' },
            { label: '紫外线指数', value: current.uvIndex.toFixed(1) + ' (' + getUVLevel(current.uvIndex) + ')' },
            { label: '气压实测', value: '1013 hPa', desc: '天文台标准值' },
            { label: '数据来源', value: source || '香港天文台' },
          ].map((item) => (
            <div key={item.label} className="p-2.5 sm:p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 mb-0.5">{item.label}</p>
              <p className="font-semibold text-gray-800">{item.value}</p>
              {item.desc && <p className="text-gray-400 text-[10px] mt-0.5">{item.desc}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Radar Map */}
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">雷达图 & 卫星云图</h2>
        <WeatherRadar />
      </div>

      <div className="mt-5 text-center">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
