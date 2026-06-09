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
  return d.toLocaleTimeString('zh-HK', { timeZone: 'Asia/Hong_Kong', hour: '2-digit', minute: '2-digit' });
}

function getTrainStatus(ttnt: number): { label: string; color: string; icon: string } {
  if (ttnt <= 0) return { label: '已离站', color: 'text-red-500', icon: '🚀' };
  if (ttnt <= 1) return { label: '即将进站', color: 'text-red-500', icon: '🚨' };
  if (ttnt <= 3) return { label: '即将到达', color: 'text-orange-500', icon: '⚠️' };
  if (ttnt <= 5) return { label: '接近中', color: 'text-yellow-500', icon: '🔶' };
  if (ttnt <= 10) return { label: '行驶中', color: 'text-green-500', icon: '🟢' };
  if (ttnt <= 20) return { label: '正常', color: 'text-blue-500', icon: '🔵' };
  return { label: '尚早', color: 'text-gray-400', icon: '⏳' };
}

function getTrainCount(allTrains: TrainInfo[]): { arrived: number; approaching: number; normal: number; total: number } {
  const total = allTrains.length;
  const arrived = allTrains.filter(t => t.ttnt <= 1).length;
  const approaching = allTrains.filter(t => t.ttnt > 1 && t.ttnt <= 5).length;
  const normal = allTrains.filter(t => t.ttnt > 5).length;
  return { arrived, approaching, normal, total };
}

