'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface RouteInfo {
  route: string;
  bound: string;
  service_type: string;
  orig_tc: string;
  dest_tc: string;
  orig_en: string;
  dest_en: string;
}

interface StopInfo {
  stop: string;
  bound: string;
  seq: number;
  nameTc: string;
  nameEn: string;
  lat: number;
  long: number;
}

interface EtaInfo {
  route: string;
  eta: string;
  eta_seq: number;
  dest_tc: string;
  rmk_tc: string;
  data_timestamp: string;
}

interface SavedRoute {
  route: string;
  bound: string;
  stopId: string;
  stopName: string;
  destTc: string;
  origTc: string;
}

const BOUND_LABELS: Record<string, string> = { '1': '往', '2': '返' };

export default function BusPage() {
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<RouteInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [stops, setStops] = useState<StopInfo[]>([]);
  const [etaMap, setEtaMap] = useState<Record<string, EtaInfo[]>>({});
  const [loadingStops, setLoadingStops] = useState(false);
  const [favRoutes, setFavRoutes] = useState<SavedRoute[]>([]);
  const [showStarred, setShowStarred] = useState(true);
  const searchTimer = useRef<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('busFavorites');
      if (saved) setFavRoutes(JSON.parse(saved));
    } catch {}
  }, []);

  const saveFav = (r: SavedRoute) => {
    const newFav = [...favRoutes.filter(f => !(f.route === r.route && f.stopId === r.stopId)), r];
    setFavRoutes(newFav);
    localStorage.setItem('busFavorites', JSON.stringify(newFav));
  };

  const removeFav = (route: string, stopId: string) => {
    const newFav = favRoutes.filter(f => !(f.route === route && f.stopId === stopId));
    setFavRoutes(newFav);
    localStorage.setItem('busFavorites', JSON.stringify(newFav));
  };

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch('/api/bus?search=' + encodeURIComponent(q));
      const json = await res.json();
      if (json.success) setResults(json.data);
    } catch {}
    setSearching(false);
  }, []);

  const selectRoute = async (r: RouteInfo) => {
    setSelectedRoute(r);
    setLoadingStops(true);
    setStops([]);
    setEtaMap({});
    try {
      const res = await fetch('/api/bus?route=' + r.route + '&bound=' + r.bound);
      const json = await res.json();
      if (json.success) {
        setStops(json.data);
        // Fetch ETA for all visible stops
        const etaPromises = json.data.map(async (s: StopInfo) => {
          try {
            const eRes = await fetch('/api/bus?route=' + r.route + '&bound=' + r.bound + '&stop=' + s.stop);
            const eJson = await eRes.json();
            return { stopId: s.stop, eta: eJson.data || [] };
          } catch { return { stopId: s.stop, eta: [] }; }
        });
        const etaResults = await Promise.all(etaPromises);
        const etaM: Record<string, EtaInfo[]> = {};
        etaResults.forEach((e: any) => { etaM[e.stopId] = e.eta; });
        setEtaMap(etaM);
      }
    } catch {}
    setLoadingStops(false);
  };

  const fmtEta = (eta: string) => {
    if (!eta) return '--';
    const d = new Date(eta);
    const now = new Date();
    const diff = Math.floor((d.getTime() - now.getTime()) / 60000);
    if (diff <= 0) return '即将到站';
    if (diff <= 5) return diff + ' 分';
    return d.toLocaleTimeString('zh-HK', { timeZone: 'Asia/Hong_Kong', hour: '2-digit', minute: '2-digit' });
  };

  const isFav = (route: string, stopId: string) => {
    return favRoutes.some(f => f.route === route && f.stopId === stopId);
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  if (!user) return <div className="text-center py-20 text-gray-500">请先登录</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">🚌 巴士到站</h1>
          <p className="text-xs sm:text-sm text-gray-400">搜索巴士线路，查看实时到站</p>
        </div>
      </div>

      {/* Favorites */}
      {favRoutes.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-700">\u2b50 收藏线路</p>
            <button onClick={() => setShowStarred(!showStarred)} className="text-xs text-gray-400 hover:text-gray-600">
              {showStarred ? '收起 \u25b2' : '展开 \u25bc'}
            </button>
          </div>
          {showStarred && (
            <div className="space-y-2">
              {favRoutes.map((r, i) => (
                <div key={i} className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold bg-amber-500 text-white rounded px-2 py-0.5">{r.route}</span>
                      <div className="text-xs text-gray-600">
                        <p>{r.destTc}</p>
                        <p className="text-gray-400">{r.stopName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setSearch(r.route);
                        doSearch(r.route);
                        setShowStarred(false);
                      }} className="text-xs text-blue-500 hover:text-blue-700">查看</button>
                      <button onClick={() => removeFav(r.route, r.stopId)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => doSearch(e.target.value), 300);
          }}
          placeholder="输入巴士线路号或站点名称..."
          className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />}
      </div>

      {/* Search Results */}
      {results.length > 0 && !selectedRoute && (
        <div className="space-y-2 mb-4">
          {results.map((r, i) => (
            <button key={i} onClick={() => selectRoute(r)}
              className="w-full text-left bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all card-hover">
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-blue-600 min-w-[48px]">{r.route}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.orig_tc} → {r.dest_tc}</p>
                  <p className="text-xs text-gray-400">{BOUND_LABELS[r.bound] || '双向'}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Route Stops / ETA */}
      {!selectedRoute && results.length === 0 && !searching && search && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-2">🚌</p>
          <p className="text-sm">未找到相关巴士线路</p>
        </div>
      )}

      {selectedRoute && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setSelectedRoute(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-blue-600">{selectedRoute.route}</span>
              <span className="text-sm text-gray-600">{selectedRoute.orig_tc} → {selectedRoute.dest_tc}</span>
            </div>
          </div>

          {loadingStops ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400 mt-2">加载站点信息...</p>
            </div>
          ) : (
            <div className="space-y-1">
              {stops.map((s, i) => {
                const etas = etaMap[s.stop] || [];
                const nextEta = etas.filter(e => e.route === selectedRoute.route).slice(0, 2);
                const isFaved = isFav(selectedRoute.route, s.stop);
                return (
                  <div key={s.stop} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col items-center gap-0.5 w-5 flex-shrink-0">
                      <span className="text-[10px] font-bold text-gray-400">{s.seq}</span>
                      <div className="w-2 h-2 rounded-full border-2" style={{ borderColor: i === 0 ? '#10B981' : (i === stops.length - 1 ? '#EF4444' : '#CBD5E1') }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.nameTc}</p>
                      <p className="text-[10px] text-gray-400 truncate">{s.nameEn}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {nextEta.length > 0 ? (
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-600">{fmtEta(nextEta[0].eta)}</p>
                          {nextEta[1] && <p className="text-[10px] text-gray-400">{fmtEta(nextEta[1].eta)}</p>}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">--</span>
                      )}
                      <button onClick={() => {
                        if (isFaved) removeFav(selectedRoute.route, s.stop);
                        else saveFav({
                          route: selectedRoute.route,
                          bound: selectedRoute.bound,
                          stopId: s.stop,
                          stopName: s.nameTc,
                          destTc: selectedRoute.dest_tc,
                          origTc: selectedRoute.orig_tc,
                        });
                      }} className="text-xs p-1">
                        <span className={isFaved ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}>{isFaved ? '\u2b50' : '\u2606'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
