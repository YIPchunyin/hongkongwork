'use client';

import { useState, useEffect } from 'react';

interface IncomeItem {
  _id: string;
  date: string;
  amount: number;
  note: string;
  shift: string;
  hours: number;
  industry: string;
  company: string;
}

interface Stats {
  totalIncome: number;
  totalHours: number;
  totalRecords: number;
  industries: string[];
  companies: string[];
  industryTotals: Record<string, number>;
  companyTotals: Record<string, number>;
  shiftTotals: Record<string, number>;
  categoryTotals: Record<string, number>;
  monthlyTotals: Record<string, number>;
}

interface IncomeChartsProps {
  incomes: IncomeItem[];
  stats: Stats;
}

const chartColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

export default function IncomeCharts({ incomes, stats }: IncomeChartsProps) {
  const [ChartComponents, setChartComponents] = useState<{
    Bar: typeof import("react-chartjs-2").Bar;
    Doughnut: typeof import("react-chartjs-2").Doughnut;
    Line: typeof import("react-chartjs-2").Line;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadCharts() {
      const { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } = await import("chart.js");
      Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);
      const { Bar, Doughnut, Line } = await import("react-chartjs-2");
      setChartComponents({ Bar, Doughnut, Line });
      setLoaded(true);
    }
    loadCharts();
  }, []);

  if (!loaded || !ChartComponents) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 w-full max-w-full">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden p-4 sm:p-5 bg-white border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { Bar, Doughnut } = ChartComponents;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 w-full max-w-full">
      {/* Monthly Trend */}
      {Object.keys(stats.monthlyTotals).length > 1 && (
        <div className="rounded-2xl overflow-hidden p-3 sm:p-5 glass-card glass-hover">
          <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            📈 月度收入趋势
          </h3>
          <Bar data={{
            labels: Object.keys(stats.monthlyTotals).sort(),
            datasets: [{ label: "收入 (HK$)", data: Object.keys(stats.monthlyTotals).sort().map(m => stats.monthlyTotals[m]), backgroundColor: "#10B98133", borderColor: "#10B981", borderWidth: 2, borderRadius: 4 }]
          }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => "HK$" + v } } } }} />
        </div>
      )}

      {/* Industry Distribution */}
      <div className="rounded-2xl overflow-hidden p-4 sm:p-5 glass-card glass-hover">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">🏭 行业分布</h3>
        {Object.keys(stats.industryTotals).length > 0 && (
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 flex-shrink-0">
              <Doughnut data={{
                labels: Object.keys(stats.industryTotals),
                datasets: [{ data: Object.values(stats.industryTotals), backgroundColor: chartColors.slice(0, Object.keys(stats.industryTotals).length), borderWidth: 0 }]
              }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
            <div className="flex-1 space-y-2">
              {Object.entries(stats.industryTotals).sort((a: any, b: any) => b[1] - a[1]).map(([ind, total], i) => (
                <div key={ind} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                    <span className="text-gray-600">{ind}</span>
                  </div>
                  <span className="font-medium text-gray-800">HK$ {Number(total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Company Breakdown */}
      <div className="rounded-2xl overflow-hidden p-4 sm:p-5 glass-card glass-hover">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">🏢 公司收入</h3>
        {Object.keys(stats.companyTotals).sort().map((com, i) => {
          const amt = stats.companyTotals[com];
          const pct = stats.totalIncome > 0 ? (amt / stats.totalIncome * 100) : 0;
          return (
            <div key={com} className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{com}</span>
                <span className="font-medium">HK$ {amt.toFixed(2)} ({pct.toFixed(1)}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: pct.toFixed(1) + "%", backgroundColor: chartColors[i % chartColors.length] }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hourly Rate Trend */}
      <div className="rounded-2xl overflow-hidden p-4 sm:p-5 glass-card glass-hover">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">💵 时薪走势</h3>
        {(function() {
          const dailyRates: Record<string, { income: number; hours: number }> = {};
          incomes.filter((i) => i.hours > 0).forEach((i) => {
            const day = i.date?.substring(0, 10);
            if (!day) return;
            if (!dailyRates[day]) dailyRates[day] = { income: 0, hours: 0 };
            dailyRates[day].income += i.amount;
            dailyRates[day].hours += i.hours;
          });
          const sortedDays = Object.keys(dailyRates).sort();
          const rates = sortedDays.map(d => dailyRates[d].hours > 0 ? (dailyRates[d].income / dailyRates[d].hours) : 0);
          const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
          return (
            <div>
              <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                <span>平均时薪: <span className="font-bold text-blue-600">HK$ {avgRate.toFixed(2)}</span></span>
                <span className="w-px h-3 bg-gray-200" />
                <span>共 {sortedDays.length} 个工作日</span>
              </div>
              {sortedDays.length > 0 ? (
                <Bar data={{
                  labels: sortedDays.map(d => d.substring(5)),
                  datasets: [{
                    label: "时薪 (HK$)",
                    data: rates.map(r => Number(r.toFixed(2))),
                    backgroundColor: rates.map(r => r >= avgRate ? "#3B82F633" : "#EF444433"),
                    borderColor: rates.map(r => r >= avgRate ? "#3B82F6" : "#EF4444"),
                    borderWidth: 1.5,
                    borderRadius: 3,
                  }]
                }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => "HK$" + v } } } }} />
              ) : <p className="text-sm text-gray-400 text-center py-4">暂无工时数据</p>}
            </div>
          );
        })()}
      </div>

      {/* Weekday Analysis */}
      <div className="rounded-2xl overflow-hidden p-4 sm:p-5 glass-card glass-hover">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📅 星期分布</h3>
        {(function() {
          const weekdayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
          const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
          const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
          incomes.forEach((i) => {
            if (!i.date) return;
            const d = new Date(i.date);
            const wd = d.getDay();
            weekdayTotals[wd] += i.amount;
            weekdayCounts[wd]++;
          });
          return (
            <div>
              <Bar data={{
                labels: weekdayNames,
                datasets: [{
                  label: "收入 (HK$)",
                  data: weekdayTotals,
                  backgroundColor: ["#EF444433","#F59E0B33","#10B98133","#3B82F633","#8B5CF633","#EC489933","#EF444433"],
                  borderColor: ["#EF4444","#F59E0B","#10B981","#3B82F6","#8B5CF6","#EC4899","#EF4444"],
                  borderWidth: 2,
                  borderRadius: 4,
                }]
              }} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => "HK$ " + ctx.raw + " (" + weekdayCounts[ctx.dataIndex] + "次)" } } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => "HK$" + v } } } }} />
            </div>
          );
        })()}
      </div>

      {/* Top Paying Days */}
      <div className="rounded-2xl overflow-hidden p-4 sm:p-5 glass-card glass-hover">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">最高收入日</h3>
        {(function() {
          const dayTotals: Record<string, { amount: number; count: number; companies: string[] }> = {};
          incomes.forEach((i) => {
            const day = i.date?.substring(0, 10);
            if (!day) return;
            if (!dayTotals[day]) dayTotals[day] = { amount: 0, count: 0, companies: [] };
            dayTotals[day].amount += i.amount;
            dayTotals[day].count++;
            if (i.company && !dayTotals[day].companies.includes(i.company)) dayTotals[day].companies.push(i.company);
          });
          const topDays = Object.entries(dayTotals).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5);
          return (
            <div className="space-y-2">
              {topDays.map(([day, data], i) => (
                <div key={day} className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100/50">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-amber-600 w-5 text-center">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{day}</p>
                      <p className="text-xs text-gray-400">{data.count} 笔 · {data.companies.join(" ")}</p>
                    </div>
                  </div>
                  <span className="text-base font-bold text-amber-700">HK$ {data.amount.toFixed(0)}</span>
                </div>
              ))}
              {topDays.length === 0 && <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
