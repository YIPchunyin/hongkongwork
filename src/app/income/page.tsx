'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface IncomeItem {
  _id: string;
  date: string;
  amount: number;
  category: string;
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

  const chartColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];
  const chartBgColors = chartColors.map(c => c + '33');

export default function IncomePage() {
  const { user, loading } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | null>(now.getMonth() + 1);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<IncomeItem | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('地盘');
  const [formNote, setFormNote] = useState('');
  const [formShift, setFormShift] = useState('早班');
  const [formHours, setFormHours] = useState('');
  const [formIndustry, setFormIndustry] = useState('地盘');
  const [formCompany, setFormCompany] = useState('国益');
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);

  const companyColor = (com: string) => {
    const colors: Record<string, string> = {
      '国益': '#DC2626',   // 红色 - 最鲜艳
      '煌府': '#2563EB',   // 蓝色
      '益哥': '#16A34A',   // 绿色
      '司': '#D97706',         // 橙色 - 公司
    };
    return colors[com] || '#9333EA';  // 紫色 - 默认
  };

  const buildCalendarDays = (yr: number, mo: number, items: IncomeItem[]) => {
    const daysInMonth = new Date(yr, mo, 0).getDate();
    const firstDay = new Date(yr, mo - 1, 1).getDay();
    const dayMap: Record<number, { dateNum: number; total: number; records: IncomeItem[]; companies: string[] }> = {};
    items.forEach(item => {
      if (!item.date) return;
      const d = parseInt(item.date.substring(8, 10));
      if (!dayMap[d]) dayMap[d] = { dateNum: d, total: 0, records: [], companies: [] as string[] };
      dayMap[d].total += item.amount;
      dayMap[d].records.push(item);
      if (item.company && !dayMap[d].companies.includes(item.company)) dayMap[d].companies.push(item.company);
    });
    const weeks: any[][] = [];
    let week: any[] = [];
    for (let i = 0; i < firstDay; i++) week.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(dayMap[d] || { dateNum: d, total: 0, records: [], companies: [] as string[] });
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }
    return weeks;
  };

  const renderShiftGroup = (recs: IncomeItem[]) => {
    const groups: Record<string, number> = {};
    recs.forEach(r => {
      const key = r.company || '其他';
      groups[key] = (groups[key] || 0) + r.amount;
    });
    return Object.entries(groups).map(([com, amt]) => (
      <div key={com} className="flex items-center gap-0.5 text-[9px] sm:text-[10px] leading-tight">
        <span className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: companyColor(com) }} />
        <span className="font-bold" style={{ color: companyColor(com) }}>+{amt.toFixed(0)}</span>
      </div>
    ));
  };
  const monthKey = year + '-' + String(month).padStart(2, '0');
  const monthLabel = year + '\u5e74' + String(month).padStart(2, '0') + '\u6708';

  const fetchIncomes = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/income?year=' + (year || '') + '&month=' + (month ? String(month) : '') + '&page=' + page + '&limit=100');
      const json = await res.json();
      if (json.success) {
        setIncomes(json.data.items);
        setStats(json.data.stats);
      }
    } catch {} finally { setFetching(false); }
  }, [year, month, page]);

  useEffect(() => { if (user) fetchIncomes(); }, [user, fetchIncomes]);

  const openAdd = () => {
    setEditItem(null);
    setFormDate(new Date().toISOString().slice(0, 16).replace('T', ' '));
    setFormAmount('');
    setFormCategory('地盘');
    setFormNote('');
    setFormShift('早班');
    setFormHours('');
    setFormIndustry('地盘');
    setFormCompany('国益');
    setShowModal(true);
  };

  const openEdit = (item: IncomeItem) => {
    setEditItem(item);
    setFormDate(item.date);
    setFormAmount(String(item.amount));
    setFormCategory(item.category);
    setFormNote(item.note);
    setFormShift(item.shift);
    setFormHours(String(item.hours));
    setFormIndustry(item.industry);
    setFormCompany(item.company);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formAmount) { alert('请填写日期和金额'); return; }
    setSaving(true);
    try {
      const body = {
        date: formDate, amount: parseFloat(formAmount),
        category: formCategory, note: formNote,
        shift: formShift, hours: formHours ? parseFloat(formHours) : 0,
        industry: formIndustry, company: formCompany,
      };
      let res;
      if (editItem) {
        res = await fetch('/api/income/' + editItem._id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        res = await fetch('/api/income', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchIncomes();
      } else {
        alert(json.error || '保存失败');
      }
    } catch { alert('保存失败'); }
    finally { setSaving(false); }
  };

  const deleteIncome = async (id: string) => {
    if (!confirm('\u786e\u5b9a\u5220\u9664\u8fd9\u6761\u6536\u5165\u8bb0\u5f55\uff1f')) return;
    try {
      const res = await fetch('/api/income/' + id, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchIncomes();
      else alert(json.error || '删除失败');
    } catch { alert('删除失败'); }
  };

  // Month navigation
  const prevMonth = () => { if (month === null) return; if (month === 1) { setYear(year - 1); setMonth(12); } else { setMonth(month - 1); } setPage(1); };
  const nextMonth = () => { if (month === null) return; if (month === 12) { setYear(year + 1); setMonth(1); } else { setMonth(month + 1); } setPage(1); };

  if (!loading && !user) return <div className="text-center py-20 text-gray-500">请先登录</div>;

  const statCards = stats ? [
    { label: monthLabel + ' 收入', value: 'HK$ ' + stats.totalIncome.toFixed(2), color: 'text-green-600' },
    { label: monthLabel + ' 工时', value: stats.totalHours.toFixed(1) + ' h', color: 'text-blue-600' },
    { label: monthLabel + ' 笔数', value: stats.totalRecords + ' 笔', color: 'text-gray-800' },
    { label: '时薪', value: stats.totalHours > 0 ? 'HK$ ' + (stats.totalIncome / stats.totalHours).toFixed(2) : '-', color: 'text-purple-600' },
  ] : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200/50">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">收入记录</h1>
            <p className="text-xs sm:text-sm text-gray-400">记录每一笔收入</p>
          </div>
        </div>
        <button onClick={openAdd} className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-green-200/50 hover:scale-105 active:scale-95 transition-all duration-200 min-h-[44px] inline-flex items-center gap-1.5 shadow-md">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          新增收入
        </button>
      </div>

      {/* Month selector */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-3 sm:p-4 mb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 hover:bg-white/70 rounded-xl transition-all hover:shadow-sm active:scale-90">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-xl font-bold text-green-800">{monthLabel}</span>
            {stats && <span className="text-xs sm:text-sm font-medium text-green-500 bg-green-100 px-2.5 py-1 rounded-full">HK$ {stats.totalIncome.toFixed(0)}</span>}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-white/70 rounded-xl transition-all hover:shadow-sm active:scale-90">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {statCards.map((card, i) => (
            <div key={i} className={'rounded-xl p-3 sm:p-4 border shadow-sm card-hover ' + (i === 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-white border-gray-100')}>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide">{card.label}</p>
              <p className={'text-lg sm:text-2xl font-extrabold mt-1 ' + card.color}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Analytics */}
      {stats && month && year && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
          {(() => {
            const daysInMonth = new Date(year, month, 0).getDate();
            const workDays = incomes.length > 0 ? new Set(incomes.map((i: any) => parseInt(i.date?.substring(8, 10)) || 0)).size : 0;
            const restDays = daysInMonth - workDays;
            const avgDaily = workDays > 0 ? stats.totalIncome / workDays : 0;
            const workRate = daysInMonth > 0 ? (workDays / daysInMonth * 100).toFixed(0) : '0';
            const dailyTotals: Record<number, number> = {};
            incomes.forEach((i: any) => {
              if (i.date?.substring(0, 7) === year + '-' + String(month).padStart(2, '0')) {
                const d = parseInt(i.date.substring(8, 10));
                dailyTotals[d] = (dailyTotals[d] || 0) + i.amount;
              }
            });
            const bestDay = Object.values(dailyTotals).length > 0 ? Math.max(...Object.values(dailyTotals)) : 0;
            return <>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100 shadow-sm">
                <p className="text-[10px] text-purple-500 font-medium">工作天数</p>
                <p className="text-lg font-extrabold text-purple-700 mt-0.5">{workDays}<span className="text-xs font-medium text-purple-400"> / {daysInMonth}天</span></p>
                <p className="text-[10px] text-purple-400 mt-0.5">出勤率 {workRate}%</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100 shadow-sm">
                <p className="text-[10px] text-amber-500 font-medium">放假天数</p>
                <p className="text-lg font-extrabold text-amber-700 mt-0.5">{restDays}<span className="text-xs font-medium text-amber-400"> 天</span></p>
                <p className="text-[10px] text-amber-400 mt-0.5">{'☾'.repeat(Math.min(restDays, 5))}{restDays > 5 ? '...' : ''}</p>
              </div>
              <div className="rounded-xl p-3 border shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                <p className="text-[10px] text-blue-500 font-medium">日均收入</p>
                <p className="text-lg font-extrabold text-blue-700 mt-0.5">HK$ {avgDaily.toFixed(0)}</p>
                <p className="text-[10px] text-blue-400 mt-0.5">每工作日</p>
              </div>
              <div className="rounded-xl p-3 border shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                <p className="text-[10px] text-green-500 font-medium">最佳日</p>
                <p className="text-lg font-extrabold text-green-700 mt-0.5">HK$ {bestDay}</p>
                <p className="text-[10px] text-green-400 mt-0.5">单日最高</p>
              </div>
            </>;
          })()}
        </div>
      )}

      {/* Calendar View */}
      {fetching ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-2 sm:p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
            {['日','一','二','三','四','五','六'].map(d => (
              <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 py-1 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          {month && year && buildCalendarDays(year, month, incomes).map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="min-h-[60px] sm:min-h-[80px]" />;
                const { dateNum, records } = day;
                const hasData = records.length > 0;
                // Group records by shift
                const morningRecs = records.filter((r: any) => r.shift === '早班' || r.shift === '日班');
                const nightRecs = records.filter((r: any) => r.shift === '晚班');
                const otherRecs = records.filter((r: any) => r.shift !== '早班' && r.shift !== '日班' && r.shift !== '晚班');
                return (
                  <button key={di}
                    onClick={() => hasData && setSelectedDay(day)}
                    className={'min-h-[60px] sm:min-h-[80px] rounded-lg p-1 text-left transition-all overflow-hidden ' + (hasData ? 'hover:shadow-md hover:ring-2 hover:ring-green-200 cursor-pointer bg-gradient-to-b from-white to-green-50/30' : '')}
                  >
                    <span className={'text-xs font-medium ' + (hasData ? 'text-gray-800' : 'text-gray-300')}>{dateNum}</span>
                    {hasData && (
                      <div className="mt-0.5 space-y-0.5">
                        {renderShiftGroup(morningRecs)}
                        {renderShiftGroup(nightRecs)}
                        {renderShiftGroup(otherRecs)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Day Detail Popup */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelectedDay(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 max-h-[70vh] overflow-y-auto border border-green-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{year}年{String(month).padStart(2, '0')}月{String(selectedDay.dateNum).padStart(2, '0')}日</h3>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-1.5 hover:bg-red-50 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="text-right mb-3">
              <span className="text-2xl font-bold text-green-600">HK$ {selectedDay.total.toFixed(2)}</span>
              <span className="text-sm text-gray-400 ml-2">{selectedDay.records.length} 笔</span>
            </div>
            <div className="space-y-2 divide-y divide-gray-100">
              {selectedDay.records.map((item: any) => (
                <div key={item._id} className="pt-2 first:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: companyColor(item.company), boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-medium">{item.category || '未分类'}</span>
                    {item.shift && <span className="text-xs text-gray-400">{item.shift}</span>}
                    {item.company && <span className="text-xs text-gray-400">{item.company}</span>}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div>
                      <span className="font-bold text-gray-800">HK$ {item.amount.toFixed(2)}</span>
                      {item.hours > 0 && <span className="text-xs text-gray-400 ml-2">{item.hours}h</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(item); setSelectedDay(null); }} className="text-xs text-blue-400 hover:text-blue-600">编辑</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteIncome(item._id); setSelectedDay(null); }} className="text-xs text-red-400 hover:text-red-600">删除</button>
                    </div>
                  </div>
                  {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts & Analysis */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4">
          {/* Monthly Trend */}
          {Object.keys(stats.monthlyTotals).length > 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5 card-hover">
              <h3 className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                月度收入趋势
              </h3>
              <Bar data={{
                labels: Object.keys(stats.monthlyTotals).sort(),
                datasets: [{ label: '收入 (HK$)', data: Object.keys(stats.monthlyTotals).sort().map(m => stats.monthlyTotals[m]), backgroundColor: '#10B98133', borderColor: '#10B981', borderWidth: 2, borderRadius: 4 }]
              }} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => 'HK$' + v } } } }} />
            </div>
          )}

          {/* Industry Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">行业分布</h3>
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">公司收入</h3>
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
                    <div className="h-full rounded-full transition-all" style={{ width: pct.toFixed(1) + '%', backgroundColor: chartColors[i % chartColors.length] }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shift Analysis */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">班次分析</h3>
            {Object.keys(stats.shiftTotals).length > 0 && (
              <div className="space-y-2">
                {Object.entries(stats.shiftTotals).sort((a: any, b: any) => b[1] - a[1]).map(([sh, total], i) => (
                  <div key={sh} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                      <span className="text-sm text-gray-600">{sh}</span>
                    </div>
                    <span className="text-sm font-medium">HK$ {Number(total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto border border-green-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{editItem ? '编辑收入' : '新增收入'}</h2>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期时间</label>
                <input type="datetime-local" value={formDate.replace(' ', 'T')} onChange={e => setFormDate(e.target.value.replace('T', ' '))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金额 (HK$)</label>
                  <input type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工时 (小时)</label>
                  <input type="number" step="0.5" value={formHours} onChange={e => setFormHours(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">行业</label>
                  <select value={formIndustry} onChange={e => setFormIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option>地盘</option>
                    <option>酒楼</option>
                    <option>补贴</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">公司</label>
                  <select value={formCompany} onChange={e => setFormCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option>国益</option>
                    <option>煌府</option>
                    <option>益哥</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">二级分类</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option>地盘</option>
                    <option>其他</option>
                    <option>补贴</option>
                    <option>半工地盤</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">班次</label>
                  <select value={formShift} onChange={e => setFormShift(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option>早班</option>
                    <option>晚班</option>
                    <option>半工</option>
                    <option>日班</option>
                    <option>补贴</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="选填"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {saving ? '保存中...' : (editItem ? '保存修改' : '添加记录')}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
