'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getLineColor, getLineName, getStationByCode } from '@/lib/mtr-stations';

interface TrainInfo {
  direction: string;
  dest: string;
  destCode: string;
  time: string;
  ttnt: number;
  plat: string;
  valid: boolean;
}

interface LineInfo {
  line: string;
  lineName: string;
  up: TrainInfo[];
  down: TrainInfo[];
}

interface MtrData {
  station: {
    code: string;
    nameTc: string;
    nameEn: string;
    lat: number;
    lng: number;
    lines: { code: string; name: string }[];
  };
  distanceKm: number;
  sysTime: string;
  lines: LineInfo[];
}

function fmtTime(s: string): string {
  if (!s) return '--';
  const d = new Date(s);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export default function MtrSchedule() {
  const sp = useSearchParams();
  const [data, setData] = useState<MtrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const lat = sp.get('lat');
    const lng = sp.get('lng');
    try {
      const p = new URLSearchParams();
      if (lat && lng) { p.set('lat', lat); p.set('lng', lng); }
      const r = await fetch('/api/mtr?' + p.toString());
      const j = await r.json();
      if (j.success && j.data) { setData(j.data); setError(false); }
      else { setError(true); }
    } catch { setError(true); }
    finally { setLoading(false); setRefreshing(false); }
  }, [sp]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">地铁数据暂不可用</p>
          <button onClick={handleRefresh} className="px-5 py-2.5 bg-orange-600 text-white rounded-lg text-sm min-h-[44px]">重新加载</button>
        </div>
      </div>
    );
  }

  const { station, lines, sysTime } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🚇 {station.nameTc}</h1>
            <span className="text-sm text-gray-400">({station.nameEn})</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {station.lines.map(l => l.name).join(' / ')} · 更新: {fmtTime(sysTime)}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]">
            <svg className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
          <Link href="/" className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </Link>
        </div>
      </div>

      {/* Station Card */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl p-6 text-white shadow-lg mb-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🚉</div>
          <div>
            <p className="text-3xl font-bold">{station.nameTc}</p>
            <p className="text-orange-100">{station.nameEn}</p>
            <div className="flex gap-2 mt-2">
              {station.lines.map(l => (
                <span key={l.code} className="text-xs px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: getLineColor(l.code) + '66' }}>{l.name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trains by Line */}
      {lines.map(line => (
        <div key={line.line} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLineColor(line.line) }} />
            <h2 className="text-base font-semibold text-gray-800">{line.lineName}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">上行方向</p>
              {line.up.length > 0 ? line.up.map((t, i) => (
                <div key={i} className={'flex items-center justify-between px-3 py-2 rounded-lg mb-1 ' + (t.valid ? 'bg-gray-50' : 'bg-gray-50/50 opacity-50')}>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center">{t.plat}</span>
                    <span className="text-sm text-gray-700">{t.dest}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{fmtTime(t.time)}</span>
                    <span className={'text-sm font-bold min-w-[32px] text-right ' + (t.ttnt <= 1 ? 'text-red-500' : t.ttnt <= 3 ? 'text-orange-500' : 'text-gray-700')}>{t.ttnt}分</span>
                  </div>
                </div>
              )) : <p className="text-gray-400 text-xs py-4 text-center bg-gray-50 rounded-lg">暂无列车</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">下行方向</p>
              {line.down.length > 0 ? line.down.map((t, i) => (
                <div key={i} className={'flex items-center justify-between px-3 py-2 rounded-lg mb-1 ' + (t.valid ? 'bg-gray-50' : 'bg-gray-50/50 opacity-50')}>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center">{t.plat}</span>
                    <span className="text-sm text-gray-700">{t.dest}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{fmtTime(t.time)}</span>
                    <span className={'text-sm font-bold min-w-[32px] text-right ' + (t.ttnt <= 1 ? 'text-red-500' : t.ttnt <= 3 ? 'text-orange-500' : 'text-gray-700')}>{t.ttnt}分</span>
                  </div>
                </div>
              )) : <p className="text-gray-400 text-xs py-4 text-center bg-gray-50 rounded-lg">暂无列车</p>}
            </div>
          </div>
        </div>
      ))}

      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 mb-4">
        <p className="text-xs text-amber-700">📡 数据来源：香港铁路有限公司 (MTR) 实时到站数据 · 每30秒自动刷新</p>
      </div>

      <div className="mt-5 text-center">
        <Link href="/" className="text-sm text-orange-600 hover:text-orange-700 font-medium">← 返回首页</Link>
      </div>
    </div>
  );
}
