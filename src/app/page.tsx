import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';
import ExchangeRateWidget from '@/components/ExchangeRateWidget';
import MtrWidget from '@/components/MtrWidget';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Dashboard */}
      <section className="px-4 pt-6 pb-4">
        <div className="max-w-6xl mx-auto">
          {/* Header with sparkle */}
          <div className="mb-5 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-sparkle" />
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-sparkle-d1" />
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-sparkle-d2" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 ml-2 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                随手HK
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">天气 · 汇率 · 交通 · 工具</p>
          </div>

          {/* Main dashboard cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="animate-fade-in-up-d1 card-hover"><WeatherWidget /></div>
            <div className="animate-fade-in-up-d2 card-hover"><ExchangeRateWidget /></div>
            <div className="animate-fade-in-up-d3 card-hover"><MtrWidget /></div>
            <div className="animate-fade-in-up-d4 card-hover">
              <Link
                href="/expenses/upload"
                className="block bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group h-full"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-800 group-hover:text-green-600 transition-colors">杂费单</h3>
                <p className="text-xs text-gray-400 mt-0.5">AI 识别金额</p>
                <div className="mt-3 flex items-center gap-1 text-green-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all translate-x-[-8px] group-hover:translate-x-0">
                  <span>立即使用</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>

          {/* Secondary tools row */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="animate-fade-in-up-d4 card-hover">
              <Link
                href="/work"
                className="block bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-xl transition-all group h-full"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-800 group-hover:text-purple-600 transition-colors">上班统计</h3>
                <p className="text-xs text-gray-400 mt-0.5">打卡计时</p>
              </Link>
            </div>

            <div className="animate-fade-in-up-d5 card-hover">
              <Link
                href="/search"
                className="block bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-xl transition-all group h-full"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition-colors">搜索</h3>
                <p className="text-xs text-gray-400 mt-0.5">按标签查找</p>
              </Link>
            </div>

            <div className="animate-fade-in-up-d6 card-hover">
              <Link
                href="/weather"
                className="block bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-xl transition-all group h-full"
              >
                <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">天气详情</h3>
                <p className="text-xs text-gray-400 mt-0.5">完整预报</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery shortcut */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto animate-scale-in">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white overflow-hidden animate-gradient shadow-2xl">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full animate-float-slow" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full animate-spin-slow" />

            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl animate-wiggle-once" style={{ display: 'inline-block' }}>📸</span>
                  <p className="text-blue-100 text-sm font-medium bg-white/20 rounded-full px-3 py-0.5 backdrop-blur">相册</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold mt-1">查看你的图片和视频</p>
                <p className="text-blue-200 text-sm mt-1 opacity-80">浏览、搜索、管理你的媒体文件</p>
              </div>
              <Link
                href="/gallery"
                className="group px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all text-sm flex-shrink-0 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
              >
                <span className="flex items-center gap-2">
                  进入相册
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom decorative wave */}
      <div className="relative h-16 overflow-hidden -mt-8">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 to-transparent" />
      </div>
    </div>
  );
}
