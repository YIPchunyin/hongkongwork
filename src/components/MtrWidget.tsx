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

  const fmtTime = (s: string) => {
    if (!s) return '--';
    const d = new Date(s);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg animate-pulse cursor-pointer" onClick={handleClick}>
        <div className="h-5 w-24 bg-white/20 rounded mb-3" />
        <div className="h-8 w-32 bg-white/20 rounded mb-2" />
        <div className="h-4 w-48 bg-white/10 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg card-hover" onClick={handleClick}>
        <p className="text-orange-100 text-sm font-medium">🚇 最近地铁站</p>
        <p className="text-white/60 text-sm mt-2">定位获取中...</p>
      </div>
    );
  }

  const { station, lines, distanceKm, sysTime } = data;
  const allTrains: { lineName: string; lineCode: string; dest: string; ttnt: number; plat: string; time: string; direction: string }[] = [];
  for (const line of lines) {
    for (const t of line.up) allTrains.push({ lineName: line.lineName, lineCode: line.line, dest: t.dest, ttnt: t.ttnt, plat: t.plat, time: t.time, direction: '上行' });
    for (const t of line.down) allTrains.push({ lineName: line.lineName, lineCode: line.line, dest: t.dest, ttnt: t.ttnt, plat: t.plat, time: t.time, direction: '下行' });
  }
  allTrains.filter(t => t.ttnt <= 120).sort((a, b) => a.ttnt - b.ttnt);
  const next3 = allTrains.slice(0, 3);

  return (
    <div
      className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg card-hover cursor-pointer overflow-hidden group"
      onClick={handleClick}
    >
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-float pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-red-400/10 rounded-full animate-float-slow pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-orange-100 text-sm font-medium">🚇 {station.nameTc}</p>
            <p className="text-orange-200 text-[10px]">
              {distanceKm < 1 ? (distanceKm * 1000).toFixed(0) + 'm' : distanceKm.toFixed(1) + 'km'}
            </p>
          </div>
          <div className="flex gap-1">
            {station.lines.slice(0, 2).map((l) => (
              <span key={l.code} className="text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur" style={{ backgroundColor: getLineColor(l.code) + '55', color: '#fff' }}>{l.code}</span>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          {next3.length > 0 ? next3.map((t, i) => (
            <div key={i} className="flex items-center justify-between bg-white/15 backdrop-blur rounded-lg px-3 py-2 card-hover border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: getLineColor(t.lineCode) }}>{t.lineCode}</span>
                <span className="text-xs">{t.dest}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-orange-200 border border-orange-200/30 rounded px-1.5 py-0.5">{t.direction}</span>
                <span className="text-[10px] text-orange-200">🖥 {t.plat}号</span>
                <span className={'text-sm font-bold tabular-nums ' + (t.ttnt <= 1 ? 'text-yellow-300' : 'text-white')}>{t.ttnt}分</span>
              </div>
            </div>
          )) : (
            <p className="text-orange-200 text-xs text-center py-2">收车时段，暂无列车数据</p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-orange-200 text-[10px]">🔄 每30秒刷新</p>
          <span className="text-orange-200 text-xs group-hover:text-white transition-colors flex items-center gap-1">
            全部班次
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
