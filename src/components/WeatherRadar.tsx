'use client';

import { useState, useEffect } from 'react';

type RadarMode = 'hko_radar' | 'satellite' | 'windy_rain';

export default function WeatherRadar() {
  const [mode, setMode] = useState<RadarMode>('hko_radar');
  const [loading, setLoading] = useState(true);
  const [radarImages, setRadarImages] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Fetch latest HKO radar image URLs
    fetch('/api/weather')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.radar?.images) {
          setRadarImages(data.data.radar.images);
        }
      })
      .catch(() => {});
  }, []);

  // Animation loop
  useEffect(() => {
    if (!animating || radarImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % radarImages.length);
    }, 800);
    return () => clearInterval(interval);
  }, [animating, radarImages.length]);

  const toggleAnimation = () => {
    if (animating) {
      setAnimating(false);
    } else {
      setAnimating(true);
      setCurrentFrame(0);
    }
  };

  const tabs: { key: RadarMode; label: string; desc: string }[] = [
    { key: 'hko_radar', label: '📡 雷达图', desc: '香港天文台雷达图像' },
    { key: 'satellite', label: '🛰 卫星云图', desc: '卫星云图' },
    { key: 'windy_rain', label: '🌍 Windy', desc: 'Windy 天气图' },
  ];

  const latestRadarUrl = radarImages.length > 0
    ? radarImages[currentFrame] || radarImages[radarImages.length - 1]
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Mode tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setMode(tab.key); setLoading(true); setAnimating(false); }}
            className={'flex-shrink-0 px-4 sm:px-5 py-3 text-sm font-medium transition-colors border-b-2 min-h-[44px] ' +
              (mode === tab.key
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50')}
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
              <p className="text-sm text-gray-400">加载中...</p>
            </div>
          </div>
        )}

        {/* HKO Radar */}
        {mode === 'hko_radar' && (
          <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative">
            {latestRadarUrl ? (
              <>
                <img
                  src={latestRadarUrl}
                  alt="香港天文台雷达图"
                  className="w-full h-full object-contain"
                  onLoad={() => setLoading(false)}
                  onError={() => setLoading(false)}
                />
                {radarImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <button
                      onClick={toggleAnimation}
                      className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' +
                        (animating ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-700 hover:bg-white')}
                    >
                      {animating ? '⏹ 停止' : '▶ 动画播放'}
                    </button>
                    {!animating && radarImages.length > 1 && (
                      <div className="flex gap-1">
                        {radarImages.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => { setCurrentFrame(i); setAnimating(false); }}
                            className={'w-2 h-2 rounded-full transition-colors ' +
                              (i === currentFrame ? 'bg-white' : 'bg-white/40')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-white/60 text-sm">
                <p>暂未获取到雷达数据</p>
              </div>
            )}
          </div>
        )}

        {/* HKO Satellite */}
        {mode === 'satellite' && (
          <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center">
            <img
              src="https://www.hko.gov.hk/content_elements_v2/images/satellite/SC/SC_IR_20260607_0015.png"
              alt="香港天文台卫星云图"
              className="w-full h-full object-contain"
              onLoad={() => setLoading(false)}
              onError={(e) => {
                setLoading(false);
                // Try older satellite image
                const img = e.target as HTMLImageElement;
                img.src = 'https://www.hko.gov.hk/content_elements_v2/images/satellite/SW_IR_20260607_0015.png';
                img.onerror = () => {
                  // Fallback to HKO satellite page
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="text-white/60 text-sm p-4"><p>卫星云图暂不可用</p><p class="mt-2 text-xs">请访问 <a href="https://www.hko.gov.hk/wxinfo/intersat/satellite/satellite.htm" target="_blank" class="text-blue-400 underline">天文台卫星云图</a> 查看</p></div>';
                  }
                };
              }}
            />
          </div>
        )}

        {/* Windy embed */}
        {mode === 'windy_rain' && (
          <iframe
            src={'https://embed.windy.com/embed2.html?lat=22.32&lon=114.18&zoom=10&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1'}
            className="w-full h-full border-0"
            title="Windy Weather Map"
            allow="geolocation"
            onLoad={() => setLoading(false)}
            loading="lazy"
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
        {mode === 'hko_radar' && <span>數據來源：香港天文台 雷達圖</span>}
        {mode === 'satellite' && <span>數據來源：香港天文台 衛星雲圖</span>}
        {mode === 'windy_rain' && <span>數據來源：Windy.com / ECMWF</span>}
        <span className="text-blue-500">香港 · 22.32°N · 114.18°E</span>
      </div>
    </div>
  );
}
