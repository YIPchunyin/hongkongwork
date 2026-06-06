'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface HistoryPoint {
  date: string;
  rate: number;
}

interface Stats {
  min: number;
  max: number;
  avg: number;
  change: number;
  changePercent: number;
}

interface HistoryData {
  history: HistoryPoint[];
  current: number;
  stats: Stats;
  period: string;
  note?: string;
}

type Period = '1m' | '6m' | '1y';

export default function ExchangeRatePage() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('1m');

  const fetchHistory = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch('/api/exchange-rate/history?period=' + p);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHistory(period); }, [period, fetchHistory]);

  const fmtDate = (d: string) => {
    const parts = d.split('-');
    return parts[1] + '/' + parts[2];
  };

  const periods: { key: Period; label: string }[] = [
    { key: '1m', label: '一个月' },
    { key: '6m', label: '半年' },
    { key: '1y', label: '一年' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">💱 港币兑人民币</h1>
          <p className="text-sm text-gray-500 mt-0.5">HKD / CNY 汇率走势</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回
        </Link>
      </div>

      {/* Current Rate Card */}
      {data && (
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-4">
          <p className="text-emerald-100 text-sm">当前汇率</p>
          <p className="text-4xl sm:text-5xl font-bold mt-1">
            {data.current.toFixed(4)}
          </p>
          <p className="text-emerald-200 text-sm mt-1">1 HKD = {data.current.toFixed(4)} CNY</p>
          <p className="text-2xl font-bold mt-3">
            HK = <span className="text-yellow-200">¥{(100 * data.current).toFixed(2)}</span>
          </p>
        </div>
      )}

      {/* Stats */}
      {data?.stats && data.history.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: '最低', value: data.stats.min.toFixed(4), color: 'text-green-600' },
            { label: '最高', value: data.stats.max.toFixed(4), color: 'text-red-600' },
            { label: '平均', value: data.stats.avg.toFixed(4), color: 'text-blue-600' },
            {
              label: '变动',
              value: (data.stats.change >= 0 ? '+' : '') + data.stats.changePercent.toFixed(2) + '%',
              color: data.stats.change >= 0 ? 'text-green-600' : 'text-red-600',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={'text-lg sm:text-xl font-bold mt-0.5 ' + s.color}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Period Selector */}
      <div className="flex gap-2 mb-4">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={'px-4 py-2 rounded-xl text-sm font-medium transition-all min-h-[44px] ' +
              (period === p.key
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-800 mb-4">汇率走势图</h2>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data?.history && data.history.length > 1 ? (
          <Chart history={data.history} />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
            {data?.note || '暂无足够的历史数据'}
          </div>
        )}
      </div>

      {/* Data source */}
      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 mb-4">
        <p className="text-xs text-amber-700">📡 数据来源：Frankfurter API / exchangerate-api.com · 仅供参考，实际汇率以银行柜台为准</p>
      </div>

      <div className="mt-5 text-center">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">← 返回首页</Link>
      </div>
    </div>
  );
}

function Chart({ history }: { history: HistoryPoint[] }) {
  const w = 700;
  const h = 280;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const rates = history.map(h => h.rate);
  const minR = Math.min(...rates);
  const maxR = Math.max(...rates);
  const range = maxR - minR || 0.01;

  const points = history.map((p, i) => {
    const x = pad.left + (i / (history.length - 1)) * chartW;
    const y = pad.top + chartH - ((p.rate - minR) / range) * chartH;
    return { x, y, date: p.date, rate: p.rate };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

  // Y-axis labels
  const yLabels = 5;
  const yTicks = Array.from({ length: yLabels }, (_, i) => {
    const val = minR + (range * (yLabels - 1 - i)) / (yLabels - 1);
    const y = pad.top + (chartH * i) / (yLabels - 1);
    return { y, label: val.toFixed(4) };
  });

  // X-axis labels (show ~6 labels)
  const xStep = Math.max(1, Math.floor(history.length / 6));
  const xLabels = history.filter((_, i) => i % xStep === 0 || i === history.length - 1);

  const startRate = history[0].rate;
  const endRate = history[history.length - 1].rate;
  const isUp = endRate >= startRate;
  const lineColor = isUp ? '#059669' : '#dc2626';
  const fillColor = isUp ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)';

  const lastPoint = points[points.length - 1];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={"0 0 " + w + " " + h} className="w-full min-w-[500px]" style={{ maxWidth: w + 'px' }}>
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pad.left} y1={t.y} x2={w - pad.right} y2={t.y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={pad.left - 8} y={t.y + 4} textAnchor="end" className="text-[10px]" fill="#9ca3af">{t.label}</text>
          </g>
        ))}

        {/* Area fill */}
        <polygon
          points={polyline + ` ` + points[0].x + `,` + (pad.top + chartH) + ` ` + lastPoint.x + `,` + (pad.top + chartH)}
          fill={fillColor}
        />

        {/* Line */}
        <polyline points={polyline} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points */}
        {points.filter((_, i) => i % Math.max(1, Math.floor(history.length / 20)) === 0 || i === history.length - 1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={lineColor} stroke="white" strokeWidth={1.5} />
        ))}

        {/* Last point highlight */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r={6} fill={lineColor} stroke="white" strokeWidth={2} />

        {/* X-axis labels */}
        {xLabels.map((p, i) => {
          const idx = history.indexOf(p);
          const x = pad.left + (idx / (history.length - 1)) * chartW;
          return (
            <text key={i} x={x} y={h - 10} textAnchor="middle" className="text-[10px]" fill="#9ca3af">
              {fmtDate(p.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function fmtDate(d: string) {
  const parts = d.split('-');
  return parts[1] + '/' + parts[2];
}
