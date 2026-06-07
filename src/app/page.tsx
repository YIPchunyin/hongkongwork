import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';
import ExchangeRateWidget from '@/components/ExchangeRateWidget';
import MtrWidget from '@/components/MtrWidget';
import LogoIcon from '@/components/LogoIcon';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Dashboard */}
      <section className="px-4 pt-6 pb-4">
        <div className="max-w-6xl mx-auto">
          {/* Apple-style header */}
          <div className="mb-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-1">
              <div className="relative">
                <LogoIcon size={36} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#007AFF] rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 apple-text-primary">
                  随手HK
                </h1>
                <p className="text-sm apple-text-secondary mt-0.5">天气 · 汇率 · 交通 · 收入</p>
              </div>
            </div>
          </div>

          {/* Main dashboard cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="animate-fade-in-up-d1 card-hover"><WeatherWidget /></div>
            <div className="animate-fade-in-up-d2 card-hover"><ExchangeRateWidget /></div>
            <div className="animate-fade-in-up-d3 card-hover"><MtrWidget /></div>
            <div className="animate-fade-in-up-d4 card-hover">
              <Link
                href="/expenses/upload"
                className="block apple-card p-5 sm:p-6 group h-full relative overflow-hidden"
              >
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-green-200/40 to-emerald-200/40 rounded-full blur-xl" />
                <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg relative">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold apple-text-primary group-hover:text-green-600 transition-colors relative">杂费单</h3>
                <p className="text-xs apple-text-secondary mt-0.5 relative">AI 识别金额</p>
                <div className="mt-3 flex items-center gap-1 text-green-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all translate-x-[-8px] group-hover:translate-x-0 relative">
                  <span>立即使用</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
              </Link>
            </div>
          </div>

          {/* Secondary tools row */}
          <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-3 sm:gap-4">
            <div className="animate-fade-in-up-d4 card-hover">
              <Link
                href="/work"
                className="block apple-card p-4 sm:p-5 group h-full relative overflow-hidden"
              >
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-purple-200/40 to-purple-300/40 rounded-full blur-xl" />
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-md relative">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold apple-text-primary group-hover:text-purple-600 transition-colors relative">上班统计</h3>
                <p className="text-xs apple-text-secondary mt-0.5 relative">打卡计时</p>
              </Link>
            </div>

            <div className="animate-fade-in-up-d5 card-hover">
              <Link
                href="/search"
                className="block apple-card p-4 sm:p-5 group h-full relative overflow-hidden"
              >
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-orange-200/40 to-orange-300/40 rounded-full blur-xl" />
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md relative">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold apple-text-primary group-hover:text-orange-600 transition-colors relative">搜索</h3>
                <p className="text-xs apple-text-secondary mt-0.5 relative">按标签查找</p>
              </Link>
            </div>

            <div className="animate-fade-in-up-d6 card-hover">
              <Link
                href="/weather"
                className="block apple-card p-4 sm:p-5 group h-full relative overflow-hidden"
              >
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-blue-200/40 to-blue-300/40 rounded-full blur-xl" />
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-md relative">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold apple-text-primary group-hover:text-blue-600 transition-colors relative">天气详情</h3>
                <p className="text-xs apple-text-secondary mt-0.5 relative">完整预报</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery shortcut - Apple style banner */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto animate-scale-in">
          <div className="relative bg-gradient-to-r from-[#007AFF] via-[#5856D6] to-[#AF52DE] rounded-2xl p-6 sm:p-8 text-white overflow-hidden animate-gradient shadow-xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full animate-float-slow" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full animate-spin-slow" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl animate-wiggle-once" style={{ display: 'inline-block' }}>📸</span>
                  <p className="text-white/90 text-sm font-medium bg-white/20 backdrop-blur-md rounded-full px-3 py-0.5 border border-white/10">画廊</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">浏览你的珍藏</p>
                <p className="text-white/80 text-sm mt-1">图片、视频、回忆</p>
              </div>
              <Link href="/gallery"
                className="group px-6 py-3 bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl hover:bg-white/30 transition-all text-sm flex-shrink-0 border border-white/20 shadow-lg active:scale-95"
              >
                <span className="flex items-center gap-2">
                  进入
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative bottom */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent" />
      </div>
    </div>
  );
}
