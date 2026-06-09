'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

interface ExchangeRateData { hkdToCny: number; updateTime: string; source: string; }

export default function ExchangeRateWidget() {
  const { t } = useTranslation();
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
      <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg animate-pulse cursor-pointer" onClick={() => router.push('/exchange-rate')}>
        <div className="h-5 w-28 bg-white/20 rounded mb-3" />
        <div className="h-8 w-36 bg-white/20 rounded mb-2" />
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
    );
  }

  if (!rate) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg card-hover" onClick={() => router.push('/exchange-rate')}>
        <p className="text-emerald-100 text-sm font-medium">💱 {t('home.exchangeRate')}</p>
        <p className="text-white/60 text-sm mt-2">{t('home.noData')}</p>
      </div>
    );
  }

  const cny100 = (100 * rate.hkdToCny).toFixed(2);

  return (
    <div
      className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg card-hover cursor-pointer overflow-hidden group"
      onClick={() => router.push('/exchange-rate')}
    >
      {/* Decorative */}
      <div className="absolute -top-8 left-1/2 w-24 h-24 bg-emerald-300/10 rounded-full animate-float pointer-events-none" />
      <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-emerald-300/10 rounded-full animate-float-slow pointer-events-none" style={{ animationDelay: '1.5s' }} />

      <div className="relative">
        <p className="text-emerald-100 text-xs font-medium mb-1">💱 {t('home.exchangeRate')}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-lg sm:text-xl font-bold">HK$100</span>
          <span className="text-base text-emerald-200 font-medium">=</span>
          <span className="text-lg sm:text-xl font-bold">¥<span className="text-yellow-200 inline-block animate-bounce-in">{cny100}</span></span>
</div>
        <div className="flex items-baseline gap-3 mt-1">
          <p className="text-emerald-200 text-xs">1 HKD = {rate.hkdToCny.toFixed(4)} CNY</p>
          <span className="w-1 h-1 rounded-full bg-emerald-300/50 animate-sparkle" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-emerald-200 text-[10px]">{t('home.updatedAt')} {rate.updateTime}</p>
          <span className="text-emerald-200 text-xs group-hover:text-white transition-colors flex items-center gap-1">
            {t('home.viewTrend')}
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}



