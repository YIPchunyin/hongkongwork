'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getLineColor } from '@/lib/mtr-stations';

interface TrainEntry { direction: string; dest: string; destCode: string; time: string; ttnt: number; plat: string; valid: boolean; }
interface LineInfo { line: string; lineName: string; up: TrainEntry[]; down: TrainEntry[]; }
interface MtrData { station: { code: string; nameTc: string; nameEn: string; lines: { code: string; name: string }[]; }; distanceKm: number; sysTime: string; lines: LineInfo[]; }

export default function MtrWidget() {
  const router = useRouter();
  const [data, setData] = useState<MtrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const fetchMtr = useCallback(async (mlat?: number, mlng?: number) => {
    try {
      const p = new URLSearchParams();
      if (mlat !== undefined) { p.set('lat', String(mlat)); p.set('lng', String(mlng)); }
      const res = await fetch('/api/mtr?' + p.toString());
      const json = await res.json();
      if (json.success && json.data) { setData(json.data); setError(false); }
      else { setError(true); }
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); fetchMtr(pos.coords.latitude, pos.coords.longitude); },
        () => fetchMtr(22.3193, 114.1694),
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else { fetchMtr(22.3193, 114.1694); }
  }, [fetchMtr]);

  useEffect(() => {
    const t = setInterval(() => { if (lat && lng) fetchMtr(lat, lng); }, 30000);
    return () => clearInterval(t);
  }, [fetchMtr, lat, lng]);

  const handleClick = () => {
    const p = new URLSearchParams();
    if (lat && lng) { p.set('lat', String(lat)); p.set('lng', String(lng)); }
    router.push('/mtr' + (p.toString() ? '?' + p.toString() : ''));
  };

  if (loading) {
    return (
      <div className="apple-card p-5 sm:p-6 h-full animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
        <div className="h-8 w-36 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-40 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="apple-card p-5 sm:p-6 h-full group cursor-pointer" onClick={handleClick}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <p className="text-sm font-semibold apple-text-primary">最近地铁站</p>
        </div>
        <p className="text-xs apple-text-secondary">定位获取中...</p>
      </div>
    );
  }

  const { station, lines, distanceKm } = data;
  const allTrains: { lineName: string; lineCode: string; dest: string; ttnt: number; plat: string; time: string; direction: string }[] = [];
  for (const line of lines) {
    for (const t of line.up) allTrains.push({ lineName: line.lineName, lineCode: line.line, dest: t.dest, ttnt: t.ttnt, plat: t.plat, time: t.time, direction: '上行' });
    for (const t of line.down) allTrains.push({ lineName: line.lineName, lineCode: line.line, dest: t.dest, ttnt: t.ttnt, plat: t.plat, time: t.time, direction: '下行' });
  }
  allTrains.filter(t => t.ttnt <= 120).sort((a, b) => a.ttnt - b.ttnt);
  const next3 = allTrains.slice(0, 3);

  return (
    <div
      className="apple-card p-5 sm:p-6 h-full group cursor-pointer relative overflow-hidden"
      onClick={handleClick}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600" />

      {/* Decorative orange orb */}
      <div className="absolute -top-8 -right-8 w-28 h-28 bg-orange-50/80 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold apple-text-primary">{station.nameTc}</p>
              <p className="text-[10px] apple-text-secondary">
                {distanceKm < 1 ? (distanceKm * 1000).toFixed(0) + 'm' : distanceKm.toFixed(1) + 'km'} ·
                {station.lines.map(l => l.code).join(' / ')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {next3.length > 0 ? next3.map((t, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100/50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: getLineColor(t.lineCode) }}>{t.lineCode}</span>
                <span className="text-xs font-medium apple-text-primary">{t.dest}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] apple-text-secondary border border-gray-200 rounded px-1.5 py-0.5">{t.direction}</span>
                <span className="text-[10px] apple-text-secondary">{t.plat}号月台</span>
                <span className={'text-sm font-bold tabular-nums ' + (t.ttnt <= 1 ? 'text-[#FF3B30]' : 'text-[#007AFF]')}>{t.ttnt}分</span>
              </div>
            </div>
          )) : (
            <p className="text-xs apple-text-secondary text-center py-2">收车时段，暂无列车数据</p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] apple-text-secondary">🔄 每30秒自动刷新</p>
          <span className="text-xs text-[#FF9500] font-medium opacity-0 group-hover:opacity-100 transition-all flex items-center gap-0.5">
            全部班次
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
