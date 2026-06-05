'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { WMO_CODES, WMO_ICONS, getWindDirection, getUVLevel } from '@/lib/weather';
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
  rainProb: number;
  windSpeed: number;
  windDir: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
}

interface WeatherData {
  location: { district: string; lat: number; lng: number; elevation: number };
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    weatherCode: number;
    windSpeed: number;
    windGusts: number;
    windDirection: number;
    pressure: number;
    cloudCover: number;
    uvIndex: number;
    updateTime: string;
  };
  next3Hours: { time: string; prob: number }[];
  hourly: HourlyItem[];
  daily: DailyItem[];
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
      const res = await fetch(`/api/weather?${params}`);
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
    const d = new Date(iso);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const getDayName = (dateStr: string) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const d = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    if (dateStr === today) return '今天';
    if (dateStr === tomorrow) return '明天';
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

  const { current, location, next3Hours, hourly, daily } = weather;
  const todayHourly = hourly.filter((h) => h.date === daily[0]?.date);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">香港天气</h1>
          <p className="text-sm text-gray-500 mt-0.5">{location.district} · 海拔 {location.elevation}m</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">返回</span>
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">{refreshing ? '刷新中' : '刷新'}</span>
          </button>
        </div>
      </div>

      {/* Current Weather Hero */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs sm:text-sm font-medium">现在天气</p>
            <p className="text-4xl sm:text-5xl font-bold mt-1">
              {Math.round(current.temperature)}°C
            </p>
            <p className="text-base sm:text-lg mt-0.5 text-blue-100">
              {WMO_ICONS[current.weatherCode]} {WMO_CODES[current.weatherCode] || '未知'}
            </p>
            <p className="text-blue-200 text-xs sm:text-sm mt-0.5">
              体感 {Math.round(current.feelsLike)}°C
            </p>
          </div>
          <div className="text-right text-4xl sm:text-5xl">
            {WMO_ICONS[current.weatherCode]}
          </div>
        </div>

        {/* Quick Stats - 2 cols on mobile, 4 on desktop */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <div className="bg-white/15 rounded-xl p-2.5 sm:p-3 backdrop-blur">
            <p className="text-blue-200 text-xs">湿度</p>
            <p className="font-semibold text-base sm:text-lg">{current.humidity}%</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 sm:p-3 backdrop-blur">
            <p className="text-blue-200 text-xs">风速</p>
            <p className="font-semibold text-base sm:text-lg">{current.windSpeed} km/h</p>
            <p className="text-blue-200 text-xs">{getWindDirection(current.windDirection)}风</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 sm:p-3 backdrop-blur">
            <p className="text-blue-200 text-xs">气压</p>
            <p className="font-semibold text-base sm:text-lg">{current.pressure} hPa</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 sm:p-3 backdrop-blur">
            <p className="text-blue-200 text-xs">紫外线</p>
            <p className="font-semibold text-base sm:text-lg">{current.uvIndex.toFixed(1)}</p>
            <p className="text-blue-200 text-xs">{getUVLevel(current.uvIndex)}</p>
          </div>
        </div>

        {/* 3-hour Rain */}
        {next3Hours.length > 0 && (
          <div className="mt-3 bg-white/15 rounded-xl p-2.5 sm:p-3 backdrop-blur">
            <p className="text-blue-200 text-xs mb-1.5">近3小时降雨概率</p>
            <div className="flex gap-3 sm:gap-4">
              {next3Hours.map((h) => (
                <div key={h.time} className="text-center">
                  <p className="text-xs text-blue-200">{h.time}</p>
                  <p className={`font-bold text-base sm:text-lg ${h.prob > 50 ? 'text-yellow-300' : ''}`}>{h.prob}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-blue-200 text-xs mt-3">
          更新于 {formatTime(current.updateTime)} · 數據來源：Open-Meteo
        </p>
      </div>

      {/* ===== WEATHER RADAR MAP ===== */}
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          香港天气雷达
        </h2>
        <WeatherRadar />
      </div>

      {/* Today Hourly */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">今日逐小时预报</h2>
        <div className="overflow-x-auto -mx-4 sm:-mx-6 hide-scrollbar">
          <div className="inline-flex gap-1 sm:gap-1.5 px-4 sm:px-6 min-w-full">
            {todayHourly.map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 py-2 sm:py-3 px-1.5 sm:px-2 min-w-[52px] sm:min-w-[60px] rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                <span className="text-[10px] sm:text-xs text-gray-400">{h.time}</span>
                <span className="text-base sm:text-lg">{WMO_ICONS[h.weatherCode] || '🌤️'}</span>
                <span className="text-xs sm:text-sm font-semibold text-gray-800">{Math.round(h.temp)}°</span>
                <span className="text-[10px] sm:text-xs text-blue-500">{h.rainProb}%</span>
                <span className="text-[10px] text-gray-400 hidden sm:block">{h.windSpeed}km/h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">7日天气预测</h2>
        <div className="space-y-1">
          {daily.map((d, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 rounded-xl transition-colors cursor-pointer ${
                activeDay === i ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveDay(i)}
            >
              <div className="w-10 sm:w-12 text-xs sm:text-sm font-medium text-gray-700">
                {getDayName(d.date)}
              </div>
              <div className="text-xl sm:text-2xl w-8 sm:w-10 text-center">{WMO_ICONS[d.weatherCode]}</div>
              <div className="hidden sm:block flex-1 text-xs sm:text-sm text-gray-500 truncate">
                {WMO_CODES[d.weatherCode] || ''}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-gray-500">日出</p>
                <p className="font-semibold text-gray-800">{formatTime(daily[activeDay].sunrise)}</p>
              </div>
              <div>
                <p className="text-gray-500">日落</p>
                <p className="font-semibold text-gray-800">{formatTime(daily[activeDay].sunset)}</p>
              </div>
              <div>
                <p className="text-gray-500">紫外线</p>
                <p className="font-semibold text-gray-800">{daily[activeDay].uvIndex?.toFixed(1)} {getUVLevel(daily[activeDay].uvIndex || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">风向</p>
                <p className="font-semibold text-gray-800">{getWindDirection(daily[activeDay].windDir)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">详细天气数据</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
          {[
            { label: '温度', value: `${current.temperature}°C` },
            { label: '体感温度', value: `${current.feelsLike}°C` },
            { label: '湿度', value: `${current.humidity}%` },
            { label: '风速', value: `${current.windSpeed} km/h` },
            { label: '阵风', value: `${current.windGusts || '-'} km/h` },
            { label: '风向', value: `${getWindDirection(current.windDirection)} (${current.windDirection}°)` },
            { label: '气压', value: `${current.pressure} hPa` },
            { label: '云量', value: `${current.cloudCover}%` },
            { label: '紫外线指数', value: `${current.uvIndex.toFixed(1)} (${getUVLevel(current.uvIndex)})` },
          ].map((item) => (
            <div key={item.label} className="p-2.5 sm:p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 mb-0.5">{item.label}</p>
              <p className="font-semibold text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 text-center">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
