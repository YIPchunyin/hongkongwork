import Link from 'next/link';
import WeatherWidget from '@/components/WeatherWidget';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full opacity-30 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            你的云端
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}记忆库
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
            安全存储图片和视频，智能标签管理，快速搜索你想找的每一刻回忆。
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/upload"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 text-center"
            >
              开始上传
            </Link>
            <Link
              href="/gallery"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-center"
            >
              浏览画廊
            </Link>
          </div>
        </div>
      </section>

      {/* Weather + Tools Bar */}
      <section className="px-4 -mt-8 pb-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Weather Widget - takes 1 column */}
          <div className="lg:col-span-1">
            <WeatherWidget />
          </div>

          {/* Quick Tools */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            <Link
              href="/expenses/upload"
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">杂费单</h3>
              <p className="text-xs text-gray-400 mt-0.5">AI 识别金额</p>
            </Link>

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
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
            核心功能
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">技术架构</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    title: '云端存储',
    description: '基于阿里云 OSS 的可靠存储，支持图片和视频格式，安全无忧。',
    icon: (
      <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    bgColor: 'bg-blue-50',
  },
  {
    title: '智能标签',
    description: '为每张图片和视频添加自定义标签，轻松分类管理你的媒体库。',
    icon: (
      <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    bgColor: 'bg-green-50',
  },
  {
    title: '快速搜索',
    description: '输入标签关键词即可秒级匹配，快速找到你需要的内容。',
    icon: (
      <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    bgColor: 'bg-purple-50',
  },
  {
    title: 'AI 账单识别',
    description: '上传费用单据，AI 自动识别金额和商户，减少手动录入。',
    icon: (
      <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    bgColor: 'bg-green-50',
  },
];

const techStack = [
  'Next.js 16',
  'TypeScript',
  'Tailwind CSS',
  'MongoDB',
  'AI 识别',
  '香港天气',
];
