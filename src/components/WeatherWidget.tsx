'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WMO_CODES, WMO_ICONS } from '@/lib/weather';

interface RainHour { time: string; prob: number; }
interface WeatherInfo {
  location: { district: string; lat: number; lng: number };
  current: { temperature: number; feelsLike: number; humidity: number; weatherCode: number; windSpeed: number; pressure: number; cloudCover: number; uvIndex: number; updateTime: string; };
  next3Hours: RainHour[];
  source: string;
}

export default function WeatherWidget() {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const fetchWeather = useCallback(async (lat?: number, lng?: number) => {
    try {
      const params = new URLSearchParams();
      if (lat !== undefined && lng !== undefined) { params.set('lat', String(lat)); params.set('lng', String(lng)); }
      const res = await fetch('/api/weather?' + params.toString());
      const json = await res.json();
      if (json.success && json.data) { setWeather(json.data); setError(false); }
      else { setError(true); }
    } catch { setError(true); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); fetchWeather(pos.coords.latitude, pos.coords.longitude); },
        () => fetchWeather(),
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else { fetchWeather(); }
  }, [fetchWeather]);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    fetchWeather(userLat ?? undefined, userLng ?? undefined);
  };

  const handleClick = () => {
    const params = new URLSearchParams();
    if (userLat && userLng) { params.set('lat', String(userLat)); params.set('lng', String(userLng)); }
    router.push('/weather' + (params.toString() ? '?' + params.toString() : ''));
  };

  const fmtTime = (iso: string) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="apple-card p-5 sm:p-6 h-full animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
        <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="apple-card p-5 sm:p-6 h-full group cursor-pointer" onClick={handleClick}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <p className="text-sm font-semibold apple-text-primary">香港天气</p>
        </div>
        <p className="text-xs apple-text-secondary mt-1">加载中...</p>
        <button onClick={handleRefresh} className="mt-2 text-xs text-[#007AFF] hover:text-blue-700 font-medium">点击重试</button>
      </div>
    );
  }

  const { current, location, next3Hours, source } = weather;

  return (
    <div
      className="apple-card p-5 sm:p-6 h-full group cursor-pointer relative overflow-hidden"
      onClick={handleClick}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#007AFF] to-[#5856D6]" />

      {/* Decorative blue orb */}
      <div className="absolute -top-8 -right-8 w-28 h-28 bg-blue-100/50 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold apple-text-primary">{location.district}</p>
              <p className="text-[10px] apple-text-secondary">🇭🇰 香港</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            title="刷新"
          >
            <svg className={'w-3.5 h-3.5 text-gray-400 ' + (refreshing ? 'animate-spin' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-bold apple-text-primary tracking-tight">
                {current.temperature !== undefined ? Math.round(current.temperature) : '--'}
              </span>
              <span className="text-xl apple-text-secondary font-light">°C</span>
            </div>
            <p className="text-sm apple-text-secondary mt-0.5">
              {WMO_ICONS[current.weatherCode]} {WMO_CODES[current.weatherCode] || ''}
            </p>
          </div>
          <div className="text-3xl sm:text-4xl opacity-80">
            {WMO_ICONS[current.weatherCode]}
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          {current.feelsLike !== undefined && (
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100/50">
              <p className="text-[10px] apple-text-secondary">体感</p>
              <p className="text-sm font-semibold apple-text-primary">{Math.round(current.feelsLike)}°C</p>
            </div>
          )}
          {current.humidity !== undefined && (
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100/50">
              <p className="text-[10px] apple-text-secondary">湿度</p>
              <p className="text-sm font-semibold apple-text-primary">{current.humidity}%</p>
            </div>
          )}
          {current.windSpeed !== undefined && (
            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100/50">
              <p className="text-[10px] apple-text-secondary">风速</p>
              <p className="text-sm font-semibold apple-text-primary">{current.windSpeed} km/h</p>
            </div>
          )}
        </div>

        {next3Hours && next3Hours.length > 0 && (
          <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100/50">
            <p className="text-[10px] apple-text-secondary mb-1">降雨概率</p>
            <div className="flex gap-3">
              {next3Hours.map((h, i) => (
                <div key={i} className="flex-1 text-center">
                  <p className="text-[10px] apple-text-secondary">{h.time}</p>
                  <div className="mt-0.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#007AFF] rounded-full transition-all" style={{ width: h.prob + '%' }} />
                  </div>
                  <p className={'text-xs font-semibold mt-0.5 ' + (h.prob > 50 ? 'text-[#007AFF]' : 'apple-text-secondary')}>
                    {h.prob}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] apple-text-secondary">更新于 {fmtTime(current.updateTime)} · {source}</p>
          <span className="text-xs text-[#007AFF] font-medium opacity-0 group-hover:opacity-100 transition-all flex items-center gap-0.5">
            详情
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
