'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ExchangeRateData { hkdToCny: number; updateTime: string; source: string; }

export default function ExchangeRateWidget() {
  const router = useRouter();
  const [rate, setRate] = useState<ExchangeRateData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRate = useCallback(async () => {
    try {
      const res = await fetch('/api/exchange-rate');
      const json = await res.json();
      if (json.success) setRate(json.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRate(); }, [fetchRate]);
  useEffect(() => { const t = setInterval(fetchRate, 300000); return () => clearInterval(t); }, [fetchRate]);

  if (loading) {
    return (
      <div className="apple-card p-5 sm:p-6 h-full animate-pulse">
        <div className="h-4 w-28 bg-gray-200 rounded mb-3" />
        <div className="h-8 w-36 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!rate) {
    return (
      <div className="apple-card p-5 sm:p-6 h-full group cursor-pointer" onClick={() => router.push('/exchange-rate')}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold apple-text-primary">港币兑人民币</p>
        </div>
        <p className="text-xs apple-text-secondary">暂无法获取汇率</p>
      </div>
    );
  }

  const cny100 = (100 * rate.hkdToCny).toFixed(2);

  return (
    <div
      className="apple-card p-5 sm:p-6 h-full group cursor-pointer relative overflow-hidden"
      onClick={() => router.push('/exchange-rate')}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />

      {/* Decorative green orb */}
      <div className="absolute -top-8 -right-8 w-28 h-28 bg-emerald-50/80 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold apple-text-primary">港币兑人民币</p>
        </div>

        <div className="flex flex-col items-center py-2">
          <div className="flex flex-col items-center space-y-1">
            <span className="text-xl sm:text-2xl font-bold apple-text-primary tracking-tight">HK</span>
            <div className="w-8 h-px bg-gray-200" />
            <span className="text-base sm:text-lg apple-text-secondary font-medium">=</span>
            <div className="w-8 h-px bg-gray-200" />
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 tracking-tight">¥<span className="inline-block animate-bounce-in">{cny100}</span></span>
          </div>
          <p className="text-xs apple-text-secondary mt-2">1 HKD = {rate.hkdToCny.toFixed(4)} CNY</p>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] apple-text-secondary">更新 {rate.updateTime}</p>
          <span className="text-xs text-emerald-500 font-medium opacity-0 group-hover:opacity-100 transition-all flex items-center gap-0.5">
            走势
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
