'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { WMO_CODES, WMO_ICONS, getWindDirection, getUVLevel } from '@/lib/weather';

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
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => fetchWeather(), // fallback to default HK
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
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">天气数据暂不可用</p>
          <button onClick={handleRefresh} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const { current, location, next3Hours, hourly, daily } = weather;
  const todayHourly = hourly.filter((h) => h.date === daily[0]?.date);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">香港天气</h1>
          <p className="text-gray-500 mt-1">{location.district} · 海拔 {location.elevation}m</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* Current Weather Hero */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium">现在天气</p>
            <p className="text-5xl sm:text-6xl font-bold mt-2">
              {Math.round(current.temperature)}°C
            </p>
            <p className="text-xl mt-1 text-blue-100">
              {WMO_ICONS[current.weatherCode]} {WMO_CODES[current.weatherCode] || '未知'}
            </p>
            <p className="text-blue-200 text-sm mt-1">
              体感 {Math.round(current.feelsLike)}°C
            </p>
          </div>
          <div className="text-right text-6xl">
            {WMO_ICONS[current.weatherCode]}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
            <p className="text-blue-200 text-xs">湿度</p>
            <p className="font-semibold text-lg">{current.humidity}%</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
            <p className="text-blue-200 text-xs">风速</p>
            <p className="font-semibold text-lg">{current.windSpeed} km/h</p>
            <p className="text-blue-200 text-xs">{getWindDirection(current.windDirection)}风</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
            <p className="text-blue-200 text-xs">气压</p>
            <p className="font-semibold text-lg">{current.pressure} hPa</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
            <p className="text-blue-200 text-xs">紫外线</p>
            <p className="font-semibold text-lg">{current.uvIndex.toFixed(1)}</p>
            <p className="text-blue-200 text-xs">{getUVLevel(current.uvIndex)}</p>
          </div>
        </div>

        {/* 3-hour Rain Probability */}
        {next3Hours.length > 0 && (
          <div className="mt-4 bg-white/15 rounded-xl p-3 backdrop-blur">
            <p className="text-blue-200 text-xs mb-2">近3小时降雨概率</p>
            <div className="flex gap-4">
              {next3Hours.map((h) => (
                <div key={h.time} className="text-center">
                  <p className="text-xs text-blue-200">{h.time}</p>
                  <p className={`font-bold text-lg ${h.prob > 50 ? 'text-yellow-300' : ''}`}>{h.prob}%</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-blue-200 text-xs mt-3">更新于 {formatTime(current.updateTime)} · 数据来源：Open-Meteo</p>
      </div>

      {/* Today Hourly Forecast */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">今日逐小时预报</h2>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-flex gap-1 px-6 min-w-full">
            {todayHourly.map((h, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 py-3 px-2 min-w-[60px] rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors"
              >
                <span className="text-xs text-gray-400">{h.time}</span>
                <span className="text-lg">{WMO_ICONS[h.weatherCode] || '🌤️'}</span>
                <span className="text-sm font-semibold text-gray-800">{Math.round(h.temp)}°</span>
                <span className="text-xs text-blue-500">{h.rainProb}%</span>
                <span className="text-[10px] text-gray-400">{h.windSpeed}km/h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">7日天气预测</h2>
        <div className="space-y-2">
          {daily.map((d, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer ${
                activeDay === i ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveDay(i)}
            >
              <div className="w-12 text-sm font-medium text-gray-700">
                {getDayName(d.date)}
              </div>
              <div className="text-2xl w-10 text-center">{WMO_ICONS[d.weatherCode]}</div>
              <div className="flex-1 text-sm text-gray-500">{WMO_CODES[d.weatherCode] || ''}</div>
              <div className="text-right">
                <span className="font-semibold text-gray-800">{Math.round(d.tempMax)}°</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-400">{Math.round(d.tempMin)}°</span>
              </div>
              <div className="w-16 text-right text-sm text-blue-500">{d.rainProb}%</div>
              <div className="hidden sm:block w-20 text-right text-xs text-gray-400">
                <span>{d.windSpeed}km/h</span>
              </div>

              {/* Expanded day details */}
            </div>
          ))}
        </div>

        {/* Active day detail */}
        {daily[activeDay] && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">详细天气数据</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">温度</p>
            <p className="font-semibold text-gray-800">{current.temperature}°C</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">体感温度</p>
            <p className="font-semibold text-gray-800">{current.feelsLike}°C</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">湿度</p>
            <p className="font-semibold text-gray-800">{current.humidity}%</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">风速</p>
            <p className="font-semibold text-gray-800">{current.windSpeed} km/h</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">阵风</p>
            <p className="font-semibold text-gray-800">{current.windGusts || '-'} km/h</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">风向</p>
            <p className="font-semibold text-gray-800">{getWindDirection(current.windDirection)} ({current.windDirection}°)</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">气压</p>
            <p className="font-semibold text-gray-800">{current.pressure} hPa</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">云量</p>
            <p className="font-semibold text-gray-800">{current.cloudCover}%</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-gray-500">紫外线指数</p>
            <p className="font-semibold text-gray-800">{current.uvIndex.toFixed(1)} ({getUVLevel(current.uvIndex)})</p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
