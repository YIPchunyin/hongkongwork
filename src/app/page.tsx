import WeatherWidget from '@/components/WeatherWidget';
import ExchangeRateWidget from '@/components/ExchangeRateWidget';
import MtrWidget from '@/components/MtrWidget';

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
            <p className="text-sm text-gray-500 mt-0.5">天气 · 汇率 · 交通</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="animate-fade-in-up-d1 card-hover"><WeatherWidget /></div>
            <div className="animate-fade-in-up-d2 card-hover"><ExchangeRateWidget /></div>
            <div className="animate-fade-in-up-d3 card-hover"><MtrWidget /></div>
          </div>
        </div>
      </section>
    </div>
  );
}
