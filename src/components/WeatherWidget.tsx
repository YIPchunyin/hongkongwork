'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WMO_CODES, WMO_ICONS } from '@/lib/weather';

interface RainHour {
  time: string;
  prob: number;
}

interface WeatherInfo {
  location: { district: string; lat: number; lng: number };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    weatherCode: number;
    windSpeed: number;
    pressure: number;
    cloudCover: number;
    uvIndex: number;
    updateTime: string;
  };
  next3Hours: RainHour[];
}

export default function WeatherWidget() {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const fetchWeather = useCallback(async (lat?: number, lng?: number, isRefresh = false) => {
    try {
      const params = new URLSearchParams();
      if (lat !== undefined && lng !== undefined) {
        params.set('lat', String(lat));
        params.set('lng', String(lng));
      }
      const res = await fetch(`/api/weather?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
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

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    fetchWeather(userLat ?? undefined, userLng ?? undefined, true);
  };

  const handleClick = () => {
    const params = new URLSearchParams();
    if (userLat && userLng) {
      params.set('lat', String(userLat));
      params.set('lng', String(userLng));
    }
    router.push(`/weather${params.toString() ? `?${params}` : ''}`);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg animate-pulse cursor-pointer" onClick={handleClick}>
        <div className="h-5 w-24 bg-white/20 rounded mb-3" />
        <div className="h-8 w-32 bg-white/20 rounded mb-2" />
        <div className="h-4 w-48 bg-white/10 rounded" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={handleClick}>
        <p className="text-blue-100 text-sm font-medium">🇭🇰 香港天氣</p>
        <p className="text-white/60 text-sm mt-2">⏳ 加载中...</p>
        <button onClick={handleRefresh} className="mt-2 text-xs text-blue-200 hover:text-white">
          点击重试
        </button>
      </div>
    );
  }

  const { current, location, next3Hours } = weather;

  return (
    <div
      className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-blue-100 text-sm font-medium">
            🇭🇰 {location.district}
          </p>
          <p className="text-3xl sm:text-4xl font-bold mt-1">
            {current.temperature !== undefined ? `${Math.round(current.temperature)}°C` : '--'}
          </p>
          <p className="text-blue-100 text-sm mt-1">
            {WMO_ICONS[current.weatherCode]} {WMO_CODES[current.weatherCode] || ''}
          </p>
          {current.feelsLike !== undefined && (
            <p className="text-blue-200 text-xs mt-0.5">
              体感 {Math.round(current.feelsLike)}°C
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors opacity-0 group-hover:opacity-100"
            title="刷新天气数据"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="text-3xl sm:text-4xl">
            {WMO_ICONS[current.weatherCode]}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-sm">
        {current.humidity !== undefined && (
          <div className="bg-white/15 rounded-xl px-3 py-2 backdrop-blur">
            <p className="text-blue-200 text-xs">湿度</p>
            <p className="font-semibold">{current.humidity}%</p>
          </div>
        )}

        {current.windSpeed !== undefined && (
          <div className="bg-white/15 rounded-xl px-3 py-2 backdrop-blur">
            <p className="text-blue-200 text-xs">风速</p>
            <p className="font-semibold">{current.windSpeed} km/h</p>
          </div>
        )}

        {next3Hours && next3Hours.length > 0 && (
          <div className="bg-white/15 rounded-xl px-3 py-2 backdrop-blur">
            <p className="text-blue-200 text-xs">降雨概率</p>
            <div className="flex gap-2 mt-1">
              {next3Hours.map((h) => (
                <div key={h.time} className="text-center">
                  <p className="text-[10px] text-blue-200">{h.time}</p>
                  <p className={`font-semibold text-sm ${h.prob > 50 ? 'text-yellow-300' : ''}`}>
                    {h.prob}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-blue-200 text-xs">更新于 {formatTime(current.updateTime)}</p>
        <span className="text-blue-200 text-xs group-hover:text-white transition-colors">
          查看详情 →
        </span>
      </div>
    </div>
  );
}