export default function MtrSchedule() {
  const sp = useSearchParams();
  const [data, setData] = useState<MtrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);

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

  // Count total trains
  let totalUp = 0, totalDown = 0;
  for (const line of lines) {
    totalUp += line.up.length;
    totalDown += line.down.length;
  }

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
            <svg className={"w-4 h-4 " + (refreshing ? 'animate-spin' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <div className="mt-4 flex gap-4 text-sm text-orange-100">
          <span>⬆️ {totalUp} 班</span>
          <span>⬇️ {totalDown} 班</span>
          <span>📍 {Math.round(data.distanceKm * 10) / 10}km</span>
        </div>
      </div>

      {/* Trains by Line */}
      {lines.map(line => {
        const lc = getLineColor(line.line);
        const upAll = [...line.up].sort((a, b) => a.ttnt - b.ttnt);
        const downAll = [...line.down].sort((a, b) => a.ttnt - b.ttnt);
        const isExpanded = expandedLine === line.line;
        const displayUp = isExpanded ? upAll : upAll.slice(0, 5);
        const displayDown = isExpanded ? downAll : downAll.slice(0, 5);
        const upStats = getTrainCount(upAll);
        const downStats = getTrainCount(downAll);

        return (
          <div key={line.line} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 overflow-hidden">
            {/* Line Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: lc }} />
                <h2 className="text-base font-semibold text-gray-800">{line.lineName}</h2>
                <span className="text-[10px] text-gray-400">共 {upAll.length + downAll.length} 班列车</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Up direction */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600">⬆️ 上行方向</p>
                  <div className="flex gap-2 text-[10px]">
                    {upStats.approaching > 0 && <span className="text-red-500">🚨{upStats.approaching}</span>}
                    {upStats.normal > 0 && <span className="text-blue-400">🚃{upStats.normal}</span>}
                  </div>
                </div>
                {displayUp.length > 0 ? displayUp.map((t, i) => {
                  const status = getTrainStatus(t.ttnt);
                  const barWidth = Math.max(3, Math.min(100, (1 - t.ttnt / 60) * 100));
                  const barColor = t.ttnt <= 1 ? '#ef4444' : t.ttnt <= 3 ? '#f97316' : t.ttnt <= 10 ? '#22c55e' : '#3b82f6';
                  return (
                    <div key={i} className="mb-1.5">
                      <div className={"flex items-center justify-between px-3 py-2 rounded-lg border-l-4 " + (t.valid ? 'bg-gray-50/80 border-gray-200' : 'bg-gray-50/50 opacity-50 border-gray-100')}
                        style={{ borderLeftColor: lc }}>
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-xs">{status.icon}</span>
                          <span className="w-5 h-5 rounded-full bg-white text-gray-700 text-[10px] font-bold flex items-center justify-center border border-gray-200 shadow-sm">{t.plat}</span>
                          <span className="text-sm text-gray-700 font-medium truncate">{t.dest}</span>
                          {t.ttnt <= 1 && (
                            <span className="text-[10px] text-red-500 font-bold animate-pulse">进站中</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[11px] text-gray-400 tabular-nums">{fmtTime(t.time)}</span>
                          <span className={"text-sm font-bold tabular-nums min-w-[44px] text-right " + status.color}>
                            {t.ttnt > 15 ? fmtTime(t.time) : t.ttnt + '分'}
                          </span>
                        </div>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full mt-0.5 mx-1 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: barWidth + '%', backgroundColor: barColor }} />
                      </div>
                    </div>
                  );
                }) : <p className="text-gray-400 text-xs py-4 text-center bg-gray-50 rounded-lg">暂无列车</p>}

                {upAll.length > 5 && (
                  <button onClick={() => setExpandedLine(isExpanded ? null : line.line)} className="w-full text-xs text-orange-600 hover:text-orange-700 py-1.5 mt-1 rounded-lg hover:bg-orange-50 transition-colors">
                    {isExpanded ? '收起' : `查看全部 ${upAll.length} 班 ⬆️`}
                  </button>
                )}
              </div>
              {/* Down direction */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600">⬇️ 下行方向</p>
                  <div className="flex gap-2 text-[10px]">
                    {downStats.approaching > 0 && <span className="text-red-500">🚨{downStats.approaching}</span>}
                    {downStats.normal > 0 && <span className="text-blue-400">🚃{downStats.normal}</span>}
                  </div>
                </div>
                {displayDown.length > 0 ? displayDown.map((t, i) => {
                  const status = getTrainStatus(t.ttnt);
                  const barWidth = Math.max(3, Math.min(100, (1 - t.ttnt / 60) * 100));
                  const barColor = t.ttnt <= 1 ? '#ef4444' : t.ttnt <= 3 ? '#f97316' : t.ttnt <= 10 ? '#22c55e' : '#3b82f6';
                  return (
                    <div key={i} className="mb-1.5">
                      <div className={"flex items-center justify-between px-3 py-2 rounded-lg border-l-4 " + (t.valid ? 'bg-gray-50/80 border-gray-200' : 'bg-gray-50/50 opacity-50 border-gray-100')}
                        style={{ borderLeftColor: lc }}>
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-xs">{status.icon}</span>
                          <span className="w-5 h-5 rounded-full bg-white text-gray-700 text-[10px] font-bold flex items-center justify-center border border-gray-200 shadow-sm">{t.plat}</span>
                          <span className="text-sm text-gray-700 font-medium truncate">{t.dest}</span>
                          {t.ttnt <= 1 && (
                            <span className="text-[10px] text-red-500 font-bold animate-pulse">进站中</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[11px] text-gray-400 tabular-nums">{fmtTime(t.time)}</span>
                          <span className={"text-sm font-bold tabular-nums min-w-[44px] text-right " + status.color}>
                            {t.ttnt > 15 ? fmtTime(t.time) : t.ttnt + '分'}
                          </span>
                        </div>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full mt-0.5 mx-1 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: barWidth + '%', backgroundColor: barColor }} />
                      </div>
                    </div>
                  );
                }) : <p className="text-gray-400 text-xs py-4 text-center bg-gray-50 rounded-lg">暂无列车</p>}
                {downAll.length > 5 && (
                  <button onClick={() => setExpandedLine(isExpanded ? null : line.line)} className="w-full text-xs text-orange-600 hover:text-orange-700 py-1.5 mt-1 rounded-lg hover:bg-orange-50 transition-colors">
                    {isExpanded ? '收起' : `查看全部 ${downAll.length} 班 ⬇️`}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Train Status Legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-xs text-gray-500 font-medium mb-2">列车状态图例</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-gray-600">
          <div className="flex items-center gap-1"><span>🚨</span> 即将进站 (≤1分)</div>
          <div className="flex items-center gap-1"><span>⚠️</span> 即将到达 (≤3分)</div>
          <div className="flex items-center gap-1"><span>🔶</span> 接近中 (≤5分)</div>
          <div className="flex items-center gap-1"><span>🟢</span> 行驶中 (≤10分)</div>
          <div className="flex items-center gap-1"><span>🔵</span> 正常 (≤20分)</div>
          <div className="flex items-center gap-1"><span>⏳</span> 尚早 (&gt;20分)</div>
          <div className="flex items-center gap-1"><span>🚀</span> 已离站 (0分)</div>
          <div className="flex items-center gap-1"><span>🚃</span> 班次数</div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
          <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-red-500" /> 即将到站</div>
          <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-orange-500" /> 接近中</div>
          <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-green-500" /> 行驶中</div>
          <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-blue-500" /> 正常</div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-amber-800">{totalUp + totalDown}</p>
            <p className="text-[10px] text-amber-600">总班次</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-800">{station.lines.length}</p>
            <p className="text-[10px] text-amber-600">途经线路</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-800">{Math.round(data.distanceKm * 10) / 10}km</p>
            <p className="text-[10px] text-amber-600">距您位置</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-800">{fmtTime(sysTime)}</p>
            <p className="text-[10px] text-amber-600">数据更新</p>
          </div>
        </div>
      </div>

      <div className="mt-5 text-center">
        <Link href="/" className="text-sm text-orange-600 hover:text-orange-700 font-medium">← 返回首页</Link>
      </div>
    </div>
  );
}
