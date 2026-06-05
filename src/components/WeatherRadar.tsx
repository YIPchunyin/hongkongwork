'use client';

import { useState } from 'react';

type RadarMode = 'rain' | 'cloud' | 'wind' | 'temp';

export default function WeatherRadar() {
  const [mode, setMode] = useState<RadarMode>('rain');
  const [loading, setLoading] = useState(true);

  const embedUrls: Record<RadarMode, string> = {
    rain: 'https://embed.windy.com/embed2.html?lat=22.32&lon=114.18&zoom=10&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1',
    cloud: 'https://embed.windy.com/embed2.html?lat=22.32&lon=114.18&zoom=10&level=surface&overlay=clouds&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C',
    wind: 'https://embed.windy.com/embed2.html?lat=22.32&lon=114.18&zoom=10&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C',
    temp: 'https://embed.windy.com/embed2.html?lat=22.32&lon=114.18&zoom=10&level=surface&overlay=temp&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C',
  };

  const tabs: { key: RadarMode; label: string; desc: string }[] = [
    { key: 'rain', label: '🌧 雨量', desc: '降雨雷达图' },
    { key: 'cloud', label: '☁️ 云层', desc: '卫星云图' },
    { key: 'wind', label: '💨 风力', desc: '风向风速' },
    { key: 'temp', label: '🌡 温度', desc: '温度分布' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Mode selection */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setMode(tab.key); setLoading(true); }}
            className={`flex-shrink-0 px-4 sm:px-5 py-3 text-sm font-medium transition-colors border-b-2 min-h-[44px] ${
              mode === tab.key
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Map area */}
      <div className="relative w-full" style={{ minHeight: '300px', height: '50vh', maxHeight: '500px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">加载雷达图中...</p>
            </div>
          </div>
        )}
        <iframe
          src={embedUrls[mode]}
          className="w-full h-full border-0"
          title="Hong Kong Weather Radar"
          allow="geolocation"
          onLoad={() => setLoading(false)}
          loading="lazy"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
        <span>數據來源：Windy.com / ECMWF</span>
        <span className="text-blue-500">香港 · 22.32°N · 114.18°E</span>
      </div>
    </div>
  );
}
