'use client';
import { Suspense } from 'react';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const chartColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

interface IncomeItem {
  _id: string; date: string; amount: number; note: string;
  shift: string; hours: number; industry: string; company: string;
}

interface AnnualStats {
  totalIncome: number; totalHours: number; totalRecords: number;
  workDays: number; restDays: number; totalDays: number; workRate: number;
  monthlyIncome: Record<string, number>;
  monthlyWorkDays: Record<string, number>;
  monthlyRestDays: Record<string, number>;
  companyTotals: Record<string, number>;
  industryTotals: Record<string, number>;
  weekdayTotals: number[];
  weekdayCounts: number[];
  quarterlyIncome: [number, number, number, number];
  quarterlyWorkDays: [number, number, number, number];
  bestMonth: string; bestMonthIncome: number;
  avgMonthlyIncome: number;
  avgIncomePerWorkDay: number;
  avgHoursPerWorkDay: number;
}

function AnnualReportContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(parseInt(searchParams.get('year') || String(now.getFullYear())));
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState<'monthly' | 'weekday' | 'quarterly'>('monthly');

  useEffect(() => {
    const y = parseInt(searchParams.get('year') || String(now.getFullYear()));
    setYear(y);
  }, [searchParams]);

  const fetchData = useCallback(async (yr: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/income?year=' + yr + '&limit=500');
      const json = await res.json();
      if (json.success) {
        setIncomes(json.data.items);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchData(year); }, [year, user]);

  const goYear = (delta: number) => {
    const ny = year + delta;
    router.push('/income/annual?year=' + ny);
  };

  const stats = (() => {
    if (incomes.length === 0) return null as AnnualStats | null;
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalHours = incomes.reduce((s, i) => s + (i.hours || 0), 0);
    const totalRecords = incomes.length;
    const isLeap = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
    const totalDays = isLeap ? 366 : 365;

    const dateSet = new Set<string>();
    incomes.forEach(i => { if (i.date) dateSet.add(i.date.substring(0, 10)); });
    const workDays = dateSet.size;
    const restDays = Math.max(0, totalDays - workDays);
    const workRate = totalDays > 0 ? workDays / totalDays * 100 : 0;

    // Monthly breakdown
    const monthlyIncome: Record<string, number> = {};
    const monthlyWorkDays: Record<string, number> = {};
    const monthlyRestDays: Record<string, number> = {};
    const monthDateSets: Record<string, Set<string>> = {};

    for (let m = 1; m <= 12; m++) {
      const mk = year + '-' + String(m).padStart(2, '0');
      monthlyIncome[mk] = 0;
      monthlyWorkDays[mk] = 0;
      monthDateSets[mk] = new Set();
    }

    incomes.forEach(i => {
      if (!i.date) return;
      const mk = i.date.substring(0, 7);
      if (monthlyIncome[mk] !== undefined) {
        monthlyIncome[mk] += i.amount;
        monthDateSets[mk].add(i.date.substring(0, 10));
      }
    });

    for (let m = 1; m <= 12; m++) {
      const mk = year + '-' + String(m).padStart(2, '0');
      monthlyWorkDays[mk] = monthDateSets[mk].size;
      const daysInMonth = new Date(year, m, 0).getDate();
      monthlyRestDays[mk] = Math.max(0, daysInMonth - monthDateSets[mk].size);
    }

    // Company totals
    const companyTotals: Record<string, number> = {};
    incomes.forEach(i => {
      const c = i.company || '其他';
      companyTotals[c] = (companyTotals[c] || 0) + i.amount;
    });

    // Industry totals
    const industryTotals: Record<string, number> = {};
    incomes.forEach(i => {
      const ind = i.industry || '其他';
      industryTotals[ind] = (industryTotals[ind] || 0) + i.amount;
    });

    // Weekday analysis
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    incomes.forEach(i => {
      if (!i.date) return;
      const d = new Date(i.date);
      const wd = d.getDay();
      weekdayTotals[wd] += i.amount;
      weekdayCounts[wd]++;
    });

    // Quarterly
    const quarterlyIncome: [number, number, number, number] = [0, 0, 0, 0];
    const quarterlyWorkDays: [number, number, number, number] = [0, 0, 0, 0];
    for (let m = 1; m <= 12; m++) {
      const q = Math.floor((m - 1) / 3);
      const mk = year + '-' + String(m).padStart(2, '0');
      quarterlyIncome[q] += monthlyIncome[mk] || 0;
      quarterlyWorkDays[q] += monthlyWorkDays[mk] || 0;
    }

    // Best month
    let bestMonth = ''; let bestMonthIncome = 0;
    for (let m = 1; m <= 12; m++) {
      const mk = year + '-' + String(m).padStart(2, '0');
      if ((monthlyIncome[mk] || 0) > bestMonthIncome) {
        bestMonthIncome = monthlyIncome[mk] || 0;
        bestMonth = String(m) + '月';
      }
    }

    return {
      totalIncome, totalHours, totalRecords,
      workDays, restDays, totalDays, workRate,
      monthlyIncome, monthlyWorkDays, monthlyRestDays,
      companyTotals, industryTotals,
      weekdayTotals, weekdayCounts,
      quarterlyIncome, quarterlyWorkDays,
      bestMonth, bestMonthIncome,
      avgMonthlyIncome: totalIncome / 12,
      avgIncomePerWorkDay: workDays > 0 ? totalIncome / workDays : 0,
      avgHoursPerWorkDay: workDays > 0 ? totalHours / workDays : 0,
    } as AnnualStats;
  })();

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  if (!user) return <div className="text-center py-20 text-gray-500">请先登录</div>;

  const renderReport = () => {
    if (!stats) return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-gray-500 text-lg">{year}年暂无收入数据</p>
        <Link href="/income" className="mt-4 inline-block px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors">返回收入页面</Link>
      </div>
    );

    const sortedMonths = Object.keys(stats.monthlyIncome).sort();
    const labels = sortedMonths.map(m => parseInt(m.substring(5)) + '月');

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-sm sm:text-base text-green-100/80 font-medium">{year} 年度报告</p>
            <p className="text-3xl sm:text-5xl font-black mt-1">HK$ {stats.totalIncome.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
            <p className="text-green-100/70 text-sm mt-1">本年总收入</p>
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-xl sm:text-2xl font-bold">{stats.workDays}</p>
                <p className="text-[10px] sm:text-xs text-green-100/70">工作天数</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-xl sm:text-2xl font-bold">{stats.restDays}</p>
                <p className="text-[10px] sm:text-xs text-green-100/70">休息天数</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-xl sm:text-2xl font-bold">{stats.workRate.toFixed(0)}%</p>
                <p className="text-[10px] sm:text-xs text-green-100/70">出勤率</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: '总工时', value: stats.totalHours.toFixed(1) + ' h', icon: '⏱️', color: 'from-blue-50 to-cyan-50 border-blue-100', textColor: 'text-blue-700' },
            { label: '月均收入', value: 'HK$ ' + stats.avgMonthlyIncome.toFixed(2), icon: '📊', color: 'from-purple-50 to-pink-50 border-purple-100', textColor: 'text-purple-700' },
            { label: '日均收入', value: 'HK$ ' + stats.avgIncomePerWorkDay.toFixed(2), icon: '💰', color: 'from-amber-50 to-orange-50 border-amber-100', textColor: 'text-amber-700' },
            { label: '最佳月', value: stats.bestMonth, sub: 'HK$ ' + stats.bestMonthIncome.toFixed(2), icon: '🏆', color: 'from-rose-50 to-red-50 border-rose-100', textColor: 'text-rose-700' },
          ].map((card, i) => (
            <div key={i} className={'rounded-xl p-3 sm:p-4 border shadow-sm bg-gradient-to-br ' + card.color}>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">{card.icon} {card.label}</p>
              <p className={'text-base sm:text-xl font-extrabold mt-1 ' + card.textColor}>{card.value}</p>
              {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
            </div>
          ))}
        </div>

        {/* Monthly Income Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700">📈 月度收入走势</h3>
            <div className="flex gap-1">
              {(['monthly', 'weekday', 'quarterly'] as const).map(t => (
                <button key={t} onClick={() => setShowChart(t)}
                  className={'text-xs px-2.5 py-1 rounded-full font-medium transition-all ' + (showChart === t ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                  {t === 'monthly' ? '月度' : t === 'weekday' ? '星期' : '季度'}
                </button>
              ))}
            </div>
          </div>
          {showChart === 'monthly' && (
            <Bar data={{
              labels,
              datasets: [{
                label: '收入 (HK$)',
                data: sortedMonths.map(m => stats.monthlyIncome[m]),
                backgroundColor: sortedMonths.map((_, i) => chartColors[i % chartColors.length] + '33'),
                borderColor: sortedMonths.map((_, i) => chartColors[i % chartColors.length]),
                borderWidth: 2, borderRadius: 6,
              }]
            }} options={{
              responsive: true,
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => 'HK$ ' + Number(ctx.raw).toLocaleString() } } },
              scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => 'HK$' + v.toLocaleString() } } }
            }} />
          )}
          {showChart === 'weekday' && (
            <Bar data={{
              labels: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
              datasets: [{
                label: '收入 (HK$)',
                data: stats.weekdayTotals,
                backgroundColor: ['#EF444433','#F59E0B33','#10B98133','#3B82F633','#8B5CF633','#EC489933','#EF444433'],
                borderColor: ['#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899','#EF4444'],
                borderWidth: 2, borderRadius: 6,
              }]
            }} options={{
              responsive: true,
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => 'HK$ ' + Number(ctx.raw).toLocaleString() + ' (' + stats.weekdayCounts[ctx.dataIndex] + '次)' } } },
              scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => 'HK$' + v.toLocaleString() } } }
            }} />
          )}
          {showChart === 'quarterly' && (
            <Bar data={{
              labels: ['Q1 (1-3月)', 'Q2 (4-6月)', 'Q3 (7-9月)', 'Q4 (10-12月)'],
              datasets: [{
                label: '收入 (HK$)',
                data: stats.quarterlyIncome,
                backgroundColor: ['#10B98133','#3B82F633','#F59E0B33','#EF444433'],
                borderColor: ['#10B981','#3B82F6','#F59E0B','#EF4444'],
                borderWidth: 2, borderRadius: 6,
              }]
            }} options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => 'HK$' + v.toLocaleString() } } }
            }} />
          )}
        </div>

        {/* Work / Rest Monthly Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">📅 每月工作 vs 休息</h3>
            <Bar data={{
              labels,
              datasets: [
                { label: '工作天数', data: sortedMonths.map(m => stats.monthlyWorkDays[m] || 0), backgroundColor: '#3B82F633', borderColor: '#3B82F6', borderWidth: 2, borderRadius: 4 },
                { label: '休息天数', data: sortedMonths.map(m => stats.monthlyRestDays[m] || 0), backgroundColor: '#F59E0B33', borderColor: '#F59E0B', borderWidth: 2, borderRadius: 4 },
              ],
            }} options={{
              responsive: true,
              plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 5 } } }
            }} />
          </div>

          {/* Company Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">🏢 公司收入分布</h3>
            {Object.keys(stats.companyTotals).length > 0 && (
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
                  <Doughnut data={{
                    labels: Object.keys(stats.companyTotals),
                    datasets: [{ data: Object.values(stats.companyTotals), backgroundColor: chartColors.slice(0, Object.keys(stats.companyTotals).length), borderWidth: 0 }]
                  }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
                <div className="flex-1 space-y-1.5">
                  {Object.entries(stats.companyTotals).sort((a: any, b: any) => b[1] - a[1]).map(([com, amt], i) => {
                    const pct = stats.totalIncome > 0 ? (Number(amt) / stats.totalIncome * 100) : 0;
                    return (
                      <div key={com} className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                          <span className="text-gray-600 truncate max-w-[60px] sm:max-w-[100px]">{com}</span>
                        </div>
                        <span className="font-medium text-gray-800 text-[10px] sm:text-xs">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Analysis Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {/* Most Worked Weekday */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-3 sm:p-4 border border-indigo-100 shadow-sm">
            <p className="text-[10px] text-indigo-500 font-medium">📅 最常工作日</p>
            {(function() {
              const maxCount = Math.max(...stats.weekdayCounts);
              const idx = stats.weekdayCounts.indexOf(maxCount);
              const names = ['周日','周一','周二','周三','周四','周五','周六'];
              const totalWork = stats.weekdayCounts.reduce((a,b) => a+b, 0);
              return <>
                <p className="text-lg font-extrabold text-indigo-700 mt-0.5">{names[idx]}</p>
                <p className="text-[10px] text-indigo-400 mt-0.5">{maxCount}次 ({totalWork > 0 ? (maxCount/totalWork*100).toFixed(0) : 0}%)</p>
              </>;
            })()}
          </div>

          {/* Best Month */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 sm:p-4 border border-amber-100 shadow-sm">
            <p className="text-[10px] text-amber-500 font-medium">🏆 最高收入月</p>
            <p className="text-lg font-extrabold text-amber-700 mt-0.5">{stats.bestMonth}</p>
            <p className="text-[10px] text-amber-400 mt-0.5">HK$ {stats.bestMonthIncome.toLocaleString()}</p>
          </div>

          {/* Total Records */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 border border-green-100 shadow-sm">
            <p className="text-[10px] text-green-500 font-medium">📋 总记录数</p>
            <p className="text-lg font-extrabold text-green-700 mt-0.5">{stats.totalRecords}</p>
            <p className="text-[10px] text-green-400 mt-0.5">笔收入记录</p>
          </div>

          {/* Rest rate trend */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-3 sm:p-4 border border-rose-100 shadow-sm">
            <p className="text-[10px] text-rose-500 font-medium">🌙 年休息率</p>
            <p className="text-lg font-extrabold text-rose-700 mt-0.5">{stats.restDays}天</p>
            <p className="text-[10px] text-rose-400 mt-0.5">休息率 {((1 - stats.workRate/100)*100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Monthly Rest Days Detail */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">🌙 每月休息天数</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {sortedMonths.map((m, i) => {
              const rest = stats.monthlyRestDays[m] || 0;
              const total = new Date(year, parseInt(m.substring(5)), 0).getDate();
              const pct = total > 0 ? (rest / total * 100) : 0;
              return (
                <div key={m} className="text-center p-2 sm:p-3 rounded-xl bg-gradient-to-b from-gray-50 to-white border border-gray-100">
                  <p className="text-xs font-bold text-gray-700">{parseInt(m.substring(5))}月</p>
                  <p className="text-lg font-extrabold text-amber-600 mt-0.5">{rest}</p>
                  <p className="text-[10px] text-gray-400">/{total}天</p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: pct.toFixed(0) + '%' }} />
                  </div>
                  <p className="text-[9px] text-amber-500 mt-0.5">{pct.toFixed(0)}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekday Analysis */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📅 星期工作分析</h3>
          <div className="grid grid-cols-7 gap-2">
            {['日','一','二','三','四','五','六'].map((d, i) => {
              const maxCnt = Math.max(...stats.weekdayCounts);
              const cnt = stats.weekdayCounts[i];
              const pct = maxCnt > 0 ? (cnt / maxCnt * 100) : 0;
              const inc = stats.weekdayTotals[i];
              const total = stats.weekdayTotals.reduce((a, b) => a + b, 0);
              const incPct = total > 0 ? (inc / total * 100) : 0;
              return (
                <div key={d} className="text-center p-2 sm:p-3 rounded-xl border" style={{ borderColor: cnt === maxCnt ? '#10B981' : '#f0f0f0', backgroundColor: cnt === maxCnt ? '#F0FDF4' : 'white' }}>
                  <p className="text-xs font-bold text-gray-600">周{d}</p>
                  <p className="text-lg sm:text-xl font-extrabold text-gray-800 mt-0.5">{cnt}</p>
                  <p className="text-[9px] text-gray-400">次工作</p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: pct + '%', backgroundColor: chartColors[i % chartColors.length] }} />
                  </div>
                  <p className="text-[9px] mt-0.5 font-medium" style={{ color: chartColors[i % chartColors.length] }}>{incPct.toFixed(0)}%收入</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quarterly Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📊 季度总结</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[['Q1','1-3月'],['Q2','4-6月'],['Q3','7-9月'],['Q4','10-12月']].map(([q, months], i) => {
              const qIncome = stats.quarterlyIncome[i];
              const qWork = stats.quarterlyWorkDays[i];
              const pct = stats.totalIncome > 0 ? (qIncome / stats.totalIncome * 100) : 0;
              return (
                <div key={q} className="rounded-xl p-3 border shadow-sm text-center" style={{ borderColor: chartColors[i] + '44', backgroundColor: chartColors[i] + '11' }}>
                  <p className="text-xs font-bold text-gray-600">{q}</p>
                  <p className="text-[10px] text-gray-400">{months}</p>
                  <p className="text-base sm:text-lg font-extrabold mt-1" style={{ color: chartColors[i] }}>HK$ {qIncome.toLocaleString()}</p>
                  <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: pct.toFixed(0) + '%', backgroundColor: chartColors[i] }} />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">{pct.toFixed(0)}% · {qWork}工作日</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <Link href="/income" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">年度报告</h1>
            <p className="text-xs sm:text-sm text-gray-400">📊 全年收入数据深度分析</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => goYear(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-all hover:shadow-sm active:scale-90">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-base sm:text-xl font-bold text-green-800 min-w-[80px] text-center">{year}年</span>
          <button onClick={() => goYear(1)} className="p-2 hover:bg-gray-100 rounded-xl transition-all hover:shadow-sm active:scale-90">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-3">加载年度数据...</p>
        </div>
      ) : renderReport()}
    </div>
  );
}

export default function AnnualReportPage() {
  return <Suspense fallback={<div className='flex items-center justify-center min-h-screen'><div className='w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin' /></div>}><AnnualReportContent /></Suspense>;
}
