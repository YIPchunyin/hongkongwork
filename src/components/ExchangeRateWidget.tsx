'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ExchangeRateData {
  hkdToCny: number;
  updateTime: string;
  source: string;
}

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

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const t = setInterval(fetchRate, 300000);
    return () => clearInterval(t);
  }, [fetchRate]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg animate-pulse cursor-pointer" onClick={() => router.push('/exchange-rate')}>
        <div className="h-5 w-28 bg-white/20 rounded mb-3" />
        <div className="h-8 w-36 bg-white/20 rounded mb-2" />
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
    );
  }

  if (!rate) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => router.push('/exchange-rate')}>
        <p className="text-emerald-100 text-sm font-medium">💱 港币兑人民币</p>
        <p className="text-white/60 text-sm mt-2">暂无法获取汇率</p>
      </div>
    );
  }

  const cny100 = (100 * rate.hkdToCny).toFixed(2);

  return (
    <div
      className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
      onClick={() => router.push('/exchange-rate')}
    >
      <p className="text-emerald-100 text-xs font-medium mb-1">💱 港币兑人民币</p>
      <p className="text-2xl sm:text-3xl font-bold mt-1">
        HK = <span className="text-yellow-200">¥{cny100}</span>
      </p>
      <p className="text-emerald-200 text-xs mt-1">
        1 HKD = {rate.hkdToCny.toFixed(4)} CNY
      </p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-emerald-200 text-[10px]">更新 {rate.updateTime}</p>
        <span className="text-emerald-200 text-xs group-hover:text-white transition-colors">查看走势 →</span>
      </div>
    </div>
  );
}
