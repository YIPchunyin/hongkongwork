'use client';

import { useState, useEffect, useMemo } from 'react';

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
  year?: number;
  month?: number | null;
  industryFilter?: string | null;
}

const chartColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

export default function IncomeCharts({ incomes, stats, year, month, industryFilter }: IncomeChartsProps) {
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

  // 半月结算汇总：上半月 1-15 号 / 下半月 16-月底
  // 地盘中只有「国益」这家公司是半个月结一次（益哥不是），所以只统计国益的记录。
  // 国益只出现在地盘，因此筛选「酒楼/补贴」时这张表没有意义，直接隐藏。
  const halfMonth = useMemo(() => {
    if (!month || !year) return null;
    if (industryFilter && industryFilter !== '地盘') return null;
    const daysInMonth = new Date(year, month, 0).getDate();
    const HALF_END = 15;

    type Bucket = { income: number; hours: number; days: Set<string>; count: number };
    const makeBucket = (): Bucket => ({ income: 0, hours: 0, days: new Set<string>(), count: 0 });

    const first = makeBucket();
    const second = makeBucket();

    incomes.forEach((i) => {
      if (i.company !== '国益') return;
      const dayKey = i.date?.substring(0, 10);
      if (!dayKey) return;
      const dayNum = parseInt(dayKey.substring(8, 10), 10);
      if (!Number.isFinite(dayNum)) return;
      const bucket = dayNum <= HALF_END ? first : second;
      bucket.income += i.amount || 0;
      bucket.hours += i.hours || 0;
      bucket.days.add(dayKey);
      bucket.count += 1;
    });

    const summarize = (b: Bucket) => ({
      income: b.income,
      hours: b.hours,
      days: b.days.size,
      count: b.count,
    });

    return {
      daysInMonth,
      halves: [
        { key: 'first', label: '上半月', range: `1 – ${HALF_END}`, tone: '#10B981', ...summarize(first) },
        { key: 'second', label: '下半月', range: `${HALF_END + 1} – ${daysInMonth}`, tone: '#3B7DD8', ...summarize(second) },
      ],
      // 两个半月按日期天然不重叠，天数直接相加即可
      total: {
        income: first.income + second.income,
        hours: first.hours + second.hours,
        days: first.days.size + second.days.size,
        count: first.count + second.count,
      },
    };
  }, [incomes, year, month]);

  // 派生指标：公司时薪对比 / 班次分布 / 日薪稳定度
  const insights = useMemo(() => {
    type ComAgg = { income: number; hours: number; days: Set<string>; count: number };
    type ShiftAgg = { income: number; hours: number; count: number };

    const companies = new Map<string, ComAgg>();
    const shifts = new Map<string, ShiftAgg>();
    const dayTotals = new Map<string, number>();

    incomes.forEach((i) => {
      const day = i.date?.substring(0, 10) || '';
      const amount = i.amount || 0;
      const hours = i.hours || 0;

      const comName = i.company || '未填公司';
      let com = companies.get(comName);
      if (!com) {
        com = { income: 0, hours: 0, days: new Set<string>(), count: 0 };
        companies.set(comName, com);
      }
      com.income += amount;
      com.hours += hours;
      com.count += 1;
      if (day) com.days.add(day);

      const shiftName = i.shift || '未填班次';
      let shift = shifts.get(shiftName);
      if (!shift) {
        shift = { income: 0, hours: 0, count: 0 };
        shifts.set(shiftName, shift);
      }
      shift.income += amount;
      shift.hours += hours;
      shift.count += 1;

      if (day) dayTotals.set(day, (dayTotals.get(day) || 0) + amount);
    });

    const companyRows = [...companies.entries()]
      .map(([name, v]) => ({
        name,
        income: v.income,
        hours: v.hours,
        days: v.days.size,
        count: v.count,
        hourly: v.hours > 0 ? v.income / v.hours : 0,
        daily: v.days.size > 0 ? v.income / v.days.size : 0,
      }))
      .sort((a, b) => b.income - a.income);

    const shiftRows = [...shifts.entries()]
      .map(([name, v]) => ({
        name,
        income: v.income,
        hours: v.hours,
        count: v.count,
        avg: v.count > 0 ? v.income / v.count : 0,
      }))
      .sort((a, b) => b.income - a.income);

    // 日薪：按自然日汇总后的每日总收入
    const dayValues = [...dayTotals.values()];
    const dailyAvg = dayValues.length > 0 ? dayValues.reduce((a, b) => a + b, 0) / dayValues.length : 0;
    const dailyMax = dayValues.length > 0 ? Math.max(...dayValues) : 0;
    const sortedDayValues = [...dayValues].sort((a, b) => a - b);
    const dailyMedian =
      sortedDayValues.length === 0
        ? 0
        : sortedDayValues.length % 2 === 1
          ? sortedDayValues[(sortedDayValues.length - 1) / 2]
          : (sortedDayValues[sortedDayValues.length / 2 - 1] + sortedDayValues[sortedDayValues.length / 2]) / 2;

    const bucketDefs = [
      { label: '< 600', test: (v: number) => v < 600 },
      { label: '600–800', test: (v: number) => v >= 600 && v < 800 },
      { label: '800–1000', test: (v: number) => v >= 800 && v < 1000 },
      { label: '1000–1200', test: (v: number) => v >= 1000 && v < 1200 },
      { label: '≥ 1200', test: (v: number) => v >= 1200 },
    ];
    const buckets = bucketDefs.map((b) => ({ label: b.label, count: dayValues.filter(b.test).length }));
    const maxBucket = buckets.reduce((m, b) => Math.max(m, b.count), 0);

    return { companyRows, shiftRows, dayCount: dayValues.length, dailyAvg, dailyMedian, dailyMax, buckets, maxBucket };
  }, [incomes]);

  // 当月累计收入走势（仅月视图有意义）
  const cumulative = useMemo(() => {
    if (!month || !year) return null;
    const daysInMonth = new Date(year, month, 0).getDate();
    const perDay: number[] = new Array(daysInMonth).fill(0);

    incomes.forEach((i) => {
      const day = i.date?.substring(0, 10);
      if (!day) return;
      const dayNum = parseInt(day.substring(8, 10), 10);
      if (Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= daysInMonth) {
        perDay[dayNum - 1] += i.amount || 0;
      }
    });

    const labels: string[] = [];
    const data: number[] = [];
    let acc = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      acc += perDay[d - 1];
      labels.push(String(d));
      data.push(Math.round(acc));
    }

    return { labels, data, total: acc };
  }, [incomes, year, month]);

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

  const { Bar, Doughnut, Line } = ChartComponents;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 w-full max-w-full">
      {/* Half-month Settlement */}
      {halfMonth && (
        <div className="rounded-2xl overflow-hidden p-3 sm:p-5 glass-card glass-hover lg:col-span-2">
          <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            🏗️ 国益 半月收入
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              地盘 · 仅国益
            </span>
            <span className="text-[10px] font-normal text-gray-400 ml-auto">半个月一结</span>
          </h3>

          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 tracking-wider">
                <th className="text-left font-medium px-3 py-1.5">时段</th>
                <th className="text-right font-medium px-2 py-1.5">收入</th>
                <th className="text-right font-medium px-2 py-1.5">工时</th>
                <th className="text-right font-medium px-3 py-1.5">天数</th>
              </tr>
            </thead>
            <tbody>
              {halfMonth.halves.map((h) => (
                <tr key={h.key} className="border-t border-gray-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: h.tone }} />
                      <span className="text-sm font-medium text-gray-700">{h.label}</span>
                      <span className="text-[10px] text-gray-400">{h.range} 号</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right text-sm font-bold" style={{ color: '#059669' }}>
                    $ {h.income.toFixed(0)}
                  </td>
                  <td className="px-2 py-2 text-right text-xs text-gray-500">{h.hours.toFixed(1)}h</td>
                  <td className="px-3 py-2 text-right text-xs text-gray-500">{h.days} 天</td>
                </tr>
              ))}
              <tr className="border-t border-gray-100 bg-gray-50/70">
                <td className="px-3 py-2">
                  <span className="text-xs font-semibold text-gray-500">合计</span>
                  <span className="text-[10px] text-gray-400 ml-1">整月 {halfMonth.daysInMonth} 天</span>
                </td>
                <td className="px-2 py-2 text-right text-sm font-black text-gray-800">
                  $ {halfMonth.total.income.toFixed(0)}
                </td>
                <td className="px-2 py-2 text-right text-xs font-semibold text-gray-600">
                  {halfMonth.total.hours.toFixed(1)}h
                </td>
                <td className="px-3 py-2 text-right text-xs font-semibold text-gray-600">
                  {halfMonth.total.days} 天
                </td>
              </tr>
            </tbody>
          </table>

          {/* 上下半月收入占比条 */}
          {halfMonth.total.income > 0 && (
            <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 mt-3">
              <div
                style={{
                  width: (halfMonth.halves[0].income / halfMonth.total.income) * 100 + '%',
                  backgroundColor: halfMonth.halves[0].tone,
                }}
              />
              <div
                style={{
                  width: (halfMonth.halves[1].income / halfMonth.total.income) * 100 + '%',
                  backgroundColor: halfMonth.halves[1].tone,
                }}
              />
            </div>
          )}
        </div>
      )}

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

      {/* Company Hourly Rate Comparison */}
      {insights.companyRows.length > 0 && (
        <div className="rounded-2xl overflow-hidden p-4 sm:p-5 glass-card glass-hover">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">💼 公司时薪对比</h3>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-400 tracking-wider">
                <th className="text-left font-medium py-1">公司</th>
                <th className="text-right font-medium py-1">工时</th>
                <th className="text-right font-medium py-1">收入</th>
                <th className="text-right font-medium py-1">时薪</th>
                <th className="text-right font-medium py-1">日均</th>
              </tr>
            </thead>
            <tbody>
              {insights.companyRows.map((c, i) => (
                <tr key={c.name} className="border-t border-gray-50">
                  <td className="py-1.5 pr-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                      <span className="text-xs text-gray-700">{c.name}</span>
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-xs text-gray-500">{c.hours.toFixed(0)}h</td>
                  <td className="py-1.5 text-right text-xs font-medium text-gray-700">{c.income.toFixed(0)}</td>
                  <td className="py-1.5 text-right text-xs font-bold text-emerald-600">
                    {c.hourly > 0 ? 'HK$' + c.hourly.toFixed(0) : '—'}
                  </td>
                  <td className="py-1.5 text-right text-xs text-gray-500">
                    {c.daily > 0 ? 'HK$' + c.daily.toFixed(0) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-400 mt-2">时薪 = 收入 ÷ 工时；日均 = 收入 ÷ 出勤天数</p>
        </div>
      )}

      {/* Shift Breakdown */}
      {insights.shiftRows.length > 0 && (
        <div className="rounded-2xl overflow-hidden p-4 sm:p-5 glass-card glass-hover">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🕐 班次分布</h3>
          <div className="space-y-2.5">
            {(() => {
              const total = insights.shiftRows.reduce((sum, r) => sum + r.income, 0);
              return insights.shiftRows.map((s, i) => {
                const pct = total > 0 ? (s.income / total) * 100 : 0;
                return (
                  <div key={s.name}>
                    <div className="flex justify-between items-baseline text-sm mb-1">
                      <span className="text-gray-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                        {s.name}
                        <span className="text-[10px] text-gray-400">{s.count} 次</span>
                      </span>
                      <span className="font-medium text-gray-800">
                        HK$ {s.income.toFixed(0)}
                        <span className="text-[10px] text-gray-400 ml-1">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: pct.toFixed(1) + '%', backgroundColor: chartColors[i % chartColors.length] }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>平均每次 HK$ {s.avg.toFixed(0)}</span>
                      <span>{s.hours.toFixed(0)}h</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Daily Pay Stability */}
      <div className="rounded-2xl overflow-hidden p-4 sm:p-5 glass-card glass-hover">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">💰 日薪稳定度</h3>
        {insights.dayCount > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-xl px-2 py-2 bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-[10px] text-emerald-600 font-medium">平均日薪</p>
                <p className="text-sm font-bold text-emerald-700">{insights.dailyAvg.toFixed(0)}</p>
              </div>
              <div className="rounded-xl px-2 py-2 bg-blue-50 border border-blue-100 text-center">
                <p className="text-[10px] text-blue-600 font-medium">中位数</p>
                <p className="text-sm font-bold text-blue-700">{insights.dailyMedian.toFixed(0)}</p>
              </div>
              <div className="rounded-xl px-2 py-2 bg-amber-50 border border-amber-100 text-center">
                <p className="text-[10px] text-amber-600 font-medium">最高单日</p>
                <p className="text-sm font-bold text-amber-700">{insights.dailyMax.toFixed(0)}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {insights.buckets.map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-16 flex-shrink-0 text-right">{b.label}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                      style={{ width: (insights.maxBucket > 0 ? (b.count / insights.maxBucket) * 100 : 0) + '%' }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 w-8 flex-shrink-0">{b.count}天</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">共 {insights.dayCount} 个出勤日，按每日总收入区间统计</p>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
        )}
      </div>

      {/* Cumulative Income This Month */}
      {cumulative && (
        <div className="rounded-2xl overflow-hidden p-3 sm:p-5 glass-card glass-hover lg:col-span-2">
          <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            📈 当月累计收入走势
            <span className="text-[10px] font-normal text-gray-400 ml-auto">
              累计 HK$ {cumulative.total.toFixed(0)}
            </span>
          </h3>
          <Line
            data={{
              labels: cumulative.labels,
              datasets: [
                {
                  label: '累计收入 (HK$)',
                  data: cumulative.data,
                  borderColor: '#6366F1',
                  backgroundColor: 'rgba(99,102,241,0.12)',
                  fill: true,
                  borderWidth: 2,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  tension: 0.25,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { callback: (v: any) => 'HK$' + v } },
                x: { ticks: { maxTicksLimit: 12 } },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
