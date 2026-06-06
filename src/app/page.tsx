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
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">首页</h1>
            <p className="text-sm text-gray-500 mt-0.5">天气 · 汇率 · 交通 · 工具</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <WeatherWidget />
            <ExchangeRateWidget />
            <MtrWidget />
            <Link
              href="/expenses/upload"
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group flex flex-col justify-center"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">杂费单</h3>
              <p className="text-xs text-gray-400 mt-0.5">AI 识别金额</p>
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <Link
              href="/work"
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">上班统计</h3>
              <p className="text-xs text-gray-400 mt-0.5">打卡计时</p>
            </Link>

            <Link
              href="/search"
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">搜索</h3>
              <p className="text-xs text-gray-400 mt-0.5">按标签查找</p>
            </Link>

            <Link
              href="/weather"
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">天气详情</h3>
              <p className="text-xs text-gray-400 mt-0.5">完整预报</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery shortcut */}
      <section className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">📸 相册</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">查看你的图片和视频</p>
                <p className="text-blue-200 text-sm mt-1">浏览、搜索、管理你的媒体文件</p>
              </div>
              <Link
                href="/gallery"
                className="px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm flex-shrink-0"
              >
                进入相册
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
