'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

interface SavedRoute {
  route: string;
  bound: string;
  stopId: string;
  stopName: string;
  destTc: string;
  origTc: string;
}

export default function BusWidget() {
  const { t } = useTranslation();
  const router = useRouter();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('busFavorites');
      if (saved) setSavedRoutes(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  const handleClick = () => {
    router.push('/bus');
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg animate-pulse cursor-pointer" onClick={handleClick}>
        <div className="h-5 w-24 bg-white/20 rounded mb-3" />
        <div className="h-8 w-32 bg-white/20 rounded mb-2" />
      </div>
    );
  }

  return (
    <div
      className="relative bg-gradient-to-br from-sky-500 via-blue-500 to-blue-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg card-hover cursor-pointer overflow-hidden group"
      onClick={handleClick}
    >
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-sky-400/10 rounded-full animate-float pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-blue-400/10 rounded-full animate-float-slow pointer-events-none" style={{ animationDelay: '1.5s' }} />

      <div className="relative">
        <p className="text-sky-100 text-sm font-medium">🚌 {t('bus.title')}</p>

        {savedRoutes.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {savedRoutes.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-white/15 backdrop-blur rounded-lg px-2.5 py-1.5 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold bg-white/20 rounded px-1.5 py-0.5">{r.route}</span>
                  <span className="text-xs truncate max-w-[100px]">{r.destTc}</span>
                </div>
                <span className="text-[10px] text-sky-200">{r.stopName}</span>
              </div>
            ))}
            {savedRoutes.length > 3 && (
              <p className="text-sky-200 text-[10px] text-center">+{savedRoutes.length - 3}  {t('common.more')}</p>
            )}
          </div>
        ) : (
          <div className="mt-3 text-center">
            <p className="text-3xl mb-1">🚌</p>
            <p className="text-sky-100 text-xs">{t('bus.addFavorite')}</p>
            <p className="text-sky-200 text-[10px] mt-0.5">{t('bus.arrivalTime')}</p>
          </div>
        )}

        <div className="mt-2 flex justify-end">
          <span className="text-sky-200 text-xs group-hover:text-white transition-colors flex items-center gap-1">
            {t('home.viewDetails')}
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
