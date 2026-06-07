import dynamic from 'next/dynamic';

const WeatherWidget = dynamic(() => import('@/components/WeatherWidget'), { 
  loading: () => <SkeletonCard icon="🌤️" label="天气" />});
const ExchangeRateWidget = dynamic(() => import('@/components/ExchangeRateWidget'), { 
  loading: () => <SkeletonCard icon="💱" label="汇率" />});
const MtrWidget = dynamic(() => import('@/components/MtrWidget'), { 
  loading: () => <SkeletonCard icon="🚇" label="地铁" />});

function SkeletonCard({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-xl mb-3 flex items-center justify-center text-2xl">{icon}</div>
      <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
      <div className="h-8 bg-gray-100 rounded w-32" />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <section className="px-4 pt-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-5 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-sparkle" />
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-sparkle-d1" />
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-sparkle-d2" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 ml-2 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
                随手HK
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">天气 · 交通 · 汇率</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="animate-fade-in-up-d1 card-hover"><WeatherWidget /></div>\n            <div className="animate-fade-in-up-d2 card-hover"><MtrWidget /></div>\n            <div className="animate-fade-in-up-d3 card-hover"><ExchangeRateWidget /></div>
          </div>
        </div>
      </section>
    </div>
  );
}



